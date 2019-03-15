import PropTypes from 'prop-types';

export default function(components) {
    const { VideoDialogBox, VideoDialogBoxSync } = components;

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
};
