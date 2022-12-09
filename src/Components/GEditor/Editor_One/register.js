
import Quill from 'quill';
// import {ImageDrop} from 'quill-image-drop-module';
// import ImageResize from 'quill-image-resize-module';
// import BlotFormatter from 'quill-blot-formatter';

// import { DividerBlot } from './formats/dividers';
// import Header from './formats/header';
// import List from './formats/list';
// import ContainerFlag from './formats/container_flag';
// import Table from './modules/Table';
// import EditContainer from './formats/editContainer';
// import * as style from './attrs/styleAttrs'
// import { SizeStyle } from './formats/size';
// import { Font } from './formats/font';
// import lineHeightStyle from "./formats/lineHeight";

import OuterContainer from './blots/outerContainer';
import PageBreak from './modules/PageBreak';
import Layout from "./modules/Layout";
import History from './modules/History';
// import KeyBoard from './modules/KeyBoard';
// import FormatBrush from './modules/FormatBrush';
// import RenderReactComponent from './modules/RenderRC';
// import FreeText from './modules/FreeText';
// import FullWidth from './modules/FullWidth';
// import CustomSet from "./modules/CustomSet";
import FreeContainer from './modules/FreeContainer';


// const objFormats = {};
// const objAttr = {};
// Object.keys(style).forEach(key => {
// 	objFormats[`formats/${style[key].attrName}`] = style[key];
// 	objAttr[`attributors/style/${style[key].attrName}`] = style[key];
// });

// Quill.register(
//   {
// 		...objAttr,
//     'attributors/style/size': SizeStyle,
//     'attributors/style/lineHeight': lineHeightStyle,
//   },
//   true,
// );


Quill.register({
	'modules/history': History,
	'modules/pageBreak': PageBreak,
	'modules/freeContainer': FreeContainer,
	// 'modules/better-table': Table,
	// 'modules/imageDrop': ImageDrop,
	// 'modules/imageResize': ImageResize,
	// 'modules/blotFormatter': BlotFormatter,
	// 'modules/renderRC': RenderReactComponent,
	// 'modules/freeText': FreeText,
	// 'modules/fullWidth': FullWidth,

	// 'modules/quillDeltaToHtmlConverter':QuillDeltaToHtmlConverter,

	'modules/layout': Layout,
//   'modules/keyboard': KeyBoard,
	// 'modules/formatBrush':FormatBrush,


	// ...objFormats,
	// 'formats/dividerBlot':DividerBlot, // 分割线
	// 'formats/header':Header, 
	// 'formats/list': List, 
	// 'formats/containerFlag': ContainerFlag, 
	// 'formats/editContainer': EditContainer, 
	// 'formats/size': SizeStyle,
	// 'formats/font': Font,
	// 'formats/lineHeight': lineHeightStyle,
	'formats/outerContainer': OuterContainer,
}, true);

export default Quill;