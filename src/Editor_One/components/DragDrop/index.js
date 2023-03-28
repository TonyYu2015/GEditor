import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

export default function DragDrop(props) {
	return (
		<DndProvider backend={HTML5Backend}>
			{props.children}
		</DndProvider>
	)
}

export { Box } from './box';
export { DropZone } from './dropZone';
