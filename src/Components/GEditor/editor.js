import Quill from "quill";
import 'quill/dist/quill.snow.css';

export default class Editor {
	constructor(option) {
		this.option = option;
		this.initialQuill();
	}

	initialQuill() {
		const {
			container,
			toolbar
		} = this.option;

		this.quill = new Quill(
			container,
			{
				modules: {
					toolbar: {
						container: toolbar
					} 
				},
				theme: "snow",
			}
		);
	}
}