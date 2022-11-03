import Quill from "./core";

import {ImageDrop} from 'quill-image-drop-module';
// import ImageResize from 'quill-image-resize-module';
import BlotFormatter from 'quill-blot-formatter';
import { QuillDeltaToHtmlConverter } from 'quill-delta-to-html';

import { DividerBlot } from './formats/dividers';
import Header from './formats/header';
import List from './formats/list';
// import ContainerFlag from './formats/container_flag';
import Table from './modules/Table';
// import EditContainer from './formats/editContainer';
import * as style from './attrs/styleAttrs'
import { SizeStyle } from './formats/size';
import { Font } from './formats/font';
import lineHeightStyle from "./formats/lineHeight";

import InsertFun from "./modules/InsertFun";
import InsertEDBfunc from "./modules/InsertEDBfunc";
import PageBreak from './modules/PageBreak';
import Subtable from "./modules/Subtable";
import SubChart from "./modules/SubChart";
import Insertmacro from "./modules/Insertmacro";
import Layout from "./modules/Layout";
import KeyBoard from './modules/KeyBoard';
import FormatBrush from './modules/FormatBrush';
import RenderReactComponent from './modules/RenderRC';
import FreeText from './modules/FreeText';
import FullWidth from './modules/FullWidth';
import Refresh from './modules/Refresh';
import CustomSet from "./modules/CustomSet";


const objFormats = {};
const objAttr = {};
Object.keys(style).forEach(key => {
	objFormats[`formats/${style[key].attrName}`] = style[key];
	objAttr[`attributors/style/${style[key].attrName}`] = style[key];
});

Quill.register(
  {
		...objAttr,
    'attributors/style/size': SizeStyle,
    'attributors/style/lineHeight': lineHeightStyle,
  },
  true,
);

Quill.register({
	'modules/insertFun': InsertFun,
	'modules/insertEDBfunc': InsertEDBfunc,
	'modules/Subtable': Subtable,
	'modules/SubChart': SubChart,
	'modules/pageBreak': PageBreak,
	'modules/better-table': Table,
	'modules/imageDrop': ImageDrop,
	// 'modules/imageResize': ImageResize,
	'modules/blotFormatter': BlotFormatter,
	'modules/renderRC': RenderReactComponent,
	'modules/freeText': FreeText,
	'modules/fullWidth': FullWidth,
	'modules/refresh': Refresh,

	'modules/insertmacro': Insertmacro,
	// 'modules/quillDeltaToHtmlConverter':QuillDeltaToHtmlConverter,

	'modules/layout': Layout,
  'modules/keyboard': KeyBoard,
	'modules/formatBrush':FormatBrush,
	'modules/customSet':CustomSet,


	...objFormats,
	'formats/dividerBlot':DividerBlot, // 分割线
	'formats/header':Header, 
	'formats/list': List, 
	// 'formats/containerFlag': ContainerFlag, 
	// 'formats/editContainer': EditContainer, 
	'formats/size': SizeStyle,
	'formats/font': Font,
	'formats/lineHeight': lineHeightStyle,
}, true);

export default Quill;