import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema, DOMParser } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";
import { exampleSetup } from "prosemirror-example-setup";
import { useEffect, useRef } from "react";

import "prosemirror-example-setup/style/style.css";
import "prosemirror-menu/style/menu.css";
import "prosemirror-view/style/prosemirror.css";

const mySchema = new Schema({
	nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
	marks: schema.spec.marks
});

export default function PEditor() {

	const wrapNode = useRef(null);
	const contentNode = useRef(null);
	const editor = useRef(null);

	useEffect(_ => {
		if (contentNode.current && !editor.current) {
			console.log("===>>>>", contentNode.current, editor.current);
			editor.current = new EditorView(wrapNode.current, {
				state: EditorState.create({
					doc: DOMParser.fromSchema(mySchema).parse(contentNode.current),
					plugins: exampleSetup({ schema: mySchema })
				}),
				dispatchTransaction(transaction) {
					console.log("from", transaction.before.content, "to", transaction.doc.content);
					let newState = editor.current.state.apply(transaction);
					editor.current.updateState(newState);
				}
			});
		}
	}, [contentNode.current]);

	return (
		<div id="peditor" ref={wrapNode}>
			<div className="content" ref={contentNode}></div>
		</div>
	)
}