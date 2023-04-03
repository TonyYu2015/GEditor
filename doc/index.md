# The Introduction of Quill Rich-Text Editor

## Overall Architecture

![flow](./flow.svg)

It's the basic way of how Quill run in the browser. DOM only can be drived, you should not change it, althought this behaviour also works, but it's not recommonded in the development. The Blots and Delta are work for each other, whenever one is changed, another will be updated.

## The Delta

It'a data structure which is representative of editor's content, it can be stored in the database or somewhere else, and will be render to DOM content through the Scroll blot(the top blot which control the blot tree).

This is the [formal doc](www.github.com/quilljs/delta), it shows the very specific doc, you can get detials of how an api used. Here we introduce some normal api briefly reference to the delta structure.

**Insert**, **Retain**, **Delete** are three operations of delta, **Retain** and **Delete**'s value are number, mean where you will start your next operation and the length you are going to delete respectivly. The value of **Insert** is either String which simply represent the text with another optinal property `attributer` or an Object which represent embed element, such as image, video.

So you can use the above three operations to apply the Delta.

## The Blot

Every element in the editor are all Blot type, such as text, code, image, or formula. 

Quill has provided some normal useful blots you can use, and also you can make a customize blot which often inherit from the basic blot in the Quill. This feature is very strong to customize your own editor.

## The Module

```javascript
const Module = Quill.import('core/module');

// code your module
class YourModule extends Module {
	constructor(quill, options) {
		super(quill, options);
	}
}

// register it into the Quill
Quill.register({
	'modules/yourModuleName': YourModule
});

// use it when initialize the Quill
new Quill(
	{
		modules: {
			yourModuleName: true | options
		}
	}
)
```

You can use it like the code above, it also can strength your editor.

# How the Quill render?

We can call `setContents` or `updateContents` to reset the content of the editor or just update it.

```javascript
setContents(delta, source = Emitter.sources.API) {
	return modify.call(
		this,
		() => {
			delta = new Delta(delta);
			const length = this.getLength();
			// delete the current content in the editor
			const deleted = this.editor.deleteText(0, length);
			// render the editor
			const applied = this.editor.applyDelta(delta);
			const lastOp = applied.ops[applied.ops.length - 1];
			if(
				lastOp != null &&
				typeof lastOp.insert === 'string' &&
				lastOp.insert[lastOp.insert.length - 1] === '\n'
				) {
					this.editor.deletetText(this.getLength() - 1, 1);
					applied.delete(1);
				}
				return deleted.compose(applied);
		},
		source
	)
}
```

```javascript
updateContents(delta, source = Emitter.sources.API) {
	return modify.call(
		this,
		() => {
			delta = new Delta(delta);
			// return the editor
			return this.editor.applyDelta(delta, source);
		},
		source,
		true,
	);
}
```

We can see that `setContents` will delete the current content firstly, then render the new content, and `updateContents` will directly render the new content.
The `modify` is a function of handling Selection and TEXT_CHANGE common modification. `applyDelta` implemente the render process, it belongs the `Editor`. 

```javascript
class Editor {
	applyDelta(delta) {
		let consumeNextNewLine = true;
		this.scroll.update();
		let scrollLength = this.scroll.length();
		// start batch, which means generate the Dom node and insert them into the document, and current DOM is flat, only contains content, havn't been wrappered by containers, this action will happen in the `optimize` stage. 
		this.scroll.batchStart();
		const normalizedDelta = normalizedDelta(delta);
		normalizedDelta.reduce((index, op) =>{
			// get current op length
			const length = op.retain || op.delete || op.insert.length || 1;
			let attributes = op.attributes || {};
			if(op.insert != null) {
				if(typeof op.insert === 'string') {
				// plain text
				let text = op.insert;
				if(text.endsWith('\n') && consumeNextNewLine) {
					consumeNextNewLine = false;
					text = text.slice(0, -1);
				}
				if(
					(index >= scrollLength || this.scroll.descendent(BlockEmbed, index)[0])
					&& !text.endsWith('\n')
				) {
					consumeNextNewLine = true;
				}

				// insert text, including insert new Blot and the dom node
				this.scroll.insertAt(index, text);

				// get formats
				const [line, offset] = this.scroll.line(index);
				let formats = extend({}, bubbleFormats(line));
				if(line instancesof Block) {
					const [leaf] = line.descendant(LeafBlot, offset);
					formats = extend(formats, bubbleFormats(leat));
				}
				attributes = AttributeMap.diff(formats, attributes) || {};

				} else if(typeof op.insert === 'object') {
					// embed, here the key is the embed Blot's name, so it can be used to create new Embed Blot, but it should only be one key
					const key = Object.keys(op.insert)[0];
					if(key == null) return index;
					this.scroll.insertAt(index, key, op.insert[key]);

				}
			}

			Object.keys(attributes).forEach(name =>{
				this.scroll.formatAt(index, length, name, attributes[name]);
			});

			return index + length;
		}, 0);

		// handle delete operation
		normalizedDelta.reduce((index, op) => {
			if(typeof op.delete === 'number') {
				this.scroll.deleteAt(index, op.delete);
				return index;
			}
			return index + (op.retain || op.insert.length || 1)
		}, 0);

	// end batch render, start next work
		this.scroll.batchEnd();
		this.scroll.optimize();
		return this.update(normalizedDelta);
	}
}
```
