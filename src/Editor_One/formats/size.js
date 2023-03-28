import Quill from "quill";
const SizeStyle = Quill.import('attributors/style/size');

export const SIZE_NUM = ['12', '13', '14', '15', '16', '17', '18', '19', '20', '24', '26', '30', '36', '48', '60', '72', '96'];

SizeStyle.whitelist = SIZE_NUM.map(m => `${m}px`);


export { SizeStyle };