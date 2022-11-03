import guoxin_logo from '../../images/guoxing_logo.jpg';

export default {
	guoxin_header: [
		{
			insert: {
				image: guoxin_logo,
			}, 
			attributes: {
				width: '130px',
			} 
		},
		{
			insert: '证券研究报告',
			attributes: {
				float: 'right',
				marginTop: '10px',
				bold: true,
				width: '500px',
				borderBottom: '2px solid #293c96',
				textAlign: 'right'
			}
		},
	],
	guoxin_first_header: [
		{
			insert: {
				image: guoxin_logo,
			}, 
			attributes: {
				width: '130px',
			} 
		},
		{
			insert: '证券研究报告| 2022年03月23日',
			attributes: {
				float: 'right',
				marginTop: '10px',
				bold: true,
				width: '500px',
				textAlign: 'right'
			}
		},
	],
	guoxin_footer: [
		{
			insert: '请务必阅读正文之后的免责声明及其项下所有内容',
			attributes: {
				color: '#293c96',
				height: '40px',
				align: 'right',
			}
		},
		{
			insert: '\n',
			attributes: {
				borderTop: '3px solid #293c96',
			}
		},
		{
			insert:{
				'page-num': {}
			},
		},
	],
}