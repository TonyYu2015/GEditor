import Quill from "quill";

const BlockEmbed = Quill.import('blots/block/embed');

export default class ImgForHeaderFooter extends BlockEmbed {
	constructor(scroll, domNode, value) {
		super(scroll, domNode, value);
		domNode.addEventListener('click', (targer) =>{
			targer.stopPropagation();
		});
	}
}