# How quill insert a node?

`insertAt` this is a method of Scroll blot
```javascript
// quill/blots/scroll.js
class Scroll extends ScrollBlot {
	insertAt(index, value, def) {
		if(index >= this.length()) {
			if(def == null || this.scroll.query(value, Scope.BLOCK) == null) {

			} else {
				// insert embed blot
				const embed = this.scroll.create(value, def);
				this.appendChild(embed);
			}
		} else {
				super.insertAt(index, value, def);
			}
		// this won't happen in the batch stage
		this.optimize();
	}

	insertBefore(blot, ref) {
		if(blot.statics.scope === Scope.INLINE_BLOT) {
			const wrapper = this.scroll.create(this.statics.defaultChild.blotName);
			wrapper.appendChild(blot);
			super.insertBefore(wrapper, ref);
		} else {
			super.insertBefore(blot, ref);
		}
	}
}
```

Call the parent's `insertAt` at ScrollBlot
```javascript
// parchment/blot/scroll.ts
class ScrollBlot extends ParentBlot implements Root {
	public insertAt(index: number, value: string, def?:any):void {
		// same as before, won't happen in the batch stage
		this.update();

		super.insertAt(index, value, def);
	}
}
```

Call the parent's `insertAt` in ParentBlot
```javascript
// parchment/blot/abstract/parent.ts
class ParentBlot extends ShadowBlot implements Parent {
	public insertAt(index: number, value: string, def?:any):void {
		const [child, offset] = this.children.find(index);
		if(child) {
			child.insertAt(offset, value, def);
		} else {
			const blot = def == null ? this.scroll.create('text', value) : this.scroll.create(value, def);
			this.appendChild(blot);
		}
	}

	public appendChild(other: Blot): void {
		this.insertBefore(other);
	}

	public insertBefore(childBlot: Blot, refBlot?:Blot | null): void {
		if(childBlot.parent != null) {
			childBlot.parent.children.remove(childBlot);
		}
		let refDomNode: Node | null = null;
		this.children.insertBefore(childBlot, refBlot || null);
		childBlot.parent = this;
		if(refBlot != null) {
			refDomNode = refBlot.domNode;
		}
		if(
			this.domNode.parentNode !== childBlot.domNode
			|| this.domNode.nextSibling !== refDomNode
		) {
			this.domNode.insertBefore(childBlot.domNode, refDomNode);
		}

		childBlot.attach();
	}
}

```