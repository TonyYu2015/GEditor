import Quill from 'quill';
import Container from '../modules/FreeContainer/blots/container';

export default class OuterContainer extends Container {

	constructor(scroll, domNode, value) {
		super(scroll, domNode, value);
		domNode.addEventListener('click', (event) => {
			let isTargetBlot = false;
			for(let i = 0, len = event.path.length; i < len; i++) {
				let curBlot =  Quill.find(event.path[i]);
				if(curBlot instanceof OuterContainer) {
					if(curBlot === this) {
						isTargetBlot = true;
					}
					break;
				}
			}
			if(!isTargetBlot) return;
			if(scroll.focusedContainer) {
				if(scroll.focusedContainer === this) return false;
				scroll.focusedContainer.removeFocusedChange();
			}
			this.addFocusedChange(); 
			return false;
		}, false);
	}

	addFocusedChange() {
		this.scroll.focusedContainer = this;
		if(this.statics.blotName === 'page-container') return;
		this.domNode.classList.add('shadow_container');
	}

	removeFocusedChange() {
		this.domNode.classList.remove('shadow_container');
	}
}