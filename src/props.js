import * as PropTypes from 'prop-types';

import { VideoDialogBox } from 'video-dialog-box';
import { PhotoDialogBox } from 'photo-dialog-box';
import { AudioDialogBox } from 'audio-dialog-box';

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
