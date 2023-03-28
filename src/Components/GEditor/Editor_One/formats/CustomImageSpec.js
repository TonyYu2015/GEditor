import BlotFormatter, {DeleteAction, ResizeAction, ImageSpec, AlignAction} from 'quill-blot-formatter';

export default class CustomImageSpec extends ImageSpec {
    getActions() {
        return [DeleteAction,ResizeAction];
    }
}