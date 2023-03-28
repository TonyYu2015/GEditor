import OriginQuill from "quill";
import equal from "fast-deep-equal";
import { AttributeMap } from 'quill-delta';
import extend from 'extend';
import { bubbleFormats } from 'quill/blots/block';
import CursorBlot from 'quill/blots/cursor';
import { Range } from 'quill/core/selection';
import Emitter from "quill/core/emitter";
import QUEUE from './idleQueue';
import { _ScrollBlot } from "./blots/scroll";

const BlockEmbed = OriginQuill.import('blots/block/embed');
const Block = OriginQuill.import('blots/block');
const Parchment = OriginQuill.import('parchment');
const Delta = OriginQuill.import('delta');
const { LeafBlot } = Parchment;

const ASCII = /^[ -~]*$/;

function shiftRange({ index, length }, amount) {
  return new Range(index + amount, length);
}



class Quill extends OriginQuill {
  constructor(container, options = {}) {
    super(container, options);
    let _this = this;
    // 添加table的matcher
    // this.addTableMatcher();

    this.editor.update = function(change, mutations = [], selectionInfo = undefined) {
      const oldDelta = this.delta;
      if (
        mutations.length === 1 &&
        mutations[0].type === 'characterData' &&
        mutations[0].target.data.match(ASCII) &&
        this.scroll.find(mutations[0].target)
      ) {
        // Optimization for character changes
        const textBlot = this.scroll.find(mutations[0].target);
        const formats = bubbleFormats(textBlot);
        const index = textBlot.offset(this.scroll);
        const oldValue = mutations[0].oldValue.replace(CursorBlot.CONTENTS, '');
        const oldText = new Delta().insert(oldValue);
        const newText = new Delta().insert(textBlot.value());
        const relativeSelectionInfo = selectionInfo && {
          oldRange: shiftRange(selectionInfo.oldRange, -index),
          newRange: shiftRange(selectionInfo.newRange, -index),
        };
        const diffDelta = new Delta()
          .retain(index)
          .concat(oldText.diff(newText, relativeSelectionInfo));
        change = diffDelta.reduce((delta, op) => {
          if (op.insert) {
            return delta.insert(op.insert, formats);
          }
          return delta.push(op);
        }, new Delta());
        this.delta = oldDelta.compose(change);
      } else {
        this.delta = this.getDelta();
        if (!change || !equal(oldDelta.compose(change), this.delta)) {
          change = oldDelta.diff(this.delta, selectionInfo);
        }
      }
      return change;
    }


    this.editor.applyDeltaAsync = async (delta) => {
      let consumeNextNewline = false;
      this.scroll.update();
      let scrollLength = this.scroll.length();
      if(scrollLength > 1 && _this.isLoadingRender) {
        scrollLength++;
      }
      this.scroll.batchStart();
      const normalizedDelta = normalizeDelta(delta);
      await new Promise((resolve, reject) => {
        let index = 0;
        // for(let i = 0; i < normalizedDelta.ops.length; i++) {
        //   QUEUE.pushTask(() => {
        //     let op = normalizedDelta.ops[i];
        //     const length = op.retain || op.delete || op.insert.length || 1;
        //     let attributes = op.attributes || {};
        //     if (op.insert != null) {
        //       if (typeof op.insert === 'string') {
        //         let text = op.insert;
        //         if (text.endsWith('\n') && consumeNextNewline) {
        //           consumeNextNewline = false;
        //           text = text.slice(0, -1);
        //         }
        //         if (
        //           (index >= scrollLength ||
        //             this.scroll.descendant(BlockEmbed, index)[0]) &&
        //           !text.endsWith('\n')
        //         ) {
        //           consumeNextNewline = true;
        //         }
        //         this.scroll.insertAt(index, text);
        //         const [line, offset] = this.scroll.line(index);
        //         let formats = extend({}, bubbleFormats(line));
        //         if (line instanceof Block) {
        //           const [leaf] = line.descendant(LeafBlot, offset);
        //           formats = extend(formats, bubbleFormats(leaf));
        //         }
        //         attributes = AttributeMap.diff(formats, attributes) || {};
        //       } else if (typeof op.insert === 'object') {
        //         const key = Object.keys(op.insert)[0]; // There should only be one key
        //         if (key == null) return index;
        //         this.scroll.insertAt(index, key, op.insert[key]);
        //       }
        //       scrollLength += length;
        //     }
        //     Object.keys(attributes).forEach(name => {
        //       this.scroll.formatAt(index, length, name, attributes[name]);
        //     });
        //     index += length;
        //   });
        // }

        // QUEUE.pushTask(() => {
        //   normalizedDelta.reduce((index, op) => {
        //     if (typeof op.delete === 'number') {
        //       this.scroll.deleteAt(index, op.delete);
        //       return index;
        //     }
        //     return index + (op.retain || op.insert.length || 1);
        //   }, 0);
        // });

        normalizedDelta.reduce((index, op) => {
          const length = op.retain || op.delete || op.insert.length || 1;
          let attributes = op.attributes || {};
          if (op.insert != null) {
            if (typeof op.insert === 'string') {
              let text = op.insert;
              if (text.endsWith('\n') && consumeNextNewline) {
                consumeNextNewline = false;
                text = text.slice(0, -1);
              }
              if (
                (index >= scrollLength ||
                  this.scroll.descendant(BlockEmbed, index)[0]) &&
                !text.endsWith('\n')
              ) {
                consumeNextNewline = true;
              }
              this.scroll.insertAt(index, text);
              const [line, offset] = this.scroll.line(index);
              let formats = extend({}, bubbleFormats(line));
              if (line instanceof Block) {
                const [leaf] = line.descendant(LeafBlot, offset);
                formats = extend(formats, bubbleFormats(leaf));
              }
              attributes = AttributeMap.diff(formats, attributes) || {};
            } else if (typeof op.insert === 'object') {
              const key = Object.keys(op.insert)[0]; // There should only be one key
              if (key == null) return index;
              this.scroll.insertAt(index, key, op.insert[key]);
            }
            scrollLength += length;
          }
          Object.keys(attributes).forEach(name => {
            this.scroll.formatAt(index, length, name, attributes[name]);
          });
          return index + length;
        }, 0);

        normalizedDelta.reduce((index, op) => {
          if (typeof op.delete === 'number') {
            this.scroll.deleteAt(index, op.delete);
            return index;
          }
          return index + (op.retain || op.insert.length || 1);
        }, 0);

        QUEUE.pushTask(() => {
          this.scroll.batchEndAsync();
        });

        QUEUE.pushTask(() => {
          this.scroll.optimize();
          resolve();
        });
      });

      let tmp = this.editor.update(normalizedDelta);
      return  tmp;
    }

    this.scroll.__proto__.__proto__.__proto__ = _ScrollBlot.prototype;
  }

  setContentsAsync(delta, source = Emitter.sources.API) {
    return modifyAsync.call(
      this,
      async () => {
        delta = new Delta(delta);
        const length = this.getLength();
        const deleted = this.editor.deleteText(0, length);
        const applied = await this.editor.applyDeltaAsync(delta);
        const lastOp = applied.ops[applied.ops.length - 1];
        if (
          lastOp != null &&
          typeof lastOp.insert === 'string' &&
          lastOp.insert[lastOp.insert.length - 1] === '\n'
        ) {
          this.editor.deleteText(this.getLength() - 1, 1);
          applied.delete(1);
        }
        return deleted.compose(applied);
      },
      source,
    );
  }

  updateContentsAsync(delta, source = Emitter.sources.API) {
    return modifyAsync.call(
      this,
      async () => {
        delta = new Delta(delta);
        return await this.editor.applyDeltaAsync(delta, source);
      },
      source,
      true,
    );
  }

  addTableMatcher() {
    // 移除旧matcher
    let matcherArr = this.clipboard.matchers;
    for(let i = 0, len = matcherArr.length; i < len; i++) {
      if(matcherArr[i][0] === 'tr') {
        matcherArr.splice(i, 1);
        break;
      } 
    }

    this.clipboard.addMatcher('table', (node, delta) => {
      console.log("============>>>>>>>>>>>>nodeeeee", node, delta);
    });
  }
}


async function modifyAsync(modifier, source, index, shift) {
  if (
    !this.isEnabled() &&
    source === Emitter.sources.USER &&
    !this.allowReadOnlyEdits
  ) {
    return new Delta();
  }
  let range = index == null ? null : this.getSelection();
  const oldDelta = this.editor.delta;
  const change = await modifier();
  if (range != null) {
    if (index === true) {
      index = range.index; // eslint-disable-line prefer-destructuring
    }
    if (shift == null) {
      range = shiftRangeAsync(range, change, source);
    } else if (shift !== 0) {
      range = shiftRangeAsync(range, index, shift, source);
    }
    this.setSelection(range, Emitter.sources.SILENT);
  }
  if (change.length() > 0) {
    const args = [Emitter.events.TEXT_CHANGE, change, oldDelta, source];
    this.emitter.emit(Emitter.events.EDITOR_CHANGE, ...args);
    if (source !== Emitter.sources.SILENT) {
      this.emitter.emit(...args);
    }
  }
  return change;
}

function shiftRangeAsync(range, index, length, source) {
  if (range == null) return null;
  let start;
  let end;
  if (index instanceof Delta) {
    [start, end] = [range.index, range.index + range.length].map(pos =>
      index.transformPosition(pos, source !== Emitter.sources.USER),
    );
  } else {
    [start, end] = [range.index, range.index + range.length].map(pos => {
      if (pos < index || (pos === index && source === Emitter.sources.USER))
        return pos;
      if (length >= 0) {
        return pos + length;
      }
      return Math.max(index, pos + length);
    });
  }
  return new Range(start, end - start);
}

function normalizeDelta(delta) {
  return delta.reduce((normalizedDelta, op) => {
    if (typeof op.insert === 'string') {
      const text = op.insert.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      return normalizedDelta.insert(text, op.attributes);
    }
    return normalizedDelta.push(op);
  }, new Delta());
}


// import Block, { BlockEmbed } from './blots/block';
// import Container from './blots/container';
// import OuterContainer from './blots/outerContainer';
// import Scroll from './blots/scroll';
// import Embed from './blots/embed';

// import FreeContainer from './modules/FreeContainer';


Quill.register({
	// 'modules/freeContainer':FreeContainer,
  // 'blots/block': Block,
  // 'blots/block/embed': BlockEmbed,
  // 'blots/wrapperContainer': Container,
  // 'blots/scroll': Scroll,
  // 'blots/outerContainer': OuterContainer,
  // 'blots/embed': Embed,

});

export default Quill;