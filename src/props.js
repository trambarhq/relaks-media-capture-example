import * as PropTypes from 'prop-types';

import { VideoDialogBox, VideoDialogBoxSync } from 'video-dialog-box';
import { PhotoDialogBox, PhotoDialogBoxSync } from 'photo-dialog-box';
import { AudioDialogBox, AudioDialogBoxSync } from 'audio-dialog-box';

VideoDialogBox.propTypes = {
    onClose: PropTypes.func,
    onCapture: PropTypes.func,
};
VideoDialogBoxSync.propTypes = {
    status: PropTypes.oneOf([
        'acquiring',
        'denied',
        'initiating',
        'previewing',
        'capturing',
        'paused',
        'captured',
    ]),
    liveVideo: PropTypes.shape({
        stream: PropTypes.instanceOf(MediaStream).isRequired,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
    }),
    capturedVideo: PropTypes.shape({
        url: PropTypes.string.isRequired,
        blob: PropTypes.instanceOf(Blob).isRequired,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
    }),
    capturedImage: PropTypes.shape({
        url: PropTypes.string.isRequired,
        blob: PropTypes.instanceOf(Blob).isRequired,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
    }),
    volume: PropTypes.number,
    duration: PropTypes.number,
    devices: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string,
    })),
    chosenDeviceID: PropTypes.string,

    onChoose: PropTypes.func,
    onCancel: PropTypes.func,
    onStart: PropTypes.func,
    onStop: PropTypes.func,
    onPause: PropTypes.func,
    onResume: PropTypes.func,
    onClear: PropTypes.func,
    onAccept: PropTypes.func,
};
PhotoDialogBox.propTypes = {
    onClose: PropTypes.func,
    onCapture: PropTypes.func,
};
PhotoDialogBoxSync.propTypes = {
    status: PropTypes.oneOf([
        'acquiring',
        'denied',
        'initiating',
        'previewing',
        'captured',
    ]),
    liveVideo: PropTypes.shape({
        stream: PropTypes.instanceOf(MediaStream).isRequired,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
    }),
    capturedImage: PropTypes.shape({
        url: PropTypes.string.isRequired,
        blob: PropTypes.instanceOf(Blob).isRequired,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
    }),
    devices: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string,
    })),
    chosenDeviceID: PropTypes.string,

    onChoose: PropTypes.func,
    onCancel: PropTypes.func,
    onSnap: PropTypes.func,
    onClear: PropTypes.func,
    onAccept: PropTypes.func,
};
AudioDialogBox.propTypes = {
    onClose: PropTypes.func,
    onCapture: PropTypes.func,
};
AudioDialogBoxSync.propTypes = {
    status: PropTypes.oneOf([
        'acquiring',
        'denied',
        'initiating',
        'previewing',
        'capturing',
        'paused',
        'captured',
    ]),
    capturedAudio: PropTypes.shape({
        url: PropTypes.string.isRequired,
        blob: PropTypes.instanceOf(Blob).isRequired,
    }),
    volume: PropTypes.number,
    duration: PropTypes.number,
    devices: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string,
    })),
    chosenDeviceID: PropTypes.string,

    onChoose: PropTypes.func,
    onCancel: PropTypes.func,
    onStart: PropTypes.func,
    onStop: PropTypes.func,
    onPause: PropTypes.func,
    onResume: PropTypes.func,
    onClear: PropTypes.func,
    onAccept: PropTypes.func,
};
