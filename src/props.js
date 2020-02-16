import * as PropTypes from 'prop-types';

import { VideoDialogBox } from './video-dialog-box.jsx';
import { PhotoDialogBox } from './photo-dialog-box.jsx';
import { AudioDialogBox } from './audio-dialog-box.jsx';

VideoDialogBox.propTypes = {
    onClose: PropTypes.func,
    onCapture: PropTypes.func,
};
PhotoDialogBox.propTypes = {
    onClose: PropTypes.func,
    onCapture: PropTypes.func,
};
AudioDialogBox.propTypes = {
    onClose: PropTypes.func,
    onCapture: PropTypes.func,
};
