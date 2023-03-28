import Quill from "quill";
import { ContainerWrapper } from ".";
import { OP_TYPES, SCROLL_CHILDREN } from "../../consts";



export default function withWrapper(blot) {
	return class HighOrderWrapper extends blot {
		constructor(scroll, domNode, value) {
			super(scroll, domNode, value);
			this.quill = Quill.find(scroll.domNode.parentNode);
			this._value = value;

			this.isLimitRemove = false;
		}

		optimize(context) {
			super.optimize(context);
			if (!Quill.find(this.domNode)) return;
			if (!this.statics.requiredContainer) {
				let manager = this.quill.NestContainerManager;
				if (!manager) {
					return;
				}

				if (this.quill.isLoadingRender === true) {
					let index = this.quill.getIndex(this);
					let container = manager.findParentBlot(index, this);
					if (container && container.key !== this.parent._value?.key) {
						this.wrap(container.blotName, container);
					}
				} else {
					if (this._value && (this._value.container || this._value.key)) {
						if (this._value.container) {
							this.createContainer(manager);
						} else {
							if (this.quill.cmdType) {
								if (this._value.key) {
									this.validateWrapContainer(manager);
								}
							}
						}
					}
					else {
						if (this.quill.cmdType) {
							this.validateWrapBlot(manager);
						}
					}
				}
			}
		}

		createContainer = (manager) => {
			let containerData = this._value.container;
			delete this._value.container;

			let blotName;
			let blotValue;
			let blotKey;
			if (typeof containerData === "string") {
				blotName = containerData;
				blotValue = this._value;
				blotKey = this._value.key;
			} else if (typeof containerData === "object") {
				blotName = containerData.blotName;
				blotValue = containerData;
				blotKey = containerData.key;
			}

			let parentContainer;
			if (blotKey) {
				parentContainer = manager.getNestBlotByKey(blotKey);

				if (parentContainer) {
					parentContainer.appendChild(this);

					if (this instanceof ContainerWrapper) {
						let parentData = manager.getNestDataByKey(blotKey);
						if (parentData) {
							let nest = manager.getNestDataFromBlot(this);
							parentData._children.push(nest);
							parentData.startIndex = manager.getStartIndex(parentContainer);
							parentData.endIndex = manager.getEndIndex(parentContainer);

							let cacheNest = manager.getCacheNestByKey(parentData.key);
							if (cacheNest) {
								cacheNest.startIndex = parentData.startIndex;
								cacheNest.endIndex = parentData.endIndex;
							}
						}
					}
				}
			}

			if (!parentContainer) {
				this.wrap(blotName, blotValue);
				parentContainer = this.getContainer(this);

				if (SCROLL_CHILDREN.includes(parentContainer.statics.blotName)) {
					if (parentContainer.parent !== this.quill.scroll) {
						let isHead = parentContainer === parentContainer.parent.children.head ? true : false;
						let scrollChild = this.getScrollChild(parentContainer);
						if (scrollChild) {
							if (isHead) {
								this.quill.scroll.insertBefore(parentContainer, scrollChild);
							} else {
								this.quill.scroll.insertBefore(parentContainer, scrollChild.next);
							}

							let data = manager.getNestDataByKey(scrollChild._value.key);
							data.startIndex = manager.getStartIndex(scrollChild);
							data.endIndex = manager.getEndIndex(scrollChild);

						}
					}
				}

				if (!containerData.container) {
					manager.addNestDataByBlot(parentContainer);
					parentContainer?.setFocusedContainer && parentContainer.setFocusedContainer();
				}
			}
		}

		validateWrapBlot = (manager) => {
			let range = { "startIndex": manager.getStartIndex(this), "endIndex": manager.getEndIndex(this) }
			let nestData = manager.getNestDataByRange(range);
			if (nestData) {
				this.doValidateWrap(manager, nestData);
			}
		}

		validateWrapContainer = (manager) => {
			let nestData = manager.getNestDataByKey(this._value.key);
			if (nestData) {
				if (nestData?.parentKey) {
					let parentData = manager.getNestDataByKey(nestData.parentKey);

					if (parentData?.key) {
						this.doValidateWrap(manager, parentData, true);
					}
				} else {
					if (this.parent !== this.quill.scroll) {
						this.quill.scroll.appendChild(this);
					}
				}
			} else {
				if (this.statics.blotName != "page-container") {
					this.remove();
				}
			}
		}

		doValidateWrap = (manager, nestData, isNest = false) => {
			let parentContainer = this.getContainer(this);

			if (parentContainer?._value?.key === nestData.key) {
			} else {
				let targetContainer = manager.getNestBlotByKey(nestData.key);
				let flag;

				if (targetContainer) {

					if (isNest) {
						let curData = manager.getNestDataByKey(this._value.key);
						let targetChild = targetContainer.children.head;
						if (targetChild) {
							let targetChildIndex = manager.getStartIndex(targetChild);

							while (curData.startIndex > targetChildIndex) {
								if (targetChild.next) {
									targetChild = targetChild.next;
									targetChildIndex = manager.getStartIndex(targetChild);
								} else {
									break;
								}
							}

							if (curData.startIndex > targetChildIndex) {
								targetContainer.appendChild(this);
							} else {
								targetContainer.insertBefore(this, targetChild);
							}

						} else {
							targetContainer.appendChild(this);
						}

					} else {
						targetContainer.appendChild(this);
					}

				} else { 
					this.wrap(nestData.blotName, nestData);
					flag = "wrap";
				}


			}
		}

		recordRetainInfo = () => {
			if (this instanceof ContainerWrapper) {
				return;
			}

			let nextBlot = this.next;

			if (nextBlot?._value?.container) {
				return;
			}

			if (this?._value?.container) {
				return;
			}

			let parent = this.getContainer(this);
			if (parent?._value?.key) {
			} else {
				return;
			}

			let nextNestsChangedTotalLength = this.getNextNestsChangedTotalLength();

			let manager = this.quill.NestContainerManager;
			let parentData = manager.getNestDataByKey(parent._value.key);
			if (parentData) {
				let prevLen = parentData.endIndex - parentData.startIndex;
				let curLen = parent.length();
				let len = curLen - prevLen;
				if (len == 0 || Math.abs(len) === nextNestsChangedTotalLength) {
					return;
				}
			} else {
				return;
			}
			let data = manager.getNestDataFromBlot(parent);
			data._children = [];
			data.opType = OP_TYPES.RETAIN;
			manager.appendCacheNest(data);

		}

		getNextNestsChangedTotalLength = () => {
			let manager = this.quill.NestContainerManager;
			let endIndex = manager.getEndIndex(this);
			let cacheNests = manager.cacheNests;
			let result = [];
			this.getNestDataByIndex(cacheNests, endIndex, result);
			let len = 0;
			result.forEach((value) => {
				len += value.endIndex - value.startIndex;
			})
			return len;
		}

		getNestDataByIndex = (cacheNests, index, result) => {
			for (let nest of cacheNests) {
				if (nest.startIndex === index) {
					result.push(nest);
					this.getNestDataByIndex(cacheNests, nest.endIndex, result);
					return;
				}
			}
		}

		getContainer(blot) {
			if (blot.parent && blot.parent.statics.blotName !== 'scroll') {
				if (blot.parent instanceof ContainerWrapper) {
					return blot.parent;
				} else {
					return this.getContainer(blot.parent);
				}
			}
			return this.scroll;
		}

		getScrollChild(blot) {
			if (blot.parent?.statics.blotName === 'scroll') {
				return blot;
			}
			return this.getScrollChild(blot.parent);
		}

		remove() {
			if (!this.quill.cmdType && !this.quill.isLoadingRender) {
				let index = this.quill.getIndex(this);
				if (this.quill.NestContainerManager && index >= 0) {
					this.quill.NestContainerManager.setRetain(index, "remove");
				}

				if (this instanceof ContainerWrapper) {
					let manager = this.quill.NestContainerManager;
					manager.removeNestDataByKey(this._value.key, true);
				}
			}
			super.remove();
		}
	}
}