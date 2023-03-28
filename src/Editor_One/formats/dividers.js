import Quill from "quill";
import { DIVIDER_BLOT_NAME } from './BLOT_NAMES';

const BlockEmbed = Quill.import('blots/block/embed');

export class DividerBlot extends BlockEmbed {

 }

DividerBlot.blotName = DIVIDER_BLOT_NAME;
DividerBlot.tagName = "hr";