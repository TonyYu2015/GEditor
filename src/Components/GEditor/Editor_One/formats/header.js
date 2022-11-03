import Quill from "quill"
import withWrapper from "../modules/FreeContainer/withWrapper";

const Header = Quill.import("formats/header");

export default withWrapper(Header);