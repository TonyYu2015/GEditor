import Quill from './register';
// import Quill from 'quill';
import QUEUE from './idleQueue';
import { ResizeObserverBlotModule } from './resizeObserver';
import NestContainerManager from "./nestContainerManager";
import { overRideKeyBoard } from './modules/KeyBoard';
import CustomImageSpec from './formats/CustomImageSpec'

let Delta = Quill.import('delta');
// const Image = Quill.import('formats/image');

export default class ReportEditor {
	constructor(initialInfo) {
		this.initialInfo = initialInfo;
		this.setFirstPageRenderEnd = initialInfo.toolbarSet.setFirstPageRenderEnd;
		this.initialQuill();
		this.preventFocusScroll();
	}

	initialQuill() {
		const {
			container,
			toolbar,
			moduleOptions = {},
			urlParamObj,
			toolbarSet,
		} = this.initialInfo;
		const _this = this;

		this.quill = new Quill(
			container,
			{
				modules: {
					keyboard: {
						bindings: {
							...overRideKeyBoard
						}
					},
					table: false,
					pageBreak: true,
					freeContainer: true,
					// imageDrop:true,
					formatBrush: true,
					freeText: true,
					fullWidth: true,
					layout: true,
					blotFormatter: {
						specs: [CustomImageSpec],
					},
					toolbar: {
						container: toolbar,
						handlers: {
							// divider() {
							// 	const quill = this.quill;
							// 	let range = quill.getSelection();
							// 	quill.updateContents([
							// 		{retain: range.index || 1},
							// 		{insert: { [DIVIDER_BLOT_NAME]: true }},
							// 	])
							// },
							formatBrush: function () {
								const formatBrush = this.quill.getModule('formatBrush');
								formatBrush.toogleFormat();
							},
							save() {
								let delta = this.quill.getContents();
								localStorage.setItem("delta", JSON.stringify({
									delta,
									nestContainer: _this.quill.NestContainerManager.NestContainer
								}));
							},
							clear() {
								localStorage.setItem("delta", "{}");
							}
						}
					},
					history: {
						delay: 1000,
						maxStack: 500
					},
					...moduleOptions
				},
				theme: 'snow'
			}
		);

		// 按键绑定
		// new EnterKey(quill);
		// 绑定选区事件
		this.quill.on('selection-change', (range, oldRange, source) => {
			if (!range) {
				// 编辑区域失去焦点, 记录最后光标位置
				this.lastSelectionIndex = oldRange.index;
			}
		});

		this.quill.clipboard.addMatcher('img', function (node, delta) {
			let ops = [];
			delta.ops.forEach(op => {
				ops.push({
					insert: { image: node.src },
					attributes: { height: node.height, width: node.width }
				})
			})
			delta.ops = ops;
			return delta
		});


		this.quill.QUEUE = QUEUE;
		this.quill.NestContainerManager = new NestContainerManager(this.quill);
		this.quill.toolbarSet = toolbarSet;
		this.quill.resizeObserver = new ResizeObserverBlotModule();
	}

	preventFocusScroll() {
		const scrollDom = this.quill.scroll.domNode;
		const originFocus = scrollDom.focus;
		scrollDom.focus = function () {
			originFocus.call(this, { preventScroll: true });
		}
	}

	renderReport({ newDelta, nestContainer }) {
		const quill = this.quill;
		const pageBreak = quill.getModule('pageBreak');

		quill.NestContainerManager.initial(nestContainer);
		quill.isLoadingRender = true;

		let len = this.quill.getLength();
		let delta = new Delta();
		delta.retain(0).delete(len);
		quill.updateContents(delta.retain(0).concat(new Delta(newDelta)).delete(1), Quill.sources.API);
		quill.isLoadingRender = false;
		this.setFirstPageRenderEnd(true);
		pageBreak.HeaderFooterManager.initialize();

		let history = quill.getModule('history');
		history.initRecord(JSON.stringify(quill.getContents()), JSON.stringify(nestContainer));
	}

	addNewPage() {
		const quill = this.quill;
		quill.isLoadingRender = true;
		const pageBreak = this.quill.getModule('pageBreak');
		pageBreak._genOnePage();
		quill.isLoadingRender = false;
		this.setFirstPageRenderEnd(true);
	}

	undo() {
		this.quill.history.undo();
	}

	redo() {
		this.quill.history.redo();
	}

	handleInsert(key) {
		if (~key.indexOf('layout')) {
			const layout = this.quill.getModule('layout');
			layout.insertLayout({ span: key.split("_")[1], index: this.lastSelectionIndex });
		} else {
			const pageBreak = this.quill.getModule('pageBreak');
			pageBreak.updateHeaderOrFooter(key);
		}
	}

	handleFreeTextInsert() {
		const freeText = this.quill.getModule('freeText');
		freeText.insert({ index: this.lastSelectionIndex });
	}

	handleFullWidthInsert() {
		const fullWidth = this.quill.getModule('fullWidth');
		fullWidth.insert({ index: this.lastSelectionIndex });
	}

	downloadPic(blob, name) {
		let a = document.createElement('a');
		a.download = name || '下载图片';
		a.href = URL.createObjectURL(blob);
		let event = new MouseEvent('click');
		a.dispatchEvent(event);
	}

	InsertTable(row, col, setInsertTableModal) {
		let tablemodule = this.quill.getModule('better-table');
		tablemodule.insertTable(row, col);
		// tablemodule.insertTable([
		// 	[1,2,3,4,5,6], 
		// 	['a', 'b', 'c', 'd', 'e', 'f']
		// ]);
		setInsertTableModal(false)
	}

}