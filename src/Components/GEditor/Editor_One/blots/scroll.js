import Quill from "quill";
import { isRcCompontent } from '../common';
import QUEUE from '../idleQueue';
import Emitter from "quill/core/emitter";

const Parchment = Quill.import('parchment');
const { ParentBlot, ScrollBlot, Registry } = Parchment;

const Q_Scroll = Quill.import('blots/scroll');
const MAX_OPTIMIZE_ITERATIONS = 100;

export default class Scroll extends Q_Scroll {
	update(mutations) {
		if(Array.isArray(mutations)) {
			mutations = mutations.filter(item => {
				return !isRcCompontent(item.target);
			});
		}
		super.update(mutations);
	}

	batchEndAsync() {
		const mutations = this.batch;
		this.batch = false;
		this.updateAsync(mutations);
	}

	updateAsync(mutations) {
		if (this.batch) {
			if (Array.isArray(mutations)) {
				this.batch = this.batch.concat(mutations);
			}
			return;
		}
		let source = Emitter.sources.USER;
		if (typeof mutations === 'string') {
			source = mutations;
		}
		if (!Array.isArray(mutations)) {
			mutations = this.observer.takeRecords();
		}
		if (mutations.length > 0) {
			this.emitter.emit(Emitter.events.SCROLL_BEFORE_UPDATE, source, mutations);
		}

		QUEUE.queueTasks(() => {
			super.updateAsync(mutations.concat([])); // pass copy
		}, () => {
			if (mutations.length > 0) {
				this.emitter.emit(Emitter.events.SCROLL_UPDATE, source, mutations);
			}
		});

	}

}

export class _ScrollBlot extends ScrollBlot {
  updateAsync(mutations, context = {}) {
    mutations = mutations || this.observer.takeRecords();
    const mutationsMap = new WeakMap();
    mutations
      .map((mutation) => {
        const blot = Registry.find(mutation.target, true);
        if (blot == null) {
          return null;
        }
        if (mutationsMap.has(blot.domNode)) {
          mutationsMap.get(blot.domNode).push(mutation);
          return null;
        } else {
          mutationsMap.set(blot.domNode, [mutation]);
          return blot;
        }
      })
      .forEach((blot) => {
        if (blot != null && blot !== this && mutationsMap.has(blot.domNode)) {
          blot.update(mutationsMap.get(blot.domNode) || [], context);
        }
      });
    context.mutationsMap = mutationsMap;
    if (mutationsMap.has(this.domNode)) {
      // super.update(mutationsMap.get(this.domNode), context);
			ParentBlot.prototype.update.call(this, mutationsMap.get(this.domNode), context);
    }
    this.optimizeAsync(mutations, context);
  }

  optimizeAsync(mutations, context) {
    const that = this;
		ParentBlot.prototype.optimize.call(this);
    // super.optimize();
    const mutationsMap = context.mutationsMap || new WeakMap();
    // We must modify mutations directly, cannot make copy and then modify
    let records = Array.from(that.observer.takeRecords());
    // Array.push currently seems to be implemented by a non-tail recursive function
    // so we cannot just mutations.push.apply(mutations, this.observer.takeRecords());
    while (records.length > 0) {
      mutations.push(records.pop());
    }
    const mark = (blot, markParent = true) => {
      if (blot == null || blot === that) {
        return;
      }
      if (blot.domNode.parentNode == null) {
        return;
      }
      if (!mutationsMap.has(blot.domNode)) {
        mutationsMap.set(blot.domNode, []);
      }
      if (markParent) {
        mark(blot.parent);
      }
    };
    const optimize = (blot) => {
      // Post-order traversal
      if (!mutationsMap.has(blot.domNode)) {
        return;
      }
      if (blot instanceof ParentBlot) {
        blot.children.forEach(optimize);
      }
      mutationsMap.delete(blot.domNode);
      blot.optimize(context);
    };
    let remaining = mutations;
    let i = 0;
    const remainingCal = () => {
			QUEUE.queueTasks(
				() => {
					if (i >= MAX_OPTIMIZE_ITERATIONS) {
						throw new Error('[Parchment] Maximum optimize iterations reached');
					}
					remaining.forEach((mutation) => {
						const blot = that.find(mutation.target, true);
						if (blot == null) {
							return;
						}
						if (blot.domNode === mutation.target) {
							if (mutation.type === 'childList') {
								mark(that.find(mutation.previousSibling, false));
								Array.from(mutation.addedNodes).forEach((node) => {
									const child = that.find(node, false);
									mark(child, false);
									if (child instanceof ParentBlot) {
										child.children.forEach((grandChild) => {
											mark(grandChild, false);
										});
									}
								});
							} else if (mutation.type === 'attributes') {
								mark(blot.prev);
							}
						}
						mark(blot);
					});
				},
				...(() => {
					let optimizeQueue = [];
					that.children.forEach((blot) => {
						optimizeQueue.push(() => {
							optimize(blot);
						})
					});

					return optimizeQueue;
				})(),
				() => {
					remaining = Array.from(that.observer.takeRecords());
					records = remaining.slice();
					while (records.length > 0) {
						mutations.push(records.pop());
					}
				}, () => {
					if(remaining.length > 0) {
						i++;
						remainingCal();
					}
				}
			);

    }

    remainingCal();
  }
}