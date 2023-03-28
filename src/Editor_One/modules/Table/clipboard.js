import Quill from "quill";

const ClipBoardModule = Quill.import('modules/clipboard');

const IGNORE_STYLE_KEY = ["mso-"];
const IGNORE_STYLE_VALUE = ["windowtext"];

export default class ClipBoard extends ClipBoardModule {
	// to ensure the order of callbacks bounded to the paste event.
	onCapturePaste(e) {
    // if (e.defaultPrevented || !this.quill.isEnabled()) return;
    // e.preventDefault();
    // const range = this.quill.getSelection(true);
    // if (range == null) return;
    const html = e.clipboardData.getData('text/html');
		this.getTableStyle(html);
		super.onCapturePaste(e);
	}

	// 提取table样式
	getTableStyle(html) {
		// console.log("=====>>>>>htmllll", html);
		const matchRes = [...html.matchAll(/[^{}\w]*([\w\d]*)[^{}\w]*{([^{}]*:[^{}]*;)}/g)];
		// console.log("=====>>>>>", matchRes);
		this.quill.tableStyle = this.normalizeStyle(matchRes);
	}

	normalizeStyle(matchs = []) {
		let styleObj = {};
		for(let i = 0, len = matchs.length; i < len; i++) {
			let tmpStyle = matchs[i];
			let styleStrArr = tmpStyle[2].replace(/↵|\s/g, "").split(';').filter(m => !!m);
			styleObj[tmpStyle[1]] = {};
			for(let m of styleStrArr) {
				let n = m.split(':');
				if(!n[0] || !n[1] || IGNORE_STYLE_KEY.find(m => ~n[0].indexOf(m)) || IGNORE_STYLE_VALUE.find(m => ~n[1].indexOf(m))) continue;
				styleObj[tmpStyle[1]][n[0]] = n[1];
			}
			if(Object.keys(styleObj[tmpStyle[1]]).length === 0) {
				delete styleObj[tmpStyle[1]];
			}
		}
		return styleObj;
	}
}