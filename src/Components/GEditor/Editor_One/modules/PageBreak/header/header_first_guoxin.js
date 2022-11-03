import { 
	HEADER_FIRST_BLOCK_BLOT_NAME,
	HEADER_FIRST_CONTAINER_BLOT_NAME,
	HEADER_FIRST_IMG_BLOT_NAME
 } from '../../../formats/BLOT_NAMES';
import header_first from '../../../images/guoxing_logo.jpg';

export const guoxin_header_first = [
	{
		name: HEADER_FIRST_IMG_BLOT_NAME, 
		value: { 
			url: header_first, 
			style: 'width: 140px; position: absolute; left: 0; bottom: 0;' 
		}
	},
	{
		name: HEADER_FIRST_BLOCK_BLOT_NAME,
		value:{
			text: '证券研究报告| 2022年03月23日',
			style: 'position: absolute; right: 23px; bottom: 10px; font-weight: 600; min-width: 100px;'
		}
	}
]