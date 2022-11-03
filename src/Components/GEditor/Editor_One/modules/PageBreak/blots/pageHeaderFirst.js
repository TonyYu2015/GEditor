import Quill from "quill";
import PageBreak from "../index";
import PageHeader from './pageHeader';

const Container = Quill.import("blots/outerContainer");

export default class PageHeaderFirst extends PageHeader {
}

PageHeaderFirst.blotName = 'page-header-first';
PageHeaderFirst.tagName = 'DIV';
PageHeaderFirst.className = 'ql-page-header-first';