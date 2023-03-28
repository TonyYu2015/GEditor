import Quill from "quill";
const Font = Quill.import('attributors/style/font');

export const FONT_TYPE = ['Arial', 'Timesnewroman'];

Font.whitelist = FONT_TYPE;


export { Font };