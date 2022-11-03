import Quill from "quill";

const Delta = Quill.import('delta');

export default class EnterKey {

	quill
	KeyBoard	

	constructor(quill) {
		this.quill = quill;
		this.KeyBoard = quill.getModule('modules/keyboard');
		this.emptyBreak();
	}

	emptyBreak() {
		this.quill.keyboard.addBinding(
			{
				// key: this.KeyBoard.keys.ENTER,
				key: 'Enter',
			}, {
				empty: true,
				format: ['list'],
				collapsed: true,
			}, function(range, context) {
				console.log("===>>>>enter", range);
        const delta = new Delta()
          .retain(range.index)
          .insert('2222')
        this.quill.updateContents(delta, Quill.sources.USER);
        this.quill.setSelection(range.index + 1, Quill.sources.SILENT);
        this.quill.scrollIntoView()
			}
		);
	}
}

export const overideDefaultEnter = {
	'list empty enter': {
		key: 'Enter',
		collapsed: true,
		format: ['list'],
		empty: true,
		handler(range, context) {
			console.log("====>>>context", context);
			const formats = { list: false };
			if (context.format.indent) {
				formats.indent = false;
			}
			this.quill.formatLine(
				range.index,
				range.length,
				formats,
				Quill.sources.USER,
			);
		},
	}, 
  // 'header enter': {
	// 	key: 'Enter',
	// 	collapsed: true,
	// 	format: ['header'],
	// 	suffix: /^$/,
	// 	handler(range, context) {
	// 		console.log("====>>>context", range, context);
	// 		if(context.line.parent.statics.blotName === 'page-container') {
	// 			this.quill.format
	// 		}
	// 		const [line, offset] = this.quill.getLine(range.index);
	// 		const delta = new Delta()
	// 			.retain(range.index)
	// 			.insert('\n', context.format)
	// 			.retain(line.length() - offset - 1)
	// 			.retain(1, { header: null });
	// 		this.quill.updateContents(delta, Quill.sources.USER);
	// 		this.quill.setSelection(range.index + 1, Quill.sources.SILENT);
	// 		this.quill.scrollIntoView();
	// 	},
	// },
}