import React, { useState, useEffect, useRef } from "react";
import { UndoOutlined, RedoOutlined, FormatPainterOutlined } from "@ant-design/icons";
import { Dropdown, Menu, Spin, Affix } from "antd";
// import 'react-resizable/css/styles.css';

// import Quill from './register';
import 'quill/dist/quill.snow.css';
// import 'quill-better-table/src/assets/quill-better-table.scss';

import './index.less';

import { editSize } from './common';
import PageMargins from './modules/PageBreak/components/PageMargins';
// import DragDrop, { DropZone, Box } from './components/DragDrop'; // 拖拽组件

import { SIZE_NUM } from './formats/size';
import { FONT_TYPE } from './formats/font';
import { lineHeightWhiteList } from './formats/lineHeight';
import ShareDBConnection from './sharedb/sharedb';


import ReportEditor from './report';

const FONT_COLORS = ["#000000", "#e60000", "#ff9900", "#ffff00", "#008a00", "#0066cc", "#9933ff", "#ffffff", "#facccc"];

function useToolbar() {
	const [firstPageRenderEnd, setFirstPageRenderEnd] = useState(true);
	const [history, setHistory] = useState({ undo: false, redo: false });
	const [pagePadding, setPagePadding] = useState([editSize.padding_top, editSize.padding, editSize.padding_bottom, editSize.padding]);

	return [
		{ firstPageRenderEnd, history, pagePadding },
		{ setFirstPageRenderEnd, setHistory, setPagePadding }
	]
}

export default function Editor(props) {
	const hashStr = new URL(window.location.href).hash;
	const paramStr = hashStr.split('?')[1];
	let searchEntries = new URLSearchParams(paramStr);
	let urlParamObj = {};
	for (let p of searchEntries) {
		urlParamObj[p[0]] = p[1];
	}

	const [
		{ firstPageRenderEnd, history, pagePadding },
		toolbarSet
	] = useToolbar();

	const editRef = useRef(null);
	const editorInstance = useRef(null);

	useEffect(() => {
		if (!editorInstance.current && editRef.current) {
			editorInstance.current = new ReportEditor({
				container: editRef.current,
				toolbar: '#ql-toolbar',
				toolbarSet
			});

			// 支持sharedb设置
			editorInstance.current.shareDBInstance = new ShareDBConnection(editorInstance.current, { ...urlParamObj, ID, userInfo });
		}

		return () => {
			if (!editRef.current) {
				editorInstance.current = null;
			}
		}
	}, [editRef.current]);

	return (
		<div className="edit-wrapper" >
			<Affix>
				<div id="ql-toolbar">
					<ToolItem className={`ql-undo${history.undo ? "" : " forbidden"}`} onClick={_ => editorInstance.current.undo()}>
						<UndoOutlined />
					</ToolItem>
					<ToolItem className={`ql-redo${history.redo ? "" : " forbidden"}`} onClick={_ => editorInstance.current.redo()}>
						<RedoOutlined />
					</ToolItem>
					<ToolItem className="ql-formatBrush">
						<FormatPainterOutlined />
					</ToolItem>
					<button className="ql-italic" />
					<button className="ql-underline" />
					<button className="ql-bold" />
					<select className="ql-color" defaultValue={FONT_COLORS[0]}>
						{FONT_COLORS.map(m => {
							return <option value={m} />
						})}
					</select>
					<select className="ql-header" defaultValue={0} onChange={e => e.persist()}>
						{(() => {
							let domArr = [];
							for (let i = 0; i < 6; i++) {
								domArr.push(<option value={i} />);
							}
							domArr.push(<option selected />);
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
					<button className="ql-list" value="ordered" />
					<button className="ql-list" value="bullet" />
					<button className="ql-align" value="center" />
					<button className="ql-align" value="right" />
					<button className="ql-align" value="justify" />
					<button className="ql-indent" value="+1" />
					<button className="ql-indent" value="-1" />
					<select className="ql-lineheight" defaultValue="1.3">
						{lineHeightWhiteList.map((m, i) => {
							return <option value={m} >{m}</option>
						})}
					</select>
					<ToolItem className="ql-borderpadding self_fun">
						<Dropdown
							// trigger={['click']} 
							className="borderpadding"
							overlay={(
								<Menu selectable onClick={e => {
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
								分栏
							</div>
						</Dropdown>
					</ToolItem>
					<ToolItem className="ql-borderpadding self_fun">
						<PageMargins quill={editorInstance.current?.quill} reportPagePadding={pagePadding}>
							<span>页边距</span>
						</PageMargins>
					</ToolItem>
					<ToolItem className="ql-pageTopandBottom self_fun">
						<Dropdown
							// trigger={['click']} 
							// className="pageTopandBottom" 
							overlay={(
								<Menu selectable onClick={e => {
									editorInstance.current.handleInsert(e.key);
								}}>
									<Menu.Item key="header" title="页眉">
										页眉
									</Menu.Item>
									<Menu.Item key="footer" title="页脚">
										页脚
									</Menu.Item>
								</Menu>
							)} >
							<div>
								页眉页脚
							</div>
						</Dropdown>
					</ToolItem>
					<ToolItem className="ql-save">保存</ToolItem>
				</div>
			</Affix>
			{/* <DragDrop> */}
			<Spin spinning={!firstPageRenderEnd}>
				{/* <DropZone quill={editorInstance.current?.quill} lastSelectionIndex={editorInstance.current?.lastSelectionIndex}> */}
				<div
					className="edit-range"
					id="editor-wrapper"
					onContextMenu={(event) => {
						event.preventDefault();
					}}
					ref={editRef}
					style={{
						width: editSize.width,
						// height: editSize.height,
						// padding: `${editSize.padding_top}px ${editSize.padding}px 0 ${editSize.padding}px`,
					}}
				>
				</div>
				{/* </DropZone> */}
			</Spin>
			{/* </DragDrop> */}
		</div>
	)
}


const COMMON_STYLE = {
	width: 'auto',
	height: 'auto',
}

function ToolItem(props) {
	const {
		children
	} = props;


	return (
		<button
			style={{ ...COMMON_STYLE }}
			{...props}
		>{children}</button>
	)
}