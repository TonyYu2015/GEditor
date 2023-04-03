# Update

```javascript
// quill/blots/scroll.js
class Scroll extends ScrollBlot {
  update(mutations) {
    if(this.batch) {
      if(Array.isArray(mutations)) {
        this.batch = this.batch.concat(mutations);
      }
      return;
    }

    let source = Emitter.sources.USER;
    if(typeof mutations === 'string') {
      source = mutations;
    }

    if(!Array.isArray(mutations)) {
      mutations = this.observer.takeRecords();
    }

    if(mutations.length > 0) {
      // fire SCROLL_BEFORE_UPDATE
      this.emitter.emit(Emitter.events.SCROLL_BEFORE_UPDATE, source, mutations);
    }

    // call update method in the ScrollBlot 
    super.update(mutations.concat([]));

    if(mutations.length > 0) {
      // fire SCROLL_UPDATE
      this.emitter.emit(Emitter.events.SCROLL_UPDATE, source, mutations);
    }
  }
}
```

```javascript
// parchment/blot/scroll.ts
class ScrollBlot extends ParentBlot implements Root {
  public update(mutations?: MutationsRecord[], context: { [key: string]: any } = {}):void {
    mutations = mutations || this.observer.takeRecords();
    const mutationsMap = new WeakMap();
    mutations.map((mutations: MutationRecord) => {
      const blot = Register.find(mutation.target, true);
      if(blot == null) {
        return null;
      }

      if(mutationsMap.has(blot.domNode)) {
        mutationsMap.get(blot.domNode).push(mutation);
        return null;
      } else {
        mutationsMap.set(blot.domNode, [mutation]);
        return blot;
      }
    }).forEach((blot: Blot | null) => {
      if(blot != null && blot !== this && mutationsMap.has(blot.domNode)) {
        blot.update(mutationsMap.get(blot.domNode) || [], context);
      }
    });

    context.mutationsMap = mutationsMap;
    if(mutationsMap.has(this.domNode)) {
      super.update(mutationsMap.get(this.domNode), context);
    }

    this.optimize(mutations, context);
  }
}
```

```javascript
// parchment/blot/abstract/parent.ts
class ParentBlot extends ShadowBlot implements Parent {
  public update(mutations: MutationRecord[], _context: { [key: string]: any }): void {
    const addedNodes: Node[] = [];
    const removedNodes: Node[] = [];
    // collect the mutation of childNodes in current Node
    mutations.forEach(mutation => {
      if(mutation.target === this.domNode && mutation.type === "childList") {
        addedNodes.push(...mutation.addedNodes);
        removedNodes.push(...mutation.removedNodes);
      }
    });

    removedNodes.forEach((node: Node) => {

    });

    addedNodes
    .filter(node => {
      // confirm nodes are all childNodes of this domNode.
      return node.parentNode === this.domNode || node === this.uiNode;
    })
    .sort((a, b) => {
      // sort the node by position, here use the node.compareDocumetnPosition(otherNode), it will return bitmask to represent the relative position. it use & to check if
      // the b node is following a node in a pre-order deep-first traversal of a tree.
      if(a === b) {
        return 0;
      }
      if(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) {
        return 1;
      }
      return -1;
    })
    .forEach(node => {
      let refBlot: Blot | null = null;
      if(node.nextSibling != null) {
        refBlot = this.scroll.find(node.nextSibling);
      }
      const blot = makeAttachedBlot(node, this.scroll);
      if(blot.next !== refBlot || blot.next == null) {
        if(blot.parent != null) {
          blot.parent.removeChild(this);
        }
        this.insertBefore(blot, refBlot || undefined);
      }
    });

    this.enforceAllowedChildren();
  }
}
```