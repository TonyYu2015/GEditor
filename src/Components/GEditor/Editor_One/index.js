import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col, Card, Select, Dropdown, Menu, Modal, message, Popover, InputNumber, Button, Spin } from '@wind/wind-ui';
import 'react-resizable/css/styles.css';
import { 
	DownloadO,RedoO, UndoO,	FunctionO, DownO,
	ShareO,	StatisticsO, SmartFormO, BarsO, 
	LineChartO, ColumnChartO, SynO, DesignO, 
	DateLocationO, ThemeO , MinusO, DetailF, 
	UserGroupO, SolutionO, QuestionCircleO,
	DataEditO, SplitChartInHorizontalO, SplitChartInVerticalO,
	DoubleLeftO, SaveO, ReportFormO, HorizontalLineO, LayoutO,
	DetailO, FileO, BookO
} from '@wind/icons';
import Quill from './register';
import 'quill/dist/quill.snow.css';
import 'quill-better-table/src/assets/quill-better-table.scss';

import isEmpty from 'lodash/isEmpty';
import { ReportExport } from '../../../utils/ReportExport';
import './index.less';
import LangDict from '../../../locale/LangDict';
import { commonServiceRequest, getSingleResult, getSingleResult2, writeUserLog } from '../../../utils/request';
import MindMap2 from '../../../components/mindmap2';
import MindMap_G6 from '../../../components/MindMapG6/index';
import { PicExport } from '../../../utils/picExport';
import FrameUtils from '../../ResearchFrame/frameutils';
import moment from 'moment';

// 自定义工具栏
import SetLibraries from "./Toolbar/SetLibraries";
import Material from "./Toolbar/Material";
import Catalogue from "./Toolbar/Catalogue";
import Frame from "./Toolbar/Frame";
import MessageBoard from "./Toolbar/MessageBoard";
import ActivityLog from "./Toolbar/ActivityLog";

import { 
	useReportData, 
	useComponentData, 
	useReportAsTemplate 
} from "./apiHooks";
import { tranform2CustomDelta, editSize } from './common';
import DragDrop, { DropZone, Box } from './components/DragDrop'; // 拖拽组件
import SetNameModal from "./components/SetNameModal";
import PageMargins from './modules/PageBreak/components/PageMargins';

import { SIZE_NUM } from './formats/size';
import { FONT_TYPE } from './formats/font';
import { lineHeightWhiteList } from './formats/lineHeight';


import ReportEditor from './report';

if(window) {
	window.Quill = window.Quill || Quill;
}

const SubMenu = Menu.SubMenu;

const FONT_COLORS = [ "#000000", "#e60000", "#ff9900", "#ffff00", "#008a00", "#0066cc", "#9933ff", "#ffffff", "#facccc"];

export default function Editor(props) {
	const hashStr = new URL(window.location.href).hash;
	const paramStr = hashStr.split('?')[1];
	const ID = hashStr.split("?")[0].split("/")[2];
	let searchEntries = new URLSearchParams(paramStr);
	let urlParamObj = {};
	for(let p of searchEntries) {
		urlParamObj[p[0]] = p[1];
	}

  const userInfo = useSelector(state => state.rms.userInfo)
	const [{reportData, reportInfo = {}}, saveReport] = useReportData({ID, team_id: userInfo.team_list[0].team_id, out_user_id: userInfo.out_user_id, ...urlParamObj});
	const [isTemplate, setTemplate, setAsTemplate, cancelAsTemplate] = useReportAsTemplate(userInfo);
	const [RightBarKey, setRightBarKey] = useState('');
	const [catalogue, setcatalogue] = useState([]);
	const [imgcatalogue, setimgcatalogue] = useState([]);
	const [MacroUrl, setMacroUrl] = useState("/edb.web/plugin/index.html?lan=cn&source=rms");
	const [MacroModal, setMacroModal] = useState(false);
	const [InsertTableModal, setInsertTableModal] = useState(false);
	const [list = [], operation] = useComponentData(userInfo);
	const [SaveTime,setSaveTime] = useState('');
	const [row,setrow] = useState(2);
	const [col,setcol] = useState(1);
	// const [CloseModalVisible, setCloseModalVisible] = useState(false);
	const [visibleFrameModal, setVisibleFrameModal] = useState(false);
	const [report_name, setReportName] = useState('');
	const [dataFrame, setFrameData] = useState(null);
	const [dataMind, setFrameMind] = useState(null);
	const [fm_saveImage, setFMSaveImage] = useState(false);
	const [fm_getMind, setFMGetMind] = useState(false);
	const [fm_picMind, setFMPicMind] = useState('');
	const [firstPageRenderEnd, setFirstPageRenderEnd] = useState(false);

	const editRef = useRef(null);
	const editWrapper = useRef(null);
	const editorInstance = useRef(null);
	const ReportName = urlParamObj.reportName || reportInfo.report_name;
	const ReportType = reportInfo.report_type;

	useEffect(() => {
		if(reportInfo) {
			setTemplate(+reportInfo.is_template === 1);
		}
	}, [reportInfo]);

	useEffect(() => {
		if(!editorInstance.current && editRef.current) {
			editorInstance.current = new ReportEditor({
				container: editRef.current, 
				toolbar: '#ql-toolbar',
				saveReport,
				userInfo,
				urlParamObj,
				ID,
				setMacroUrl,
				setMacroModal,
				setFirstPageRenderEnd,
				operation
			});

			editorInstance.current.saveReportInterval(_ => {
				setSaveTime(moment().format('yyyy/MM/DD HH:mm'));
			});
		}

		return () => {
			if(!editRef.current) {
				editorInstance.current.cancelReportInterval();
				editorInstance.current = null;
				window.Quill = null;
			}
		}
	}, [editRef.current]);


	useEffect(() => {
		if(reportData === null) {
			const tmpDelta = editorInstance.current.quill.getContents();
			if(tmpDelta.ops.length <= 1) {
				editorInstance.current.addNewPage();
			}
		} else if (reportData && !isEmpty(reportData)) {
			let newDelta = reportData.ops || reportData.delta.ops;
			if(newDelta.length > 1) {
				console.log("=====>>>>>GET_DELTA", newDelta);
				editorInstance.current.renderReportAsync(newDelta);
				// editorInstance.current.renderReport(newDelta);
			} else {
				editorInstance.current.addNewPage();
			}
		}
	}, [reportData, editorInstance.current]);


	const handleTemplate = useCallback((id, isTemplate) => {
		if(isTemplate) {
			cancelAsTemplate(id);
		} else {
			setAsTemplate(id);
		}
	}, []);

	const setRightBar = (key,catalogue,imgcatalogue) => {
		// 记录功能点
		if (key) {
			writeUserLog('922604650035', { type: key });
		}
		let rightbar = <div></div>
		switch (key) {
			case '框架':
				rightbar = <Frame
					id={ID}
					userInfo={userInfo}
					handleShowFrameModal={handleShowFrameModal}
				/>
				break;
			case '素材库':
				rightbar = <Material
					userInfo={userInfo}
					id={ID}
				/>
				break;
			case '元件库':
				rightbar = <SetLibraries
					userInfo={userInfo}
					list={list}
					operation={operation}
				/>
				break;
			case '目录':
				rightbar = <Catalogue
					userInfo={userInfo}
					catalogue={catalogue}
					imgcatalogue={imgcatalogue}
					updateCatalog={_ => editorInstance.current.updateCatalog(setcatalogue, setimgcatalogue)}
				/>
				break;
			case '留言板':
				rightbar = <MessageBoard
					userInfo={userInfo}
				/>
				break;
			default:
				break;
		}
		return rightbar;
	}

	const handleExportClick = (e) => {
		DefaultExport(e.key)
	}

	const DefaultExport = (type) => {	
		var element = document.getElementById('editor-wrapper').childNodes[0];
		if(type == '格式切换') {
			message.warning("请选择导出类型！",2);
		}else{
			// 记录功能点
			writeUserLog('922604650035', { type });
			switch(type) {
				case 'h5' :
					ReportExport.exportH5(ReportName,element)
					break;
				case 'pdf' :
					ReportExport.exportPDF(ReportName,element)
					break;
				case 'word' :
					ReportExport.exportWORD(ReportName,element)
					break;
			}
		}
	}
	

	const clicktoWorkBoard = () => {
		let url = window.location.href;
		let index = url.indexOf("ReportPage");
		let key = '';
		switch(ReportType){
			case 1:
				key = 'DailyReport';
				break
			case 2:
				key = 'PerformanceReviews';
				break	
			case 3:
				key = 'StockDepth';
				break
			case 4:
				key = 'SpecialResearch';
				break
			case 5:
				key = 'SpecialReports';
				break
			case 6:
				key = 'PolicyComments';
				break
			case 7:
				key = 'DataComments';
				break
			case 8:
				key = 'strategyWeekly';
				break
			case 9:
				key = 'PortfolioReports';
				break
			default:
				break
		}
		window.location.href = url.slice(0,index) + `WorkBoard/${key}`
	}

	const onChangeRow = (value) => {
		setrow(value)
	}

	const onChangeCol = (value) => {
		setcol(value)
	}


	const handleShowFrameModal = (report_name, dataFrame, dataMind) => {
		console.debug('handleShowFrameModal', report_name, dataFrame, dataMind);
		setReportName(report_name);
		setFrameData(dataFrame);
		setFrameMind(dataMind);
		setVisibleFrameModal(true);
	}

	const handleCloseFrameModal = () => {
		setVisibleFrameModal(false);
	}

	const handleSaveFrame = () => {
		console.debug('【Editor FrameEdit】 handleSaveFrame', dataMind);
		let mindDomIndex = 0;
		// if (window.location.hostname == 'localhost') {
		// 		mindDomIndex = 1;
		// }
		try {
				let domMind = document.getElementById('mindmap2');

				PicExport.getCanvas(domMind, (canvas) => {
						let thumbChart = PicExport.getThumbChart('canvas_framethumb', canvas, 216, 128);
						PicExport.getBase64fromCanvas(thumbChart, (res) => {
								if (res.status == 'success') {
										//self.picMind = res.data;
										setFMPicMind(res.data);
								}
								setFMGetMind(true);
						});
				});
		}
		catch (e) {
				console.error('handleSaveFrame', e);
		}
	}

	const handleDownload = () => {
		console.debug('【Editor FrameEdit】 handleDownload', dataMind);
		let mindDomIndex = 0;
		// if (window.location.hostname == 'localhost') {
		// 	mindDomIndex = 1;
		// }
		let domMind = document.getElementsByClassName('frame_mind_modal')[0];
		console.log("domMind",domMind)
		if (dataFrame && dataFrame.frame_name) {
			PicExport.savePic(domMind, dataFrame.frame_name);
		}
		else {
			PicExport.savePic(domMind, reportInfo.report_name);
		}
	}

	const handleDFMownloadImage = (dataImage) => {
		console.debug('【Editor FrameEdit】 handleDFMownloadImage', dataImage);
		const { dataFrame } = this.props;
		if (dataImage) {
				let blobData = getImageBlobData(dataImage);
				let fileUrlData = window.URL.createObjectURL(blobData);

				let filename = '框架.png';
				if (dataFrame && dataFrame.frame_name) {
						filename = dataFrame.frame_name + '框架.png';
				}
				saveImage(fileUrlData, filename);
		}
	}
	const getImageBlobData = (dataURL) => {
		let arr = dataURL.split(','),
				mime = arr[0].match(/:(.*?);/)[1],
				bstr = atob(arr[1]),
				n = bstr.length,
				u8arr = new Uint8Array(n);
		while (n--) {
				u8arr[n] = bstr.charCodeAt(n);
		}
		return new Blob([u8arr], {
				type: mime
		});
	}
	const saveImage = (data, filename) => {
		let link = document.createElement("a");
		link.href = data;
		link.download = filename;
		let event = document.createEvent("MouseEvents");
		event.initMouseEvent(
				"click",
				true,
				false,
				window,
				0,
				0,
				0,
				0,
				0,
				false,
				false,
				false,
				false,
				0,
				null
		);
		link.dispatchEvent(event);
	}

	const saveFMReport = (report_id, frame_id, userInfo, callback) => {
		console.debug('【Editor FrameEdit】 saveFMReport', report_id, frame_id, reportInfo, userInfo, callback);
		if (report_id && frame_id && userInfo && userInfo.out_user_id) {
				commonServiceRequest.post(
						'saveFMReport',
						[
								{
										name: 'RMSReport.GetStockResearch',
										data: {
												query: `report name=WorkBench.OperationReport type=4 Keys={\"data\":{"id":${report_id},"frame_id":${frame_id}}} out_user_id=${userInfo.out_user_id} v=2`,
										},
								},
						],
				)
						.then(res => {
								console.debug('saveFMReport response', res);
								if (callback) {
										callback(res);
								}
								// let dataReport = getSingleResult2(res, 0);
								// if (dataReport && dataReport.length > 0 && dataReport[0] && dataReport[0].frame_id) {
								//     var query = `report name=WorkBench.QueryReportFrame type=2 Keys={"data":{"id":"${dataReport[0].frame_id}"}} out_user_id=${userInfo.out_user_id} v=2`;
								//     this.getDataDetail(this.frame_type, dataReport[0].frame_id, userInfo.out_user_id);
								// }
								// else {
								//     console.warn('report is not frame_id', dataReport)
								// }
						})
						.catch(err => {
								console.log("saveFMReport err", err);
						});
		}
	}

	const handleFMSetMind = (dataMind) => {
		console.debug('【Editor FrameEdit】 handleFMSetMind', dataMind);
		setFrameMind(dataMind);
	}

	const handleFMGetMind = (valobj) => {
		//const { reportInfo, dataMind, picMind } = this;
		//let self = this;
		//data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAzUAAAHjCAYAAAAaFDH3AAAgAEl
		console.debug('【Editor FrameEdit】 handleGetMind', dataMind,valobj);
		//console.debug(fm_picMind);
		console.debug(fm_picMind.length);

		//const { userInfo } = this.props;
		//const { dataFrame } = this.state;
		//{\"researche_category_id\":2,\"id\":\"0\",\"frame_name\":\"frame_test1\",\"create_user_name\":\"潮晓巍\",\"team_id\":25,\"team_name\":\"Wind股票数据\",\"share_level\":\"1\"}
		//         create_user_name: "潮晓巍"
		// frame_name: "frame_test1"
		// id: "0"
		// researche_category_id: 2
		// share_level: "1"
		// team_id: 25
		// team_name: "Wind股票数据"
		let newFrame = dataFrame;
		if (!dataFrame) {
				let teamInfo = FrameUtils.getTeamInfo(userInfo.team_list);
				newFrame = {
						create_user_name: userInfo.researcher_name,
						frame_name: reportInfo.report_name,
						id: "0",
						researche_category_id: reportInfo.researche_category_id,
						share_level: "1",
						team_id: teamInfo.team_id,
						team_name: teamInfo.team_name,
				}
		}
		try {
			setFMGetMind(false);
				//setFMGetMind(false, () => {
						console.debug('save frame', newFrame, dataMind, fm_picMind, userInfo);
						FrameUtils.save(newFrame, valobj, fm_picMind, userInfo, function (res) {
								let resultFrame = getSingleResult2(res, 0);
								if (resultFrame && resultFrame.length > 0 && resultFrame[0]) {
										let dataFrame = resultFrame[0];
										saveFMReport(reportInfo.id, dataFrame.id, userInfo, function (result) {
												if (result) {
														message.success('保存框架 ' + newFrame.frame_name + ' 成功。', 2, () => {
																//self.props.handleReturn();
														});
												}
												else {

												}
										})
								}
						});
				//});
		}
		catch (e) {
				console.log('保存框架 ' + newFrame.frame_name + ' Error', e);
		}
		
	}

	let modalMindWidth = window.innerWidth >= 1610 ? window.innerWidth - 210 - 600 : 800;
	let modalMindHeight = window.innerHeight >= 657 ? window.innerHeight - 160 : 640;  // 657=768-111
	let widthMind = modalMindWidth - 40 + 'px';
	let heightMind = modalMindHeight - 28 - 1 - 40 - 40 + 'px';
	return (
		<div className="edit-wrapper" >
			<Row>
				<Col span={5} style={{paddingTop:'4px'}}>
					<span style={{cursor:'pointer',paddingLeft:12}} ref={editWrapper} onClick={() => {clicktoWorkBoard()}}>
						<DoubleLeftO/>
						<span>{'返回'}</span>
					</span>
					<span style={{paddingLeft:'12px',color:'#cccccc'}}>{`自动保存于${SaveTime}`}</span>
				</Col>
				<Col span={16}  style={{ textAlign: 'center',position:'relative',left:'-150px' }}>
					<span style={{lineHeight:'28px'}}>{ReportName}</span>
				</Col>
				<Col span={3} style={{textAlign:'right'}}>
					<div className='ReportPage_tooltop'>
						<UserGroupO style={USERGROUP_STYLE} onClick={() =>setRightBarKey('留言板')}/>
						<Popover 
							content={<ActivityLog />}
							trigger='click'
							title='活动日志'
						>
							<SolutionO style={USERGROUP_STYLE} onClick={() => { writeUserLog('922604650035', { type: '活动日志' }) }} />
						</Popover>
						<QuestionCircleO style={USERGROUP_STYLE} />
						
					</div>
				</Col>
				
			</Row>
			<Row style={{background:'rgb(228, 228, 228)',minWidth:'940px'}}>
				<div id="ql-toolbar">
					<Col span={4} style={{borderRight:'1px solid rgb(228, 228, 228)' ,minWidth:'350px'}}>
						<Row>
							<Col span={6} style={{borderRight:'1px solid rgb(228, 228, 228)',minWidth:'80px'}}>
								<Row>
									<ToolItem className="ql-export self_fun">
										<DownloadO/>
										<Dropdown 
										// trigger={['click']} 
										// className="export" 
										overlay={(
												<Menu selectable onClick={handleExportClick}>
													<Menu.Item key='h5'>
													<a target="_blank">h5</a>
													</Menu.Item>
													<Menu.Item key='pdf'>
													<a target="_blank">pdf</a>
													</Menu.Item>
													<Menu.Item key='word'>
													<a target="_blank">word</a>
													</Menu.Item>
												</Menu>
												)} >
											<span id='exportType' style={{position: 'relative'}}>{'导出'}<DownO style={{position: 'absolute', top: '2px'}} /></span>
										</Dropdown>
									</ToolItem>
								</Row>
								<Row>
									<ToolItem className="ql-share self_fun">
										<ShareO/>
										<span style={{color:'#cccccc', cursor:'no-drop'}}>分享</span>
									</ToolItem>
								</Row>
								<Row>
									<ToolItem className="ql-save self_fun">
										<SaveO/>
										保存
									</ToolItem>
								</Row>
							</Col>								
							<Col span={18} style={{width:'250px',marginLeft:'10px'}}>
								<Row>
									<ToolItem className="ql-undo" onClick={_ => editorInstance.current.undo()}>
										<UndoO/>
									</ToolItem>
									<ToolItem className="ql-redo" onClick={_ => editorInstance.current.redo()}>
										<RedoO/>
									</ToolItem>
									<button className="ql-formatBrush">
										<svg width="18px" height="18px" viewBox="0 0 18 18" version="1.1" xmlns="http://www.w3.org/2000/svg">
											<title>格式刷</title>
											<g id="格式刷" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
												<rect id="矩形" className="ql-stroke" stroke="#666666" stroke-width="1.3" x="5.65" y="13.65" width="1" height="1.7" rx="0.5"></rect>
												<rect id="矩形备份" className="ql-stroke" stroke="#666666" stroke-width="1.3" x="8.13110465" y="12.65" width="1" height="2.7" rx="0.5"></rect>
												<rect id="矩形备份-2" className="ql-stroke" stroke="#666666" stroke-width="1.3" x="12.65" y="13.65" width="1" height="1.7" rx="0.5"></rect>
												<path className="ql-stroke" d="M10,2.5 L10.5,7.5 L14,7.5 L14.5,10 L4,10.5 L3.5,8 L7.5,7.5 L7.5,3 L10,2.5 Z" id="形状结合" stroke="#666666"></path>
												<rect id="矩形备份-3" className="ql-stroke" stroke="#666666" x="3.5" y="10.5" width="11" height="5" rx="1"></rect>
											</g>
										</svg>
									</button>
									<button className="ql-italic"/>
									<button className="ql-underline"/>
									<button className="ql-bold"/>
									<select className="ql-color" defaultValue={FONT_COLORS[0]}>
										{FONT_COLORS.map(m => {
											return <option value={m} />
										})}
									</select>
								</Row>
								<Row>
									<select className="ql-header" defaultValue={0} onChange={e => e.persist()}>
										{(() =>{
											let domArr = [];
											for(let i = 0; i < 6; i++) {
												domArr.push(<option value={i}/>);
											}
											domArr.push(<option selected/>);
											return domArr;
										})()}
									</select>
									<select className="ql-font" defaultValue={FONT_TYPE[0]}>
										{FONT_TYPE.map((m, i) => {
											return <option value={m} >{m}</option>
										})}
									</select>
									<select className="ql-size" defaultValue="13px">
										{SIZE_NUM.map(m => {
											return <option value={`${m}px`}>{m}</option>
										})}
									</select>
								</Row>
								<Row>
									<button className="ql-list" value="ordered"/>
									<button className="ql-list" value="bullet"/>
									<button className="ql-align" value="center"/>
									<button className="ql-align" value="right"/>
									<button className="ql-align" value="justify"/>
									<button className="ql-indent" value="+1"/>
									<button className="ql-indent" value="-1"/>
									<select className="ql-lineheight" defaultValue="1.3">
										{lineHeightWhiteList.map((m, i) => {
											return <option value={m} >{m}</option>
										})}
									</select>
								</Row>
							</Col>
						</Row>
						<Row>
							<Col span={6} style={{borderRight:'1px solid rgb(228, 228, 228)'}}>
								<div className="module-name">操作</div>
							</Col>
							<Col span={18}>
								<div className="module-name">格式</div>
							</Col>
						</Row>
					</Col>
					<Col span={1}  style={{borderRight:'1px solid rgb(228, 228, 228)', minWidth:'100px',marginLeft:'10px'}}>
						<Row>
						<ToolItem className="ql-export  self_fun" onClick={() =>setRightBarKey('框架')}>
							<ShareO/>
							框架
						</ToolItem>
						<ToolItem className="ql-material self_fun" onClick={() =>setRightBarKey('素材库')}>
							<StatisticsO/>
							素材库
						</ToolItem>
						<ToolItem className="ql-setLib self_fun" onClick={() =>setRightBarKey('元件库')}>
							<SmartFormO/>
							元件库
						</ToolItem>
						</Row>
						<Row>
							<div className="module-name">文档组件</div>
						</Row>
					</Col>
					<Col span={1}  style={{borderRight:'1px solid rgb(228, 228, 228)', minWidth:'100px',marginLeft:'10px'}}>
						<Row>
						<ToolItem className="ql-borderpadding self_fun">
							<Dropdown 
							// trigger={['click']} 
							className="borderpadding" 
							overlay={(
									<Menu selectable onClick={e => {
										// 记录功能点
										writeUserLog('922604650035', { type: '分栏' });
										editorInstance.current.handleInsert(e.key);
									}}>
										<Menu.Item key="layout_2">二栏</Menu.Item>
										{/* <Menu.Item key="layout_2-1.2">二栏偏左</Menu.Item>
										<Menu.Item key="layout_2-2.1">二栏偏右</Menu.Item>
										<Menu.Item key="layout_3">三栏</Menu.Item> */}
									</Menu>
									)} 
							>
								<div>
								<svg width="18px" height="18px" viewBox="0 0 18 18" version="1.1" xmlns="http://www.w3.org/2000/svg">
									<title>分栏</title>
									<g id="分栏" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
										<path d="M14.9,5 L14.9,3.1 L3.1,3.1 L3.1,5 L14.9,5 Z M14.9,6 L3.1,6 L3.1,14.9 L14.9,14.9 L14.9,6 Z M2.1,1.9 L15.9,1.9 C16.0104569,1.9 16.1,1.98954305 16.1,2.1 L16.1,15.9 C16.1,16.0104569 16.0104569,16.1 15.9,16.1 L2.1,16.1 C1.98954305,16.1 1.9,16.0104569 1.9,15.9 L1.9,2.1 C1.9,1.98954305 1.98954305,1.9 2.1,1.9 Z" id="SaveToTemplate" fill="#666666" fill-rule="nonzero"></path>
										<path d="M8,5.2 C8.11045695,5.2 8.2,5.37219817 8.2,5.58461538 L8.2,14.8153846 C8.2,15.0278018 8.11045695,15.2 8,15.2 L7.2,15.2 C7.08954305,15.2 7,15.0278018 7,14.8153846 L7,5.58461538 C7,5.37219817 7.08954305,5.2 7.2,5.2 L8,5.2 Z" id="路径" fill="#666666" fill-rule="nonzero"></path>
									</g>
								</svg>
								分栏	
								</div>
							</Dropdown>
						</ToolItem>
						<ToolItem className="ql-borderpadding self_fun">
							<svg width="18px" height="18px" viewBox="0 0 18 18" version="1.1" xmlns="http://www.w3.org/2000/svg">
								<title>页边距</title>
								<g id="页边距" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
									<path d="M2.1,1.9 L15.9,1.9 C16.0104569,1.9 16.1,1.98954305 16.1,2.1 L16.1,15.9 C16.1,16.0104569 16.0104569,16.1 15.9,16.1 L2.1,16.1 C1.98954305,16.1 1.9,16.0104569 1.9,15.9 L1.9,2.1 C1.9,1.98954305 1.98954305,1.9 2.1,1.9 Z M3.1,3.1 L3.1,14.9 L14.9,14.9 L14.9,3.1 L3.1,3.1 Z" id="RightSquare" fill="#666666" fill-rule="nonzero"></path>
									<line x1="2.5" y1="4.5" x2="15.5" y2="4.5" id="直线" stroke="#666666" stroke-width="0.6" stroke-linecap="square"></line>
									<line x1="5.5" y1="2.5" x2="5.5" y2="15.5" id="直线-2" stroke="#666666" stroke-width="0.6" stroke-linecap="square"></line>
									<line x1="12.5" y1="2.5" x2="12.5" y2="15.5" id="直线-2备份" stroke="#666666" stroke-width="0.6" stroke-linecap="square"></line>
									<line x1="2.5" y1="13.5" x2="15.5" y2="13.5" id="直线备份" stroke="#666666" stroke-width="0.6" stroke-linecap="square"></line>
								</g>
							</svg>
							<PageMargins quill={editorInstance.current?.quill} reportPagePadding={((reportData || {}).pageBreak || {}).pagePadding}>
								<span>页边距</span>
							</PageMargins>
						</ToolItem>
						<ToolItem className="ql-pageTopandBottom self_fun">
							<Dropdown 
							// trigger={['click']} 
							// className="pageTopandBottom" 
							overlay={(
									<Menu selectable onClick={e => {
										// 记录功能点
										writeUserLog('922604650035', { type: '页眉页脚' });
										editorInstance.current.handleInsert(e.key);
									}}>
										{/* <SubMenu title="页眉">
											<SubMenu title="首页页眉">
												<Menu.Item key="page-header_first-changjiang_header_first">长江证券首页</Menu.Item>
												<Menu.Item key="page-header_first-guoxin_header_first">国信证券首页</Menu.Item>
												<Menu.Item key="page-header_first">无</Menu.Item>
											</SubMenu>
											<SubMenu title="内容页眉">
												<Menu.Item key="page-header-changjiang_header">长江证券内容页</Menu.Item>
												<Menu.Item key="page-header-guoxin_header">国信证券内容页</Menu.Item>
												<Menu.Item key="page-header">无</Menu.Item>
											</SubMenu>
										</SubMenu>
										<SubMenu title="页脚">
											<SubMenu title="首页页脚">
												<Menu.Item key="page-footer_first-changjiang_footer_first">长江证券首页</Menu.Item>
												<Menu.Item key="page-footer_first">无</Menu.Item>
											</SubMenu>
											<SubMenu title="内容页脚">
												<Menu.Item key="page-footer-changjiang_footer">长江证券内容页</Menu.Item>
												<Menu.Item key="page-footer-guoxin_footer">国信证券内容页</Menu.Item>
												<Menu.Item key="page-footer">无</Menu.Item>
											</SubMenu>
										</SubMenu>
										<SubMenu title="新版">
											<SubMenu title="首页页眉">
												<Menu.Item key="page-header_normal_first">空白页眉</Menu.Item>
												<Menu.Item key="page-header_normal_first-guoxin_first">国信证券首页页眉</Menu.Item>
												<Menu.Item key="page-header_first_remove">移除</Menu.Item>
											</SubMenu>
											<SubMenu title="页眉">
												<Menu.Item key="page-header_normal">空白页眉</Menu.Item>
												<Menu.Item key="page-header_normal-guoxin">国信证券页眉</Menu.Item>
												<Menu.Item key="page-header_remove">移除</Menu.Item>
											</SubMenu>
											<SubMenu title="页脚">
												<Menu.Item key="page-footer_normal">空白页脚</Menu.Item>
												<Menu.Item key="page-footer_normal-guoxin">国信证券页脚</Menu.Item>
												<Menu.Item key="page-footer_remove">移除</Menu.Item>
											</SubMenu>
										</SubMenu> */}
										<SubMenu title="首页页眉">
											<Menu.Item key="page-header_normal_first">空白页眉</Menu.Item>
											<Menu.Item key="page-header_normal_first-guoxin_first">国信证券首页页眉</Menu.Item>
											<Menu.Item key="page-header_first_remove">移除</Menu.Item>
										</SubMenu>
										<SubMenu title="页眉">
											<Menu.Item key="page-header_normal">空白页眉</Menu.Item>
											<Menu.Item key="page-header_normal-guoxin">国信证券页眉</Menu.Item>
											<Menu.Item key="page-header_remove">移除</Menu.Item>
										</SubMenu>
										<SubMenu title="页脚">
											<Menu.Item key="page-footer_normal">空白页脚</Menu.Item>
											<Menu.Item key="page-footer_normal-guoxin">国信证券页脚</Menu.Item>
											<Menu.Item key="page-footer_remove">移除</Menu.Item>
										</SubMenu>
									</Menu>
									)} >
								<div>
								<svg width="18px" height="18px" viewBox="0 0 18 18" version="1.1" xmlns="http://www.w3.org/2000/svg">
									<title>页眉页脚</title>
									<g id="页眉页脚" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
										<path d="M2.1,1.9 L15.9,1.9 C16.0104569,1.9 16.1,1.98954305 16.1,2.1 L16.1,15.9 C16.1,16.0104569 16.0104569,16.1 15.9,16.1 L2.1,16.1 C1.98954305,16.1 1.9,16.0104569 1.9,15.9 L1.9,2.1 C1.9,1.98954305 1.98954305,1.9 2.1,1.9 Z M3.1,3.1 L3.1,14.9 L14.9,14.9 L14.9,3.1 L3.1,3.1 Z" id="RightSquare" fill="#666666" fill-rule="nonzero"></path>
										<path d="M13.9,3.9 C14.0104569,3.9 14.1,3.98954305 14.1,4.1 L14.1,4.9 C14.1,5.01045695 14.0104569,5.1 13.9,5.1 L4.1,5.1 C3.98954305,5.1 3.9,5.01045695 3.9,4.9 L3.9,4.1 C3.9,3.98954305 3.98954305,3.9 4.1,3.9 L13.9,3.9 Z" id="路径" fill="#666666" fill-rule="nonzero"></path>
										<path d="M13.9,12.9 C14.0104569,12.9 14.1,12.9895431 14.1,13.1 L14.1,13.9 C14.1,14.0104569 14.0104569,14.1 13.9,14.1 L8.1,14.1 C7.98954305,14.1 7.9,14.0104569 7.9,13.9 L7.9,13.1 C7.9,12.9895431 7.98954305,12.9 8.1,12.9 L13.9,12.9 Z" id="路径" fill="#666666" fill-rule="nonzero"></path>
									</g>
								</svg>
									页眉页脚
								</div>
							</Dropdown>
						</ToolItem>
						</Row>
						<Row>
							<div className="module-name">页面设置</div>
						</Row>
					</Col>
					<Col span={5}  style={{borderRight:'1px solid rgb(228, 228, 228)', width:'180px',marginLeft:'10px'}}>
						<Row>
								<Row>
									<ToolItem className="ql-insertFun self_fun">
										<FunctionO/>
										插入函数
									</ToolItem>
									<ToolItem className="ql-inserttable self_fun" onClick={() => {
										// 记录功能点
										writeUserLog('922604650035', { type: '表格' });
										setInsertTableModal(true)
									}}>
										<DetailO/>
										表格
									</ToolItem>
								</Row>
								<Row>
									{/* <SetLibraries {...COMMON_PROPS}> */}
									<ToolItem className="ql-macro self_fun">
										<LineChartO/>
										宏观数据
									</ToolItem>
									{/* </SetLibraries> */}
									<ToolItem className="ql-catalogue self_fun" onClick={() =>setRightBarKey('目录')}>
										<BarsO/>
										目录
									</ToolItem>
								</Row>
								<Row>
									<ToolItem className="ql-insertEDBfunc self_fun">
										<ColumnChartO/>
										<span>插入图表</span>
									</ToolItem>
								</Row>
						</Row>
						<Row>
							<div className="module-name">插入</div>
						</Row>
					</Col>
					<Col span={4}>
						{/* TODO */}
						<Row>
							<Col span={12}>
								<ToolItem className="ql-template self_fun" onClick={() => handleTemplate(ID, isTemplate)} >
									<FileO/>
									{isTemplate ? '取消模板' : '设为模板'}
								</ToolItem>
								<ToolItem className="ql-customSet self_fun">
									<BookO/>
									保存元件
								</ToolItem>
								{/* <ToolItem className="ql-recover self_fun" >
									复原
								</ToolItem> */}
								{/* <ToolItem className="ql-freetext self_fun" onClick={() => handleFreeTextInsert(QuillRichText, lastSelectionIndex)} >
									文本框
								</ToolItem>
								<ToolItem className="ql-fullwidth self_fun" onClick={() => handleFullWidthInsert(QuillRichText, lastSelectionIndex)} >
									宽幅容器
								</ToolItem> */}
							</Col>
							<Col span={12}>
							</Col>
						</Row>
					</Col>
				</div>
			</Row>
			<DragDrop>
				<Row gutter={16} style={{height: 'calc(100% - 150px)', background: '#e4e4e4', padding: '30px 30px 0'}}>
						<Col 
							span={18} 
							style={{height: '100%', overflow: 'scroll'}}
							// onScroll={(...arg) => {
							// 	console.log("===>>>>scroll", arg);
							// }}
						>
							<Spin spinning={!firstPageRenderEnd}>
								<DropZone quill={editorInstance.current?.quill} lastSelectionIndex={editorInstance.current?.lastSelectionIndex}>
									<div 
										className="edit-range"
										id="editor-wrapper"
										ref={editRef}
										style={{
											width: editSize.width,
											// height: editSize.height,
											// padding: `${editSize.padding_top}px ${editSize.padding}px 0 ${editSize.padding}px`,
										}}
									>
									</div>
								</DropZone>
							</Spin>
						</Col>
						<Col span={6} style={{height: 'calc(100% - 15px)', background: '#fff', padding:'0'}}>
							{/* <SetLibraries/> */}
							{setRightBar(RightBarKey,catalogue,imgcatalogue)}
						</Col>
				</Row>
			</DragDrop>
			<SetNameModal quillInstance={editorInstance.current?.quill}/>
			<Modal
			visible={InsertTableModal}
			className='InsertTableModal'
			closable={false}
			title="插入表格"
			onOk={() => editorInstance.current.InsertTable(row,col, setInsertTableModal)}
			onCancel={() =>setInsertTableModal(false)}
			>
				<Row>
					<Col span={12} style={{textAlign:'center',paddingBottom:'20px'}}>
						行数：
					</Col>
					<Col span={12}>
						<InputNumber min={1} max={1000} defaultValue={2} onChange={onChangeRow} />
					</Col>
				</Row>
				<Row>
					<Col span={12} style={{textAlign:'center'}}>
						列数：
					</Col>
					<Col span={12}>
						<InputNumber min={1} max={1000} defaultValue={1} onChange={onChangeCol} />
					</Col>
				</Row>
			</Modal>
		
		</div>
	)
}


const COMMON_STYLE = {
	width: 'auto',
	height: 'auto',
}

const USERGROUP_STYLE = {
	fontSize: 24,
}

function ToolItem(props) {
	const {
		children
	} = props;


	return (
		<button 
			style={{...COMMON_STYLE}} 
			{...props}
		>{children}</button>
	)
}