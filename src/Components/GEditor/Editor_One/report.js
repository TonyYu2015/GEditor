import Quill from './register';
// import Quill from 'quill';
// import {
// 	DIVIDER_BLOT_NAME
// } from './formats/BLOT_NAMES';
import QUEUE from './idleQueue';
import { ResizeObserverBlotModule } from './resizeObserver';
import NestContainerManager from "./nestContainerManager";
// import CustomImageSpec from './formats/CustomImageSpec'
// import html2canvas from 'html2canvas';
// import { save2Gfs } from './apiHooks';
// import Axios from 'axios';

let Delta = Quill.import('delta');
// const Image = Quill.import('formats/image');
const BlockEmbed = Quill.import('blots/block/embed');

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
			saveReport,
			ID,
			userInfo,
			setMacroUrl,
			setMacroModal,
			operation
		} = this.initialInfo;
		const _this = this;

		this.quill = new Quill(
			container,
			{
				modules: {
					// table: false,
					pageBreak: true,
					freeContainer: true,
					// imageDrop:true,
					// formatBrush: true,
					// freeText: true,
					// fullWidth: true,
					// layout: true,
					// renderRC: {
					// 	team_id: userInfo.team_list[0].team_id,
					// 	operation
					// },
					// customSet: {
					// 	team_id: userInfo.team_list[0].team_id,
					// 	operation
					// },

					// imageResize:{

					// },
					// blotFormatter:{
					// 	specs: [ CustomImageSpec ],
					// },
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
							// export: function() {
							// },
							// catalogue: function() {
							// 	const quill = this.quill;
							// 	let delta = quill.getContents();
							// 	let dom = document.getElementById('editor-wrapper')
							// 	_this.updateCatalogue(delta,dom)
							// },
							// formatBrush: function() {
							// 	const formatBrush = this.quill.getModule('formatBrush');
							// 	formatBrush.toogleFormat();
							// },
							// customSet: function() {
							// 	const customSet = this.quill.getModule("customSet");
							// 	customSet.saveSet();
							// },
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


		this.quill.scroll.reportInfo = urlParamObj;
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

	renderReportAsync(newDelta,) {
		const quill = this.quill;
		// 分批加载优化
		const pageDeltaArr = newDelta.reduce((a, b) => {
			if (b.attributes && b.attributes['container-flag'] && b.attributes['container-flag'].container === 'page-container') {
				a.push([]);
			}
			a[a.length - 1].push(b);
			return a;
		}, []);

		quill.isLoadingRender = true;
		quill.asyncTasksAfterLoadingRender = [];
		quill.asyncTasksAfterLoadingRender.push(() => {
			quill.isLoadingRender = false;
			if (quill.scroll.reportInfo.new) {
				let refreshModule = quill.getModule("refresh");
				refreshModule.refreshAll();
			}
		});

		// check the attr in flag
		quill.asyncTasksAfterLoadingRender.push(() => {
			quill.scroll.children.forEach(pageBlot => {
				pageBlot.checkFlag();
			});
		});

		quill.QUEUE.resetQueue();
		// loadingRender start
		this.rennderInQueue(pageDeltaArr, 1);
	}

	rennderInQueue(args, renderCount) {
		const curDelta = args.shift();
		const quill = this.quill;
		quill.QUEUE.pushTask(() => {
			if (renderCount === 1) {
				quill.setContentsAsync(new Delta(curDelta).delete(1), Quill.sources.API);
				quill.QUEUE.pushTask(_ => {
					this.setFirstPageRenderEnd(true)
				});
			} else {
				const length = quill.getLength();
				quill.updateContentsAsync(new Delta().retain(length).delete(1).concat(new Delta(curDelta)), Quill.sources.API);
			}
			if (args.length > 0) {
				this.rennderInQueue(args);
			} else {
				// loadingRender end
				while (quill.asyncTasksAfterLoadingRender.length > 0) {
					const task = quill.asyncTasksAfterLoadingRender.shift();
					quill.QUEUE.pushTask(task);
				}
			}
		});
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