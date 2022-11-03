
import Quill from 'quill';

const Delta = Quill.import('delta');

class Rpp2Delta {
	constructor() {
		this.pageNum = 0;
		this.delta = new Delta();
	}

	transferToDelta(rppData) {
		rppData.node_list.forEach((item, index) => {
			if(this.pageNum !== item.page_num) {
				this.pageNum = item.page_num;
				this.generatePage();
			}
			this.insertText(item);
		});
	}

	generatePage() {
		this.delta
		.insert({
			'container-flag': {
				container: 'page-container',
				prevlength: 1,
				childlength: 1
			} 
		});
	}

	updatePage() {
		let deltaArr = this.delta.ops;	
		for(let i = deltaArr.length - 1; i >= 0; i--) {
			if(typeof deltaArr[i].insert === 'object' && deltaArr[i].insert['container-flag'].container === 'page-container') {
				deltaArr[i].insert['container-flag'].prevlength = +deltaArr[i].insert['container-flag'].prevlength + 1;
				deltaArr[i].insert['container-flag'].childlength = +deltaArr[i].insert['container-flag'].childlength + 1;
				break;
			}
		}

		this.delta.ops = deltaArr;
	}

	insertText(info) {
		let attr = {};
		if(info.format_size && info.format_size !== '9.96') {
			attr.size = `${Math.ceil(info.format_size * 1.3)}px`;
		}
		this.delta
		.insert(`${info.frame_node_name}\n`, attr);
		this.updatePage();
	}
}

export default new Rpp2Delta();