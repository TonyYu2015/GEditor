import React, { useEffect, useRef } from 'react';

export default function Editable({content, editable, isActive, quillEditorContainer, onChangeActive, quillInstance}) {
	const contentEl = useRef();
	const quillEditorParent = useRef();

	useEffect(() => {
		contentEl.current.innerHTML = content;
	}, [content]);

	useEffect(() => {
		if(isActive) {
			quillEditorParent.current.appendChild(quillEditorContainer.current);
		}

		quillEditorParent.current.style.display = isActive ? "block" : "none";
		contentEl.current.parentElement.style.display = isActive ? "none" : "block";
		
	}, [quillEditorParent, quillEditorContainer, isActive]);

	useEffect(() => {
		if(isActive) {
			const onKeyUp = (event) => {
				if(event.code === 'Escape') {
					activate(false);
				}
			}

			document.addEventListener('keyup', onKeyUp);
			return () => {
				document.removeEventListener('keyup', onKeyUp);
			};
		}
	}, [isActive]);

	const activate = (active) => {
		quillInstance.current.off("text-change");
		onChangeActive(editable, active);
	}

	return (
		<div 
			className="editable" 
			style={{...editable.wrapperStyle}}
			id={editable.id} 
			key={editable.gridKey}
			// style={{position: 'relative', flexGrow: 1, flexBasis: 0, width: 0}}
			// onDoubleClick={() => activate(true)}
			onClick={() => activate(true)}
		>
			{/* <div style={{position: 'absolute', top: 0, buttom: 0, left: 0, right: 0, display: 'none'}} ref={quillEditorParent}></div>
			<div style={{position: 'absolute', top: 0, buttom: 0, left: 0, right: 0,}} ref={contentEl}></div> */}
			<div style={{display: 'none'}} ref={quillEditorParent}></div>
			<div style={{}} className="ql-container ql-snow" >
				<div className="ql-editor" ref={contentEl}></div>
			</div>
		</div>
	)
}