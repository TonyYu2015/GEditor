
import Quill from 'quill';
import { ImageDrop } from 'quill-image-drop-module';

import { DividerBlot } from './formats/dividers';
import Header from './formats/header';
import ListContainer, { ListContent } from './formats/list';
import Table from './modules/Table';
import { SizeStyle } from './formats/size';
import { Font } from './formats/font';
import lineHeightStyle from "./formats/lineHeight";

import OuterContainer from './blots/outerContainer';
import PageBreak from './modules/PageBreak';
import Layout from "./modules/Layout";
import History from './modules/History';
import KeyBoard from './modules/KeyBoard';
import FormatBrush from './modules/FormatBrush';
import FreeText from './modules/FreeText';
import FullWidth from './modules/FullWidth';
import FreeContainer from './modules/FreeContainer';

Quill.register({
	'modules/history': History,
	'modules/pageBreak': PageBreak,
	'modules/freeContainer': FreeContainer,
	'modules/better-table': Table,
	'modules/imageDrop': ImageDrop,
	'modules/freeText': FreeText,
	'modules/fullWidth': FullWidth,

	'modules/layout': Layout,
	'modules/keyboard': KeyBoard,
	'modules/formatBrush':FormatBrush,


	'formats/dividerBlot':DividerBlot,
	'formats/header': Header,
	'formats/list-container': ListContainer,
	'formats/list-content': ListContent,
	'formats/size': SizeStyle,
	'formats/font': Font,
	'formats/lineHeight': lineHeightStyle,
	'formats/outerContainer': OuterContainer,
}, true);

export default Quill;