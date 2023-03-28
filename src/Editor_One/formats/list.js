
import Quill from "quill"
import { withWrapper } from "../modules/FreeContainer";

const ListContainer = withWrapper(Quill.import("formats/list-container"));
const ListItem = Quill.import("formats/list");
const Block = Quill.import("blots/block");

class ListContent extends Block {}

ListContent.blotName = "list-content";
ListContent.tagName = "DIV";
ListContent.className = "ql-list-content";

ListContainer.allowedChildren = [ListItem, ListContent];

ListContent.requiredContainer = ListContainer;

export { ListContainer as default, ListContent};