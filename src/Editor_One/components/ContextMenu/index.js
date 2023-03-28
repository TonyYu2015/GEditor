import React from "react";
import { createRoot } from "react-dom/client";
import "./index.less";

function ContextMenuCom(props) {
	const {
		data
	} = props;

	return (
		<div className="lcw">
			{
				data.map(item => {
					return (
						<span className="lcw-item" onClick={item.clickEvt}>{item.text}</span>
					)
				})
			}
		</div>
	)
}

export default class ContextMenu {
		constructor(option, quill, menu) {
		this.destoryHandler = this.destory.bind(this);
		this.quill = quill;
		this.initial(option, menu);
	}

	destory() {
		this.root.unmount();
		this.quill.layoutContextMenuDomNode = null;
		this.domNode.remove();
		document.removeEventListener('click', this.destoryHandler);
	}

	initial(option, menu) {
		if (!this.quill.layoutContextMenuDomNode) {
			this.domNode = document.createElement('div');
			this.quill.layoutContextMenuDomNode = this.domNode;
			document.body.appendChild(this.domNode);
		} else {
			this.domNode = this.quill.layoutContextMenuDomNode;
		}
		document.addEventListener('click', this.destoryHandler);

		this.domNode.setAttribute("style", `position: absolute; left: ${option.left}px; top: ${option.top}px;z-index: 999;`);

		if(!this.root) {
			this.root = createRoot(this.domNode);
		}
		this.root.render(<ContextMenuCom data={menu}/>);
	}
}