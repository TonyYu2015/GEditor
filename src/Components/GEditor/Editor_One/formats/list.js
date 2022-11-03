
import Quill from "quill"
import withWrapper from "../modules/FreeContainer/withWrapper";

const Q_List = Quill.import("formats/list");
const Container = Quill.import("blots/wrapperContainer");


class ListContainer extends Container {}
ListContainer.blotName = 'list-container';
ListContainer.tagName = 'OL'

class ListItem extends Q_List {
	static register() {
		Quill.register(ListContainer);
	}
}

ListContainer.allowedChildren = [ListItem];
ListItem.requiredContainer = ListContainer;

export default withWrapper(ListItem);
