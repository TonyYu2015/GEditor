import Quill from "quill";
import cloneDeep from 'lodash/cloneDeep';
const Container = Quill.import('blots/wrapperContainer');
const Parchment = Quill.import('parchment');
const { BlockBlot, ContainerBlot, EmbedBlot } = Parchment;

export default class EditContainer extends Container {
}

EditContainer.blotName = "edit-container";
EditContainer.tagName = "DIV";
EditContainer.allowedChildren = [BlockBlot, ContainerBlot, EmbedBlot];