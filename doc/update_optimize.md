# Update and Optimize

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

  optimize(mutations = [], context = []) {
    // stop continue in the batch stage.
    if(this.batch) return;
    // call the optimize in the ScrollBlot
    super.optimize(mutations, context);
    // fire the SCROLL_OPTIMIZE event
    if(mutations.length > 0) {
      this.emitter.emit(Emitter.events.SCROLL_OPTIMIZE, mutations, context);
    }
  }
}
```

```typescript
// parchment/blot/scroll.ts
class ScrollBlot extends ParentBlot implements Root {
  public update(mutations?: MutationsRecord[], context: { [key: string]: any } = {}):void {
    mutations = mutations || this.observer.takeRecords();
    const mutationsMap = new WeakMap();
    mutations.map((mutations: MutationRecord) => {
      // 1. find the mutation dom's blot.
      const blot = Register.find(mutation.target, true);
      if(blot == null) {
        return null;
      }

      // make sure mutiple mutations of the same dom are attached to the same one domNode.
      if(mutationsMap.has(blot.domNode)) {
        // 2.1 push the dom to the array which is the value of the blot as it's key.
        mutationsMap.get(blot.domNode).push(mutation);
        return null;
      } else {
        // 2.2 create it if it's not exist.
        mutationsMap.set(blot.domNode, [mutation]);
        return blot;
      }
    }).forEach((blot: Blot | null) => {
      if(blot != null && blot !== this && mutationsMap.has(blot.domNode)) {
        // run the update of the blot itself, depend on which type of the blot is.
        blot.update(mutationsMap.get(blot.domNode) || [], context);
      }
    });

    context.mutationsMap = mutationsMap;
    if(mutationsMap.has(this.domNode)) {
      // attach and detach all the childList domNode to the blot.
      super.update(mutationsMap.get(this.domNode), context);
    }

    // start the optimize stage
    // the call stack order is like this: Scroll -> ScrollBlot -> ParentBlot -> ShadowBlot
    // so the optimize in the ShadowBlot will be ran in the first place.
    this.optimize(mutations, context);
  }

  public optimize(mutations: any = [], context: any = []): void {
    // call the optimize in the ParentBlot
    super.optimize(context);
    const mustationsMap = context.mutationsMap || new WeakMap();
    let records = Array.from(this.observer.takeRecords());
    while(records.length > 0) {
      mutations.push(records.pop());
    }

    // mark blots which should do optimize
    const mark = (blot: Blot | null, markParent = true): void => {
      // do not mark the scroll blot.
      if(blot == null || blot === this) {
        return;
      }
      // do not mark the domNode which is pending to be removed
      if(blot.domNode.parentNode == null) {
        return;
      }
      if(!mutationsMap.has(blot.domNode)) {
        mutationsMap.set(blot.domNode, []);
      }
      if(markParent) {
        mark(blot.parent);
      }
    }

    // Post-order traversal, run the optimize
    const optimize = (blot: Blot): void => {
      // it the blot is not in the mutation list, just return
      if(!mutationsMap.has(blot.domNode)) {
        return;
      }
      if(blot instanceof ParentBlot) {
        blot.children.forEach(optimize);
      }
      // remove the mutation domNode from the mutation list
      mustationMap.delete(blot.domNode);
      blot.optimize(context);
    }

    let remaining = mutations;
    for(let i = 0; remaining.length > 0; i += 1) {
      // check is this optimize reach the limitation, maybe caused by too many domNode mutations or an infinite loop exist. 
      // should check it.
      if(i >= MAX_OPTIMIZE_ITERATIONS) {
        throw new Error('[Parchment] Maximum optimize iterations reached');
      }

      // mark the mutaion blot and some related blots
      remaining.forEach((mutation: MutationRecord) => {
        if(blot == null) return;
        if(blot.domNode === mutation.target) {
          if(mutation.type === 'childList') {
            // mark the previousSibling of this domNode to doing the optimize
            mark(this.find(mutation.previousSibling, false));
            // mark these addedNode to do optimize, and if it is an instance of ParentBlot, also should mark it's children to do optimize 
            Array.from(mutation.addedNodes).forEach((node: Node) => {
              const child = this.find(node, false);
              mark(child, false);
              if(child instanceof ParentBlot) {
                child.children.forEach((grandChild: Blot) => {
                  mark(grandChild, false);
                });
              }
            });
          } else if(mutation.type === 'attributes') {
            // if just attributes change lead to the mutation, only mark the prev
            mark(blot.prev);
          }
        }
        // mark the blot itself
        mark(blot);
      });
      // We can make a conclusion
      // 1. childList lead to the mutation
      //    1. prev blot
      //    2. added blots
      //    3. added blots's children if the added blot is an instance of ParentBlot, such as BlockBlot, InlineBlot, ContainerBlot
      // 2. attribute lead to the mutation
      //    1. prev blot

      this.children.forEach(optimize);
      // get the new mutations, in the above code execuding, here maybe can lead to the infinite loop, if you do some things lead to the mutation happen,
      // such as uncondition dom change, something like this.
      remaining = Array.from(this.observer.takeRecords());
      // record these mutation at the mutations array which will be used in the other palce.
      records = remaining.slice();
      while(records.length > 0) {
        mutations.push(records.pop());
      }
    }
  }
}
```

```typescript
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

    // detach blot
    removedNodes.forEach((node: Node) => {
      if(
        node.parentNode != null
        && node.tagName !== 'IFRAME'
        && document.body.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_CONTAINED_BY
      ) {
        return;
      }

      const bolt = this.scroll.find(node);
      if(blot == null) return;
      if(blot.domNode.parentNode == null || blot.domNode.parentNode === this.domNode) blot.detach();
    });

    // attach blot
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
      // make sure this blot has already exist.
      const blot = makeAttachedBlot(node, this.scroll);
      if(blot.next !== refBlot || blot.next == null) {
        if(blot.parent != null) {
          blot.parent.removeChild(this);
        }
        // insert into the blot tree
        this.insertBefore(blot, refBlot || undefined);
      }
    });

    // check is children valid 
    this.enforceAllowedChildren();
  }

  public optimize(context: { [key: string]: any }): void {
    // call the optimize in the ShadowBlot
    super.optimize(context);
    this.enforceAllowedChildren();

    // handle the uiNode
    if(this.uiNode != null && this.uiNode !== this.domNode.firstChild) {
      this.domNode.insertBefore(this.uiNode, this.domNode.firstChild);
    }

    // handle the situation of no children inside this blot.
    if(this.children.length === 0) {
      if(this.statics.defaultChild != null) {
        // defaultChild exist, then create it and append it.
        const child = this.scroll.create(this.statics.defaultChild.blotName);
        this.appendChild(child);
      } else {
        // no defaultChild, just remove itself
        this.remove();
      }
    }
  }
}
```

```typescript
// parchment/blot/abstract/shadow.ts
class ShadowBlot implements Blot {
  public update(_mutations: MutationRecord[], _context: { [key: string]: any }) {
    // Nothing to do by default
  }

  // the optimize in ShadowBlot is just create this blot's parent, if it't not exist. 
  public optimize(_context: { [key: string]: any }): void {
    if(this.statics.requiredContainer && !(this.parent instanceof this.statics.requiredContainer)) {
      this.wrap(this.statics.requiredContainer.blotName);
    }
  }
}
```

Above are the code of `update` and `optimize` which start from Scroll. The process is like this:

```
Scroll.update -> ScrollBlot.update -> ParentBlot.update -> ShadowBlot.update

                                   -> Scroll.optimize -> ScrollBlot.optimize -> ParentBlot.optimize -> ShadowBlot.optimize
```