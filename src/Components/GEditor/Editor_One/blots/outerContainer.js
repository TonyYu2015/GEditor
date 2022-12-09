import { ContainerWrapper } from '../modules/FreeContainer';

export default class OuterContainer extends ContainerWrapper {

	constructor(scroll, domNode, value) {
		super(scroll, domNode, value);
		domNode.addEventListener('mouseenter', (event) => {
			this.addFocusedChange(); 
		}, false);

		domNode.addEventListener('mouseleave', (event) =>{
			this.removeFocusedChange();
		})
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