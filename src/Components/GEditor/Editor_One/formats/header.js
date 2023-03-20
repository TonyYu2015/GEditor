import Quill from "quill"
import withWrapper from "../modules/FreeContainer/_withWrapper";

const Header = Quill.import("formats/header");

export default withWrapper(Header);