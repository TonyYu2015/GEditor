import Quill from "quill";

const Parchment = Quill.import('parchment');
const Scope = Parchment.Scope;

export const Width = new Parchment.StyleAttributor('width', 'width', {scope: Scope.INLINE});
export const Height = new Parchment.StyleAttributor('height', 'height', {scope: Scope.INLINE});
export const Float = new Parchment.StyleAttributor('float', 'float', {scope: Scope.INLINE});
export const MarginTop = new Parchment.StyleAttributor('marginTop', 'margin-top', {scope: Scope.INLINE});
export const BorderBottom = new Parchment.StyleAttributor('borderBottom', 'border-bottom', {scope: Scope.INLINE});
export const TextAlign = new Parchment.StyleAttributor('textAlign', 'text-align', {scope: Scope.INLINE});

export const BorderTop = new Parchment.StyleAttributor('borderTop', 'border-top', {scope: Scope.BLOCK});