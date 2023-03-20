import Quill from "quill";
import withWrapper from "../_withWrapper";

export const Block = withWrapper(Quill.import("blots/block"));
export const BlockEmbed = withWrapper(Quill.import("blots/block/embed"));