import header_first from '../../../images/guoxing_logo.jpg';

import { 
	HEADER_CONTENT_BLOCK_BLOT_NAME,
	HEADER_CONTENT_IMG__BLOT_NAME
 } from '../../../formats/BLOT_NAMES';

export const guoxin_header = [
	{
		name: HEADER_CONTENT_IMG__BLOT_NAME, 
		value: { 
			url: header_first, 
			// style: `width: 140px; position: absolute; left: ${PageBreak.pagePadding[3]}px; bottom: 0;` 
		}
	},
	{
		name: HEADER_CONTENT_BLOCK_BLOT_NAME,
		value:{
			text: '证券研究报告',
			style: 'position: absolute; right: 23px; bottom: 0; font-weight: 600; width: 500px; text-align: right; border-bottom: 2px solid #293c96;'
		}
	}
]