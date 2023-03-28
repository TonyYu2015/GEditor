import React, { useCallback, useEffect, useState } from "react";
import { Modal, Row, Col, InputNumber } from "antd";
import { px2cm, cm2px } from "../../../../common";

import './index.less';

export default function PageMargins(props) {
	const {
		quill,
		children,
		reportPagePadding
	} = props;
	const [visible, setVisible] = useState(false);
	const [pagePadding, setPagePadding] = useState(reportPagePadding);

	const onOk = useCallback((pagePadding, quill) => {
		const pageBreak = quill.getModule('pageBreak');
		pageBreak.updatePagePadding(pagePadding);
		setVisible(false);
	}, []);

	useEffect(() => {
		if(reportPagePadding) {
			setPagePadding(reportPagePadding);
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
				title="PageMargin"
				onOk={() => onOk(pagePadding, quill)}
				onCancel={() =>setVisible(false)}
			>
				<Row>
					<Col span={12} style={{textAlign:'center',paddingBottom:'20px'}}>
						Up:
					</Col>
					<Col span={12}>
						<InputNumber 
							min={1} 
							max={1000} 
							defaultValue={px2cm(pagePadding[0])} 
							formatter={val => `${val}cm`}
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
						Down:
					</Col>
					<Col span={12}>
						<InputNumber 
							min={1} 
							max={1000} 
							defaultValue={px2cm(pagePadding[2])} 
							formatter={val => `${val}cm`}
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
						Left:
					</Col>
					<Col span={12}>
						<InputNumber 
							min={1} 
							max={1000} 
							defaultValue={px2cm(pagePadding[3])} 
							formatter={val => `${val}cm`}
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
						Right:
					</Col>
					<Col span={12}>
						<InputNumber 
							min={1} 
							max={1000} 
							defaultValue={px2cm(pagePadding[1])} 
							formatter={val => `${val}cm`}
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