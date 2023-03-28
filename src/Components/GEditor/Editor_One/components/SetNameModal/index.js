import React, { useCallback, useEffect, useState } from "react";
import { Modal, Input } from '@wind/wind-ui';

export default function SetNameModal(props) {
	const {
		quillInstance
	} = props;
	const [value, setValue] = useState();
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if(quillInstance) {
			const customSetModule = quillInstance.getModule("customSet");
			customSetModule.setVisible = setVisible;
		}
	}, [quillInstance]);

	const onModalOk = useCallback((name, quillInstance) =>{
		const customSetModule = quillInstance.getModule("customSet");
		customSetModule.save(name);
		setVisible(false);
	}, []);

	return (
		<Modal
			visible={visible}	
			onCancel={_ => setVisible(false)}
			onOk={_ => onModalOk(value, quillInstance)}
			title="保存元件"
		>
			<Input 
				value={value} 
				onChange={e => {
					setValue(e.target.value);
				}} 
				placeholder="请输入元件名称"/>
		</Modal>
	)
}
