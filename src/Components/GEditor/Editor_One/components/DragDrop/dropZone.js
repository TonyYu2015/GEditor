import React from 'react';
import { useDrop } from 'react-dnd';
import { ItemTypes } from './ItemTypes';
import cloneDeep from 'lodash/cloneDeep';
import { commonServiceRequest} from '../../../../../utils/request';
import Quill from '../../register';

const Delta = Quill.import('delta');

export const DropZone = (props) => {
	const {
		quill,
		lastSelectionIndex
	} = props;

	const [{ canDrop, isOver, didDrop, item }, drop] = useDrop(() => ({
		accept: ItemTypes.BOX,
		drop: () => ({name: 'DropZone'}),
		collect: (mointor) => ({
			isOver: mointor.isOver(),
			canDrop: mointor.canDrop(),
			didDrop: mointor.didDrop(),
			item: mointor.getItem()
		}),
	}));

	const relatedToReport = (rpid,mtid,usrid) => {
		
		var query = `report name=WorkBench.OperationReport type=7  Keys={'data':{'id':${rpid},'material_list':[{'material_id':${mtid}}]}} out_user_id=${usrid} v=2`
        commonServiceRequest
        .post(
            'MaterialRelatedToReport',
            [
                {
                    name: 'RMSReport.GetStockResearch',
                    data: {
                        query,
                    },
                },
            ],
            this
        )
        .then((res) => console.log("素材关联报告成功",res))
        .catch((err) => console.log(err));
	}
	
	const AddMaterials = (item) => {
			//获取鼠标定位
			const selection = document.getSelection();
			var evt = event || window.event;
			const range = document.caretRangeFromPoint(evt.clientX, evt.clientY);
			if (selection && range) {
				selection.setBaseAndExtent(range.startContainer, range.startOffset, range.startContainer, range.startOffset);
			}
			const index = (quill.getSelection() || {}).index || quill.getLength();
			switch (item.type) {
				case 'png':
					let newDelta = new Delta()
					.retain(index)
					.insert('\n资料来源：\n')
					.insert({image: item.content})
					.insert('\n图xx：\n');

					quill.updateContents(newDelta);
					break;
				case 'text' :
					quill.updateContents([
						{retain: index},
						{insert: item.content},
					])
					break;
				case 'table' :
					const Subtable = quill.getModule('Subtable');
					Subtable.handleFunc(item.content)
					break;
				case 'library' :  //元件库
					let tmpContent = cloneDeep(item.content);
					quill.updateContents(new Delta().retain(index).concat(new Delta(tmpContent)))

					break;
				default :
					quill.updateContents([
						{retain: index},
						{insert: item.content},
					])
					break;
			}
			try{
				if(item.keyValue && item.keyValue.reportid && item.keyValue.materialid && item.keyValue.userid){
					relatedToReport(item.keyValue.reportid,item.keyValue.materialid,item.keyValue.userid)
				}
			}catch(ex){}
		}

	const isActive = canDrop && isOver;
	if(didDrop) {
		console.log("====>>>>>didDrop", item, lastSelectionIndex, quill.getSelection(), quill.getContents());
		AddMaterials(item)
	}

	
	return (
		<div ref={drop} role="DropZone">
			{props.children}
		</div>
		// React.cloneElement(
		// 	props.children,
		// 	{
		// 		ref: drop,
		// 		role: 'DropZone'
		// 	}
		// )
	)
}