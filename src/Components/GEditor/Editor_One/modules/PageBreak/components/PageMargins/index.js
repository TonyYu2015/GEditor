import React, { useCallback, useEffect, useState } from "react";
import { Modal, Row, Col, InputNumber } from "@wind/wind-ui";
import { editSize, px2cm, cm2px } from "../../../../common";

import './index.less';
import { writeUserLog } from "../../../../../../../utils/request";

export default function PageMargins(props) {
	const {
		quill,
		children,
		reportPagePadding
	} = props;
	const [visible, setVisible] = useState(false);
	const [pagePadding, setPagePadding] = useState([editSize.padding_top, editSize.padding, editSize.padding_bottom, editSize.padding]);

	const onOk = useCallback((pagePadding, quill) => {
		// 记录功能点
		writeUserLog('922604650035', { type: '页边距' });
		const pageBreak = quill.getModule('pageBreak');
		pageBreak.updatePagePadding(pagePadding);
		setVisible(false);
	}, []);

	// effect

	useEffect(() => {
		if(quill) {
			const pageBreak = quill.getModule('pageBreak');
			pageBreak.updatePagePadding(pagePadding);
		}
	}, [quill]);

	useEffect(() => {
		if(reportPagePadding) {
			const pageBreak = quill.getModule('pageBreak');
			setPagePadding(reportPagePadding);
			pageBreak.updatePagePadding(reportPagePadding);
		}
	}, [reportPagePadding])

	return (
		[
			React.cloneElement(
				children,
				{
					onClick() {
						setVisible(true);
					}
				}
			),
			<Modal
				visible={visible}
				className='page-margins'
				width={300}
				closable={false}
				title="页边距"
				onOk={() => onOk(pagePadding, quill)}
				onCancel={() =>setVisible(false)}
			>
				<Row>
					<Col span={12} style={{textAlign:'center',paddingBottom:'20px'}}>
						上：
					</Col>
					<Col span={12}>
						<InputNumber 
							min={1} 
							max={1000} 
							defaultValue={px2cm(pagePadding[0])} 
							formatter={val => `${val}厘米`}
							onChange={val => {
								let tmpPagePadding = [...pagePadding];
								tmpPagePadding[0] = cm2px(val);
								setPagePadding(tmpPagePadding);
							}} 
						/>
					</Col>
				</Row>
				<Row>
					<Col span={12} style={{textAlign:'center',paddingBottom:'20px'}}>
						下：
					</Col>
					<Col span={12}>
						<InputNumber 
							min={1} 
							max={1000} 
							defaultValue={px2cm(pagePadding[2])} 
							formatter={val => `${val}厘米`}
							onChange={val => {
								let tmpPagePadding = [...pagePadding];
								tmpPagePadding[2] = cm2px(val);
								setPagePadding(tmpPagePadding);
							}} 
						/>
					</Col>
				</Row>
				<Row>
					<Col span={12} style={{textAlign:'center',paddingBottom:'20px'}}>
						左：
					</Col>
					<Col span={12}>
						<InputNumber 
							min={1} 
							max={1000} 
							defaultValue={px2cm(pagePadding[3])} 
							formatter={val => `${val}厘米`}
							onChange={val => {
								let tmpPagePadding = [...pagePadding];
								tmpPagePadding[3] = cm2px(val);
								setPagePadding(tmpPagePadding);
							}} 
						/>
					</Col>
				</Row>
				<Row>
					<Col span={12} style={{textAlign:'center'}}>
						右：
					</Col>
					<Col span={12}>
						<InputNumber 
							min={1} 
							max={1000} 
							defaultValue={px2cm(pagePadding[1])} 
							formatter={val => `${val}厘米`}
							onChange={val => {
								let tmpPagePadding = [...pagePadding];
								tmpPagePadding[1] = cm2px(val) ;
								setPagePadding(tmpPagePadding);
							}} 
						/>
					</Col>
				</Row>
			</Modal>
		]
	)
}