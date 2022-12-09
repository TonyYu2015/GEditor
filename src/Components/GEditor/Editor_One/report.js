import Quill from './register';
// import Quill from 'quill';
// import {
// 	DIVIDER_BLOT_NAME
// } from './formats/BLOT_NAMES';
import QUEUE from './idleQueue';
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
					layout: true,
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
					// 'better-table': {
					// 	operationMenu: {
					// 		items: {
					// 			insertColumnRight: {
					// 				text: "向右插入一列"
					// 			},
					// 			insertColumnLeft: {
					// 				text: "向左插入一列"
					// 			},
					// 			insertRowUp: {
					// 				text: "向上插入一行"
					// 			},
					// 			insertRowDown: {
					// 				text: "向下插入一列"
					// 			},
					// 			// mergeCells:{
					// 			// 	text: "合并单元格"
					// 			// },
					// 			// unmergeCells: {
					// 			// 	text: "拆分单元格"
					// 			// },
					// 			mergeCells:false,
					// 			unmergeCells: false,
					// 			deleteColumn: {
					// 				text: "删除选中列"
					// 			},
					// 			deleteRow: {
					// 				text: "删除选中行"
					// 			},
					// 			deleteTable: {
					// 				text: "删除表格"
					// 			},
					// 			// changestyle: {
					// 			// 	text: "修改样式",
					// 			// 	handler() {}
					// 			// },
					// 		},
					// 	}
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
								localStorage.setItem("delta", JSON.stringify(delta));
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
			if(!range) {
				// 编辑区域失去焦点, 记录最后光标位置
				this.lastSelectionIndex = oldRange.index;
			}
		});

		this.quill.clipboard.addMatcher('img', function(node, delta) {
			let ops = [];
			delta.ops.forEach(op => {
				ops.push({
					insert:{image: node.src},
					attributes: {height: node.height, width: node.width}
				})
			})
			delta.ops = ops;
			return delta
		});


		this.quill.scroll.reportInfo = urlParamObj;
		this.quill.QUEUE = QUEUE;
		this.quill.toolbarSet = toolbarSet;
	}

	validateDelta(delta) {
		let childCount = 0, page = 0, record = 0;
		let canSave = true;
		try{
			/**子节点判断 */
			delta.eachLine((line, attr) => {
				if(attr["container-flag"] && attr["container-flag"].container === "page-container") {
					if(childCount !== record) {
						canSave = false;
						throw new Error(`第 ${page} 页子节点匹配错误!`);
					}
					page++;
					childCount = 0;
					record = +attr["container-flag"].childlength;
				}
				line.ops.forEach(item => {
					if(typeof item.insert !== "string" && BlockEmbed.isPrototypeOf(Quill.import(`formats/${Object.keys(item.insert)[0]}`))) {
						childCount++;
					}
				});
				childCount++;
			});

			/** 判断最后一页 */
			if(childCount !== record) {
				canSave = false;
				throw new Error(`第 ${page} 页子节点匹配错误!`);
			}
		} catch(err) {
			console.error("delta 结构错误: ", err.message);
		}
		return canSave;
	}

	preventFocusScroll() {
		const scrollDom = this.quill.scroll.domNode;
		const originFocus = scrollDom.focus;
		scrollDom.focus = function() {
			originFocus.call(this, {preventScroll: true});
		}
	}

	renderReport(newDelta) {
		const quill = this.quill;
		const history = quill.getModule('history');
		history.ignoreChange = true;
		quill.isLoadingRender = true;
		quill.setContents(new Delta(newDelta), Quill.sources.API);
		setTimeout(() =>{
			history.ignoreChange = false;
		});
		quill.isLoadingRender = false;
	}

	addNewPage() {
		const pageBreak = this.quill.getModule('pageBreak');
		pageBreak.genOnePage({index: 1, pageNum: 1});
		this.setFirstPageRenderEnd(true);
	}

	renderReportAsync(newDelta, ) {
		const quill = this.quill;
		// 分批加载优化
		const pageDeltaArr = newDelta.reduce((a, b) => {
			if(b.attributes && b.attributes['container-flag'] && b.attributes['container-flag'].container === 'page-container') {
				a.push([]);
			}
			a[a.length - 1].push(b);
			return a;
		}, []);

		quill.isLoadingRender = true;
		quill.asyncTasksAfterLoadingRender = [];
		quill.asyncTasksAfterLoadingRender.push(() => {
			quill.isLoadingRender = false;
			if(quill.scroll.reportInfo.new) {
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
			if(renderCount === 1) {
				quill.setContentsAsync(new Delta(curDelta).delete(1), Quill.sources.API);
				quill.QUEUE.pushTask(_ => {
					this.setFirstPageRenderEnd(true)
				});
			} else {
				const length = quill.getLength();
				quill.updateContentsAsync(new Delta().retain(length).delete(1).concat(new Delta(curDelta)), Quill.sources.API);
			}
			if(args.length > 0) {
				this.rennderInQueue(args);
			} else {
				// loadingRender end
				while(quill.asyncTasksAfterLoadingRender.length > 0) {
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
		if(~key.indexOf('layout')) {
			const layout = this.quill.getModule('layout');
			layout.insertLayout({span: key.split("_")[1], index: this.lastSelectionIndex});
		} else if(~key.indexOf('page')) {
			const pageBreak = this.quill.getModule('pageBreak');
			pageBreak.updateHeaderOrFooter(key);
		}
	}

	handleFreeTextInsert() {
		const freeText = this.quill.getModule('freeText');
		freeText.insert({index: this.lastSelectionIndex});
	}

	handleFullWidthInsert() {
		const fullWidth = this.quill.getModule('fullWidth');
		fullWidth.insert({index: this.lastSelectionIndex});
	}

	// 截取第一页并保存为缩略图
	/**
	 * 原图大小
	 */
	// cutFirstPageAsThumbnail(callback) {
	// 	const firstPageDom = this.quill.scroll.children.head.domNode;

	// 	this.replaceNotsameOriginUrl2Base64(() => {
	// 		html2canvas(firstPageDom)
	// 		.then(canvas => {
	// 			// this.quill.scroll.domNode.parentNode.appendChild(canvas);
	// 			this.transferCanvas(canvas, 15, callback);
	// 		})
	// 		.catch(err => {
	// 			console.error('thumbnail error', err);
	// 		})
	// 	});
	// }

	// replaceNotsameOriginUrl2Base64(callback) {
	// 	const imgBlotArr = this.quill.scroll.children.head.descendants(Image);
	// 	let domArr = [];
	// 	imgBlotArr.forEach(blot => {
	// 		if(!this.isSameOrigin(blot.domNode.src)) {
	// 			domArr.push(blot.domNode);
	// 		}
	// 	});
	// 	if(domArr.length === 0) {
	// 		callback();
	// 	} else {
	// 		Promise.all(domArr.map(dom => Axios(dom.src, {
	// 			responseType: "blob"
	// 		})))
	// 		.then(res => {
	// 			return res.map(m =>  m.data);
	// 		})
	// 		.then(blobs => {
	// 			for(let i = 0; i < blobs.length; i++){
	// 				let reader = new FileReader();
	// 				reader.onload = function() {
	// 					domArr[i].src = `data:image/jpeg;base64,${this.result.split(',')[1]}`;
	// 					if(i === blobs.length - 1) {
	// 						callback();
	// 					}
	// 				}

	// 				reader.readAsDataURL(blobs[i]);
	// 			}
	// 		})
	// 		.catch(err => {
	// 			console.error("Image requests error:", err.message);
	// 			callback();
	// 		});
	// 	}
	// }

	// isSameOrigin(url) {
	// 	if(!(new RegExp(/https?:\/\/.*/)).test(url)) return true;
	// 	let curUrl = new URL(window.location.href);
	// 	let anotherUrl = new URL(url);
	// 	return (
	// 		curUrl.protocol === anotherUrl.protocol
	// 		&& curUrl.hostname === anotherUrl.hostname
	// 		&& (curUrl.port || 80) === (anotherUrl.port || 80)
	// 		);
	// }

	// /**
	//  * 
	//  * @param {HTMLCanvasElement} canvas 
	//  * @param {Number} limitSize 
	//  * @param {Function} callback 
	//  */
	// transferCanvas(canvas, limitSize, callback) {
	// 	const {
	// 		userInfo
	// 	} = this.initialInfo;
	// 	let quality = 1;
	// 	const type = 'jpeg';
	// 	let dataURL = canvas.toDataURL(`image/${type}`, quality);
	// 	let dataURLSize = new Blob([dataURL]).size;

	// 	let kb = Math.ceil(dataURLSize / 1024);
	// 	quality = +(limitSize / kb).toFixed(2);

	// 	if(quality < 1) {
	// 		if(quality > 0) {
	// 			dataURL = canvas.toDataURL(`image/${type}`, quality);
	// 		} else if(quality === 0) {
	// 			dataURL = null;
	// 		}
	// 		canvas.toBlob(blob => {
	// 			let name = `image_${userInfo.userId}_${userInfo.researche_category_id}_${userInfo.id}_${new Date().getTime()}.${type}`;
	// 			// this.downloadPic(blob, name);
	// 			// save2Gfs({blob, name})
	// 			// .then(dir => {
	// 			// 	callback({compressd_chart_url: dir, compressd_chart: dataURL ? dataURL.replace('data:image/jpeg;base64,', '') : null});
	// 			// })
	// 		}, `image/${type}`, 1);
	// 	} else {
	// 		callback({compressd_chart_url: null, compressd_chart: dataURL.replace('data:image/jpeg;base64,', '')});
	// 	}
	// }

	downloadPic(blob, name) {
		let a =document.createElement('a');
		a.download = name || '下载图片';
		a.href = URL.createObjectURL(blob);
		let event = new MouseEvent('click');
		a.dispatchEvent(event);
	}

	//触发更新目录
	updateCatalog(setcatalogue, setimgcatalogue) {
		let delta = this.quill.getContents();
		let dom = document.getElementById('editor-wrapper');
		this.updateCatalogue(delta, dom, setcatalogue, setimgcatalogue);
	}

	updateCatalogue(delta, dom, setcatalogue, setimgcatalogue) {
		console.log("updateCatalogue",delta,dom)
		var keys = 'h1,h2,h3,h4,h5,h6'
		var all=dom.getElementsByTagName('*');
		var nodes=[];
		var imgnodes=[];
		var reg=eval('/'+ keys.split(',').join('|')+'/i');
		for(var ii=0;ii<all.length;ii++){
			if(reg.test(all[ii].nodeName)){
				let ind = delta.ops.findIndex(e => e.insert.toString().indexOf(all[ii].innerHTML) > 0);
				// console.log("ind",ind,all[ii].innerHTML)
				if(all[ii].innerHTML != '<br>') {
					nodes.push({
						tagName:all[ii].tagName,
						index:1,
						title:all[ii].innerText || ''
					});
				}
					
			}	
		}

		setcatalogue(nodes);
		
		//获取图片目录
		var imgall = dom.getElementsByTagName('img');
		var imgreg=eval('/'+ 'img' + '/i');
		for(let ii=0;ii<imgall.length;ii++){
			if(imgreg.test(imgall[ii].nodeName)){
				imgnodes.push({
					tagName:'',
					index:1,
					title:`图片${ii+1}`
				})	
			}
		}

		// console.log("imgnodes",nodes,imgnodes)
		setimgcatalogue(imgnodes);

	}

	InsertTable(row, col, setInsertTableModal) {
		let tablemodule = this.quill.getModule('better-table');
		tablemodule.insertTable(row,col);
		// tablemodule.insertTable([
		// 	[1,2,3,4,5,6], 
		// 	['a', 'b', 'c', 'd', 'e', 'f']
		// ]);
		setInsertTableModal(false)
	}

} 