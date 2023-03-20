class ResizeObserverModule {
	constructor() {
		this.ins = new ResizeObserver(entries => {
			for (let entry of entries) {
				if (this.domMap.has(entry.target)) {
					this.domMap.get(entry.target).forEach(callback => {
						callback(entry);
					});
				}
			}
		});
		this.domMap = new WeakMap();
	}

	addDom(dom, callback) {
		this.ins.observe(dom);
		if (this.domMap.has(dom)) {
			let callbackArr = this.domMap.get(dom);
			callbackArr.push(callback);
		} else {
			this.domMap.set(dom, [callback]);
		}
	}

	delDom(dom) {
		if (this.domMap.has(dom)) {
			this.ins.unobserve(dom);
			this.domMap.delete(dom);
		}
	}

	destory() {
		this.ins.disconnect();
		this.domMap = null;
	}
}

class ResizeObserverBlotModule extends ResizeObserverModule {
	addBlot(blot, callback) {
		this.addDom(blot.domNode, callback);
		let blotRemove = blot.remove.bind(blot);
		blot.remove = () => {
			blotRemove();
			this.delDom(blot.domNode);
		}
	}

}

export { ResizeObserverModule as default, ResizeObserverBlotModule };