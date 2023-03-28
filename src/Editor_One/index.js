import React, { useState, useEffect, useRef } from "react";
import { UndoOutlined, RedoOutlined, FormatPainterOutlined } from "@ant-design/icons";
import { Dropdown, Menu, Spin, Affix } from "antd";
// import 'react-resizable/css/styles.css';

import 'quill/dist/quill.snow.css';
// import 'quill-better-table/src/assets/quill-better-table.scss';

import './index.less';

import { editSize } from './common';
import PageMargins from './modules/PageBreak/components/PageMargins';

import { SIZE_NUM } from './formats/size';
import { FONT_TYPE } from './formats/font';
import { lineHeightWhiteList } from './formats/lineHeight';


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

			let report = localStorage.getItem("delta");
			if (report) {
				let jsonReport = JSON.parse(report);
				console.log(jsonReport);
				editorInstance.current.renderReport({ newDelta: jsonReport.delta, nestContainer: jsonReport.nestContainer });
			} else {
				editorInstance.current.addNewPage();
			}
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
					<ToolItem className="ql-insert-toolitem self_fun">
						<Dropdown className="ql-insert-drop" overlay={
							<Menu onClick={e => {
								if (e.key == "freeText") {
									editorInstance.current.handleFreeTextInsert();
								} else if(e.key == "fullWidth") {
									editorInstance.current.handleFullWidthInsert();
								} else {
									editorInstance.current.handleInsert(e.key);
								}
							}}>
								<Menu.Item key="layout_2">TwoColumns</Menu.Item>
								<Menu.Item key="freeText" >FreeText</Menu.Item>
								<Menu.Item key="fullWidth" >FullWidth</Menu.Item>
							</Menu>
						} >
							<span>Insert</span>
						</Dropdown>
					</ToolItem>
					<ToolItem className="ql-borderpadding self_fun">
						<PageMargins quill={editorInstance.current?.quill} reportPagePadding={pagePadding}>
							<span>Padding</span>
						</PageMargins>
					</ToolItem>
					<ToolItem className="ql-pageTopandBottom self_fun">
						<Dropdown
							overlay={
								<Menu onClick={e => {
									editorInstance.current.handleInsert(e.key);
								}}>
									<Menu.Item key="page-header_normal" title="header">
										Header
									</Menu.Item>
									<Menu.Item key="page-footer_normal" title="footer">
										Footer
									</Menu.Item>
								</Menu>
							}>
							<span>HeaderFooter</span>
						</Dropdown>
					</ToolItem>
					<ToolItem className="ql-save self_fun">Save</ToolItem>
					<ToolItem className="ql-clear self_fun">Clear</ToolItem>
				</div>
			</Affix>
			<Spin spinning={!firstPageRenderEnd}>
				<div
					className="edit-range"
					id="editor-wrapper"
					onContextMenu={(event) => {
						event.preventDefault();
					}}
					ref={editRef}
					style={{
						width: editSize.width,
					}}
				>
				</div>
			</Spin>
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