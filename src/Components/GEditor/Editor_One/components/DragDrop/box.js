import React from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from './ItemTypes';

export const Box = (props) => {
	const {
		data
	} = props;
	const [{ isDragging }, drag] = useDrag(() => ({
		type: ItemTypes.BOX,
		item: data,
		end: (item, mointor) => {
			const dropResult = mointor.getDropResult();
		},
		collect: (mointor) => ({
			isDragging: mointor.isDragging(),
			handlerId: mointor.getHandlerId(),
		}),
	}));

	return (
		React.cloneElement(
			props.children,
			{
				ref: drag,
				role: 'Box'
			}
		)
	)
}