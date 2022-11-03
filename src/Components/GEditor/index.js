import React, { useEffect, useRef } from "react";
import Editor from "./editor";

export default function GEditor(props) {

	const editorInstance = useRef(null);
	const editRef = useRef(null);

	useEffect(() => {
		if(!editorInstance.current && editRef.current) {
			editorInstance.current = new Editor({
				container: editRef.current, 
				toolbar: '#ql-toolbar',
			});
		}

		return () => {
			if(!editRef.current) {
				editorInstance.current = null;
				window.Quill = null;
			}
		}
	}, [editRef.current]);

	return (
		<div>
			<div id="ql-toolbar">
				<button className="ql-list" value="ordered"/>
				{/* <button className="ql-list" value="bullet"/>
				<button className="ql-align" value="center"/>
				<button className="ql-align" value="right"/>
				<button className="ql-align" value="justify"/>
				<button className="ql-indent" value="+1"/>
				<button className="ql-indent" value="-1"/> */}
				{/* <select className="ql-lineheight" defaultValue="1.3">
					{lineHeightWhiteList.map((m, i) => {
						return <option value={m} >{m}</option>
					})}
				</select> */}
			</div>
			<div 
				id="editor-wrapper"
				ref={editRef}
			>
			</div>
		</div>
	)
}