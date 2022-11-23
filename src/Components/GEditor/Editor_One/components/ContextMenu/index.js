import React from "react";
import { createRoot } from "react-dom/client";
import "./index.less";

function ContextMenuCom(props) {
	const {
		data,
		blot
	} = props;

	return (
		<div className="lcw">
			{
				data.map(item => {
					return (
						<span className="lcw-item" onClick={item.clickEvt.bind(null, blot)}>{item.text}</span>
					)
				})
			}
		</div>
	)
}

export default class ContextMenu {
	constructor(quill, menu) {
		this.destoryHandler = this.destory.bind(this);
		this.quill = quill;
		this.menu = menu;
		this.initial();
	}

	destory() {
		this.domNode.style.display = "none";
	}

	render(position, blot) {
		this.domNode.setAttribute("style", `display: block; position: absolute; left: ${position.left}px; top: ${position.top}px;`);
		this.root.render(
			<ContextMenuCom
				data={this.menu}
				blot={blot}
			/> 
		);
	}

	initial() {
		if(!this.domNode) {
			this.domNode = document.createElement('div');
			document.body.appendChild(this.domNode);
		}
		document.addEventListener('click', this.destoryHandler);

		if(!this.root) {
			this.root = createRoot(this.domNode);
		}

	}
}