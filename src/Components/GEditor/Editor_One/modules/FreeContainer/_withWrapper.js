import Quill from "quill";
import { ContainerWrapper } from ".";
import { OP_TYPES, SCROLL_CHILDREN } from "../../consts";



export default function withWrapper(blot) {
	return class HighOrderWrapper extends blot {
		constructor(scroll, domNode, value) {
			super(scroll, domNode, value);
			this.quill = Quill.find(scroll.domNode.parentNode);
			this._value = value;

			// 是否限制删除（默认不做限制，backspace可以直接删除）
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
						// 创建新容器
						if (this._value.container) {
							this.createContainer(manager);
						} else {
							// 指令操作才需要校正位置
							if (this.quill.cmdType) {
								if (this._value.key) {
									this.validateWrapContainer(manager);
								}
							}
						}
					}
					else {
						// 指令操作才需要校正位置
						if (this.quill.cmdType) {
							this.validateWrapBlot(manager);
						}
					}
				}
			}
		}

		// 创建新容器（支持嵌套）
		createContainer = (manager) => {
			let containerData = this._value.container;
			delete this._value.container;

			let blotName;
			let blotValue;
			let blotKey;
			if (typeof containerData === "string") { // 直接创建单一容器
				blotName = containerData;
				blotValue = this._value;
				blotKey = this._value.key;
			} else if (typeof containerData === "object") { // 创建嵌套容器
				blotName = containerData.blotName;
				blotValue = containerData;
				blotKey = containerData.key;
			}

			let parentContainer;
			if (blotKey) {
				parentContainer = manager.getNestBlotByKey(blotKey);

				// 父容器已存在，则直接添加当前blot
				if (parentContainer) {
					parentContainer.appendChild(this);

					// 如果当前为容器，则在父容器数据中添加当前容器数据，并更新索引
					if (this instanceof ContainerWrapper) {
						let parentData = manager.getNestDataByKey(blotKey);
						if (parentData) {
							let nest = manager.getNestDataFromBlot(this);
							parentData._children.push(nest);
							parentData.startIndex = manager.getStartIndex(parentContainer);
							parentData.endIndex = manager.getEndIndex(parentContainer);

							// 更新缓存父容器索引
							let cacheNest = manager.getCacheNestByKey(parentData.key);
							if (cacheNest) {
								cacheNest.startIndex = parentData.startIndex;
								cacheNest.endIndex = parentData.endIndex;
							}
						}
					}
				}
			}

			// 父容器不存在，创建
			if (!parentContainer) {
				this.wrap(blotName, blotValue);
				parentContainer = this.getContainer(this);

				// 页眉页脚的父容器必须是scroll
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

				// 如果存在嵌套，则只添加最上层父容器到数据(顶层不存在container信息)
				if (!containerData.container) {
					manager.addNestDataByBlot(parentContainer);
					parentContainer?.setFocusedContainer && parentContainer.setFocusedContainer();
				}
			}
		}



		/**
		* @description 校正普通段落文本位置
		* @param 
		* @return 
		*/
		validateWrapBlot = (manager) => {
			let range = { "startIndex": manager.getStartIndex(this), "endIndex": manager.getEndIndex(this) }
			let nestData = manager.getNestDataByRange(range);
			if (nestData) {
				this.doValidateWrap(manager, nestData);
			}
		}

		/**
		* @description 校正容器位置
		* @param 
		* @return 
		*/
		validateWrapContainer = (manager) => {
			let nestData = manager.getNestDataByKey(this._value.key);
			if (nestData) {
				// 普通容器
				if (nestData?.parentKey) {
					let parentData = manager.getNestDataByKey(nestData.parentKey);

					// 如果容器的父容器blot与数据不一致，则校验
					if (parentData?.key) {
						this.doValidateWrap(manager, parentData, true);
					}
				} else {
					// 没有parentKey的时候直接添加到scroll下
					if (this.parent !== this.quill.scroll) {
						this.quill.scroll.appendChild(this);
					}
				}
			} else {
				// 如果数据已经被移除，则容器blot也需要移除
				if (this.statics.blotName != "page-container") {
					this.remove();
				}
			}
		}

		/**
		* @description 校正位置
		* @param isNest 是否为容器
		* @return 
		*/
		doValidateWrap = (manager, nestData, isNest = false) => {
			let parentContainer = this.getContainer(this);

			// 如果当前显示的父容器与数据不一致，则以数据为准，添加到合适位置
			if (parentContainer?._value?.key === nestData.key) {
			} else {
				let targetContainer = manager.getNestBlotByKey(nestData.key);
				let flag;

				// 根据数据查找的父容器存在
				if (targetContainer) {

					// 当前为容器
					if (isNest) {
						let curData = manager.getNestDataByKey(this._value.key);
						let targetChild = targetContainer.children.head;
						// 父容器已经存在子blot
						if (targetChild) {
							let targetChildIndex = manager.getStartIndex(targetChild);

							// 查询当前容器目标位置的后一个位置索引
							while (curData.startIndex > targetChildIndex) {
								if (targetChild.next) {
									targetChild = targetChild.next;
									targetChildIndex = manager.getStartIndex(targetChild);
								} else {
									break;
								}
							}

							// 如果目标位置大于前一个blot的起始位置，则添加到后面，否则插入到前面
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

					// targetContainer.appendChild(this);
				} else { // 如果父容器不存在，则创建
					this.wrap(nestData.blotName, nestData);
					flag = "wrap";
				}


			}
		}

		/**
		* @description 记录文本内容改动
		* @param 
		* @return 
		*/
		recordRetainInfo = () => {
			if (this instanceof ContainerWrapper) {
				return;
			}

			let nextBlot = this.next;

			// 插入容器过程，不记录
			if (nextBlot?._value?.container) {
				return;
			}

			// 已通过容器插入记录
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

		/**
		* @description 判断当前blot后发生变化的容器总长度
		* @param 
		* @return 
		*/
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