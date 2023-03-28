import PageFooter from './pageFooter';

export default class PageFooterFirst extends PageFooter {

	setToolbar() {
		super.setToolbar(true);
	}
}

PageFooterFirst.blotName = 'page-footer-first';
PageFooterFirst.tagName = 'DIV';
PageFooterFirst.className = 'ql-page-footer-first';