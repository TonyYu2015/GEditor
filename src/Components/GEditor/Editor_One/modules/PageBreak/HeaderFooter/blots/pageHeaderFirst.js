import PageHeader from './pageHeader';

export default class PageHeaderFirst extends PageHeader {

	setToolbar() {
		super.setToolbar(true);
	}
}

PageHeaderFirst.blotName = 'page-header-first';
PageHeaderFirst.tagName = 'DIV';
PageHeaderFirst.className = 'ql-page-header-first';