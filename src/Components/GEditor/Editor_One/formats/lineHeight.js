import Quill from "quill";

const Parchment = Quill.import('parchment');
export const lineHeightWhiteList = [1, 1.3, 1.5, 2, 2.5, 3];

const config = {
	scope: Parchment.Scope.INLINE,
	whiteList: lineHeightWhiteList
};

class LineHeightAttributor extends Parchment.StyleAttributor {}

const lineHeightStyle = new LineHeightAttributor(
	'lineheight', 
	'line-height', 
	config
);

export default lineHeightStyle;