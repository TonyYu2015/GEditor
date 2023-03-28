import Quill from "quill";
const Delta = Quill.import('delta');


export const getRetain = (delta) => {
	if (delta?.ops?.length > 0) {
		let op = delta.ops[0];
		if (op.hasOwnProperty("retain")) {
			return op.retain;
		}
	}
	return undefined;
}

export const setRetain = (delta, retain) => {
	if (delta?.ops?.length > 0) {
		let op = delta.ops[0];
		if (op.hasOwnProperty("retain")) {
			op.retain = retain;
		} else {
			delta.ops.splice(0, 0, { "retain": retain });
		}
	}
}

export const isDebugFunction = (name) => {
	if (window.location?.href?.indexOf(`${name}=true`) != -1) {
		return true;
	}
	return false;
}

const docompareObject = (origin, other, diff, isStopDiff) => {
	if (origin === null || other === null) {
		if (origin === other) {
		} else {
			diff.push([origin, other]);
		}
		return;
	}

	let typea = typeof origin;
	let typeb = typeof other;
	if (typea === typeb) {
		if (typea === "object") {
			let aryOrigin = Object.entries(origin);
			let aryOther = Object.entries(other);

			if (aryOrigin?.length !== aryOther?.length) {
				diff.push([aryOrigin, aryOther]);
				if (isStopDiff) {
					return;
				}
			}

			if (aryOrigin?.length > 0) {
				for (let item of aryOrigin) {
					let originKey = item[0];
					let originValue = item[1];
					if (typeof originValue === 'object') {
						if (isStopDiff && diff.length > 0) {
							return;
						}
						docompareObject(originValue, other[originKey], diff, isStopDiff);
					} else {
						if (originValue !== other[originKey]) {
							diff.push([originValue, other[originKey]]);
							if (isStopDiff) {
								return;
							}
						}
					}
				}
			}
		} else {
			if (origin !== other) {
				diff.push([origin, other]);
				if (isStopDiff) {
					return;
				}
			}
		}

	} else {
		diff.push([origin, other]);
		if (isStopDiff) {
			return;
		}
	}
}

export const compareObject = (origin, other, isDiffStop = true) => {
	let diff = [];
	docompareObject(origin, other, diff, isDiffStop);
	return diff;
}

export const createInsertDelta = (quill, index) => {
	let [line, offset] = quill.getLine(index);
	let delta = new Delta();
	let endIndex = quill.getIndex(line) + line.length() - 1;
	// 在行尾插入，且下一行有内容，索引+1（避免插入容器后，多2个\n）
	if (!isEmptyLine(line, offset) && index === endIndex && line.next) {
		index += 1;
	}
	delta = delta.retain(index);

	// 在‘行尾且行下面无内容’，或者‘行中间’插入新容器，需要插入换行符，避免新插入容器里面内容跟当前行合并
	let isInsertBreak = false;
	let [newline, newOffset] = quill.getLine(index);
	if (isEmptyLine(newline, newOffset)) {
	} else {
		if (newOffset === 0) {
		} else {
			if (index === endIndex) {
				if (newline.next) {
				} else {
					isInsertBreak = true;
				}
			} else {
				isInsertBreak = true;
			}
		}
	}

	if (isInsertBreak) {
		delta = delta.insert('\n');
	}

	return delta;
}


/**
* @description 是否新行第一个位置(行长度为1,光标位置为0)
*/
const isEmptyLine = (line, offset) => {
	if (offset === 0 && line.length() === 1 && line.domNode.textContent === '') {
		return true;
	}
	return false;
}