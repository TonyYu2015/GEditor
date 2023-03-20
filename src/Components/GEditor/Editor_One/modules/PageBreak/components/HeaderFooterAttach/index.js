import { Checkbox, Dropdown, Menu } from "antd";
import React, { useEffect, useState } from "react";
import ReactDOM from 'react-dom/client';

function HeaderFooterAttach(props) {
	const {
		isFirst,
		isFirstDiff = false,
		text,
		remove,
		toggleFirstPage
	} = props;

	const [isFirstDifferent, setFirstDifferent] = useState(isFirstDiff);


	useEffect(() => {
		setFirstDifferent(isFirstDiff);
	}, [isFirstDiff]);

	return (
		<>
			<span style={{
				float: 'left',
				lineHeight: '24px'
			}}>
				{
					isFirst ?
						isFirstDifferent ? `FirstPage${text}` : text
						: text
				}
			</span>
			{
				isFirst &&
				<Checkbox
					onChange={e => {
						toggleFirstPage(e.target.checked);
						setFirstDifferent(e.target.checked);
					}}
					checked={isFirstDifferent}
				>FirstPageDifferent</Checkbox>
			}
			<Dropdown
				overlay={
					<Menu selectable>
						<Menu.Item onClick={remove}>
							{`remove ${text}`}
						</Menu.Item>
					</Menu>
				}
			>
				<span
					style={{
						border: "1px solid #06c",
						borderRadius: "4px",
						padding: "1px 2px",
						cursor: "default",
						lineHeight: "24px"
					}}
				>option</span>
			</Dropdown>
		</>
	)
}

export default function RenderHeaderFooterAttach({ isFirst, text, container, remove, isFirstDiff, toggleFirstPage }) {
	if (!(container instanceof HTMLElement)) {
		console.error("container must be HTMLElement!!!");
		return;
	}
	ReactDOM.createRoot(container)
	.render(
		<HeaderFooterAttach
			isFirst={isFirst}
			text={text}
			remove={remove}
			toggleFirstPage={toggleFirstPage}
			isFirstDiff={isFirstDiff}
		/>
	);
}