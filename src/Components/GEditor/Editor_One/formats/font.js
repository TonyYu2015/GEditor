import Quill from "quill";
// const FontStyle = Quill.import('attributors/style/font');
const Font = Quill.import('attributors/style/font');

export const FONT_TYPE = ['宋体', '楷体', 'Arial', '微软雅黑', '等线', '黑体', 'Timesnewroman'];

Font.whitelist = FONT_TYPE;


export { Font };