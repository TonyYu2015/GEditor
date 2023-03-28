import { FUN_BLOT_NAME } from './formats/BLOT_NAMES';

export function tranform2CustomDelta(delta) {
	return delta.map(item => {
		if (item.insert) {
			let insertKey = Object.keys(item.insert)[0];
			if (insertKey === FUN_BLOT_NAME) {
				return {
					insert: { [insertKey]: item.attributes }
				}
			}
		}
		return item;
	});
}

function isWindows() {
	return /windows|win32/i.test(navigator.userAgent);
}

function isMac() {
	return /macintosh|mac os x/i.test(navigator.userAgent);
}

let DPR = window.devicePixelRatio;
let screenDpi = isMac() ? 76 : 96;
let transformRate = screenDpi * DPR;
function A4Size2Px() {
	// 一般的屏幕分辨率DPI为96，mac是76
	// 分辨率 XX 像素/英寸,一英寸为25.4mm
	// A4尺寸 210mm * 297mm, => 8.27 * 11.69 inch
	// 打印机DPI为600
	// 得出由普通A4纸根据不同的屏幕分辨率计算出的尺寸
	// 长江证券 上 23mm 下 20mm 左右 15mm

	let pageWhite_inch = 0.6; // inch 左右页边距 15 / 25.4
	let padding_top_inch = 0.9; // 23 / 25.4
	let padding_bottom_inch = 0.9; // 23 / 25.4

	return {
		width: Math.round(8.27 * transformRate), // 210 / 25.4
		height: Math.round(11.69 * transformRate), // 297 / 25.4
		padding: Math.round(pageWhite_inch * transformRate),
		padding_top: Math.round(padding_top_inch * transformRate),
		padding_bottom: Math.round(padding_bottom_inch * transformRate),
	}
}

export function px2cm(px) {
	return Math.round(px / transformRate * 25.4 / 10);
}

export function cm2px(cm) {
	return Math.round(cm * 10 / 25.4 * transformRate);
}

export const editSize = A4Size2Px();

export function genId(str) {
	return `${str}_${Math.random().toString(32).slice(2, 6)}`;
}

export function addMouseMove(moveEle, mouseDownEle) {
	if (!moveEle instanceof HTMLElement) {
		throw new Error("传入正确的html元素");
	}
	mouseDownEle = mouseDownEle || moveEle;

	const mouseDown = function (e) {
		e = e || window.event;
		if (e.target == mouseDownEle || e.target.parentElement?.parentElement == mouseDownEle) {
		}
		else {
			return;
		}

		if (moveEle.style.cursor != 'move') {
			return;
		}

		let parentElement = moveEle.parentElement;
		let editWidth = parentElement.clientWidth;
		let editHeight = parentElement.clientHeight;
		let style = parentElement.style;
		let paddingLeft = parseInt(style.paddingLeft || '0');
		let paddingTop = parseInt(style.paddingTop || '0');
		let maxLeft = editWidth - moveEle.clientWidth - paddingLeft;
		let maxTop = editHeight - moveEle.clientHeight - paddingTop;
		let minLeft = paddingLeft;
		let minTop = paddingTop;

		let originalMouseX = e.clientX;
		let originalMouseY = e.clientY;
		let originalOffsetX = moveEle.offsetLeft;
		let originalOffsetY = moveEle.offsetTop;

		function mouseMove(e) {
			e.preventDefault();
			e = e || window.event;
			let left = e.clientX - originalMouseX + originalOffsetX;
			let top = e.clientY - originalMouseY + originalOffsetY;

			let nextLeft = left > minLeft ? (left > maxLeft ? `${maxLeft}px` : `${left}px`) : minLeft;
			let nextTop = top > minTop ? (top > maxTop ? `${maxTop}px` : `${top}px`) : minTop;
			if (moveEle.style.left !== nextLeft) {
				moveEle.style.left = nextLeft;
			}

			if (moveEle.style.top !== nextTop) {
				moveEle.style.top = nextTop;
			}
		}

		function mouseUp(e) {
			document.removeEventListener('mousemove', mouseMove);
			document.removeEventListener('mouseup', mouseUp);
		}

		document.addEventListener('mousemove', mouseMove);
		document.addEventListener('mouseup', mouseUp);
	}




	const getMoveEnabled = (target, e) => {
		let mouseX = e.clientX;
		let mouseY = e.clientY;
		let rect = target.getBoundingClientRect();

		let hotArea = 10;
		let leftHot = [rect.x - hotArea, rect.x + hotArea];
		let rightHot = [rect.x + rect.width - hotArea, rect.x + rect.width];
		let topHot = [rect.y - hotArea, rect.y + hotArea];
		let bottomHot = [rect.y + rect.height - hotArea, rect.y + rect.height + hotArea];

		let isMoveEnabled = false;

		if ((mouseX >= leftHot[0] && mouseX <= leftHot[1]) || (mouseX >= rightHot[0] && mouseX <= rightHot[1])) {
			if (mouseY >= rect.y && mouseY <= (rect.y + rect.height)) {
				isMoveEnabled = true;
			}
		}

		if ((mouseY >= topHot[0] && mouseY < topHot[1]) || (mouseY >= bottomHot[0] && mouseY < bottomHot[1])) {
			if (mouseX >= rect.x && mouseX <= (rect.x + rect.width)) {
				isMoveEnabled = true;
			}
		}

		// 排除尺寸缩放按钮
		if (mouseX >= rightHot[0] && mouseY >= bottomHot[0]) {
			isMoveEnabled = false;
		}
		return isMoveEnabled;
	}

	const mouseMoveOver = function (e) {
		e = e || window.event;
		if (e.target == mouseDownEle || e.target.parentElement?.parentElement == mouseDownEle) {
		}
		else {
			moveEle.style.cursor = null;
			return;
		}
		let isMoveEnabled = getMoveEnabled(mouseDownEle, e);
		// console.log(e.clientX, e.clientY, isMoveEnabled);
		mouseDownEle.style.cursor = isMoveEnabled ? "move" : null;
	}

	mouseDownEle.addEventListener('mousemove', mouseMoveOver);
	mouseDownEle.addEventListener('mousedown', mouseDown);
}
export function addResizeMove(moveEle, mouseDownEle) {
	if (!moveEle instanceof HTMLElement) {
		throw new Error("传入正确的html元素");
	}
	mouseDownEle = mouseDownEle || moveEle;

	const mouseDown = function (e) {
		e = e || window.event;
		if (e.target !== mouseDownEle) return;

		let maxLeft = moveEle.parentElement.clientWidth - moveEle.clientWidth;
		let maxTop = moveEle.parentElement.clientHeight - moveEle.clientHeight;

		let leftSpace = e.clientX - moveEle.offsetLeft;
		let topSpace = e.clientY - moveEle.offsetTop;

		function mouseMove(e) {
			e = e || window.event;
			e.preventDefault();

			let left = e.clientX - leftSpace;
			let top = e.clientY - topSpace;

			moveEle.style.left = left > 0 ? (left > maxLeft ? `${maxLeft}px` : `${left}px`) : 0;
			moveEle.style.top = top > 0 ? (top > maxTop ? `${maxTop}px` : `${top}px`) : 0;
			return false;
		}

		document.addEventListener('mousemove', mouseMove);
		document.addEventListener('mouseup', () => {
			document.removeEventListener('mousemove', mouseMove);
		});
	}

	mouseDownEle.addEventListener('mousedown', mouseDown);
}

export function isRcCompontent(domNode) {
	if (
		domNode.parentNode
	) {
		if (typeof domNode.parentNode.className === 'string') {
			if (~domNode.parentNode.className.indexOf('ql-render-react-component')) {
				return true;
			} else if (~domNode.parentNode.className.indexOf('ql-page-container')) {
				return false;
			} else {
				return isRcCompontent(domNode.parentNode);
			}
		} else {
			return isRcCompontent(domNode.parentNode);
		}
	}
	return false;
}

/**
 * getEventComposedPath
 *  compatibility fixed for Event.path/Event.composedPath
 *  Event.path is only for chrome/opera
 *  Event.composedPath is for Safari, FF
 *  Neither for Micro Edge
 * @param {Event} evt
 * @return {Array} an array of event.path
 */
export function getEventComposedPath(evt) {
	let path
	// chrome, opera, safari, firefox
	path = evt.path || (evt.composedPath && evt.composedPath())

	// other: edge
	if (path == undefined && evt.target) {
		path = []
		let target = evt.target
		path.push(target)

		while (target && target.parentNode) {
			target = target.parentNode
			path.push(target)
		}
	}

	return path
}