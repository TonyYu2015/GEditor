import React, { useCallback } from "react";

export default function EasyDragDrop({data, children}) {

	const dragStart = useCallback((e) => {
		e.dataTransfer.setData("text/plain", data);
	}, []);

	return (
		<div
			draggable	
			unselectable
			onDragStart={dragStart}
		>
			{children}
		</div>
	)
}