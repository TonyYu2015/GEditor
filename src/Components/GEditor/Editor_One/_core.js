import Quill from "quill";
import OuterContainer from './blots/outerContainer';

Quill.register({
  'blots/outerContainer': OuterContainer,
});

export default Quill;