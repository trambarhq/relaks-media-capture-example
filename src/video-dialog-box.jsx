import React, { PureComponent } from 'react';
import { AsyncComponent } from 'relaks';
import RelaksMediaCapture from 'relaks-media-capture';

class VideoDialogBox extends AsyncComponent {
    static displayName = 'VideoDialogBoxAsync';

    constructor(props) {
        super(props);
        let options = {
            video: true,
            audio: true,
        };
        this.capture = new RelaksMediaCapture();
    }

    async renderAsync(meanwhile) {
        let {  onClose } = this.props;
        let props = {
            onStart: this.handleStart,
            onStop: this.handleStop,
            onClear: this.handleClear,
            onChoose: this.handleChoose,
            onAccept: this.handleAccept,
            onCancel: this.handleCancel,
        };
        meanwhile.delay(50, 50);
        meanwhile.show(<VideoDialogBoxSync {...props} />);
        capture.activate();
        do {
            props.status = this.capture.status;
            props.devices = this.capture.devices;
            props.selectedDeviceID = this.capture.selectedDeviceID;
            props.liveVideo = this.capture.liveVideo;
            props.duration = this.capture.duration;
            props.volume = this.capture.volume;
            props.capturedImage = this.capture.capturedImage;
            props.capturedVideo = this.capture.capturedVideo;
            meanwhile.show(<VideoDialogBoxSync {...props} />);
            await this.capture.change();
        } while (this.capture.active);
        return <VideoDialogBoxSync {...props} />;
    }

    componentWillUnmount() {
        this.capture.deactivate();
    }

    handleStart = (evt) => {
        this.capture.start();
    }

    handleStop = (evt) => {
        this.capture.stop();
    }

    handleClear = (evt) => {
        this.capture.clear();
    }

    handleChoose = (evt) => {
        this.capture.choose(evt.deviceID);
    }

    handleCancel = (evt) => {
        let { onClose } = this.props;
        if (onClose) {
            onClose({
                type: 'close',
                target: this,
            })
        }
    }

    handleAccept = (evt) => {
        let { onCapture } = this.props;
        if (onCapture) {
            let media = this.capture.extract();
            onCapture({
                type: 'capture',
                target: this,
                video: media.video,
                image: media.image,
                audio: media.audio,
            });
        }
        this.capture.deactivate();
        this.handleCancel();
    }
}

class VideoDialogBoxSync extends PureComponent {
    render() {
        return (
            <div className="overlay">
                <div className="dialog-box video">
                    {this.renderTitle()}
                    {this.renderVideo()}
                    {this.renderControls()}
                </div>
            </div>
        );
    }

    renderTitle() {
        let { onCancel } = this.props;
        return (
            <div className="title">
                Video Recorder
                <i className="fa fa-window-close" onClick={onCancel} />
            </div>
        );
    }

    renderVideo() {
        let { liveVideo, capturedVideo, capturedImage } = this.props;
        if (capturedVideo) {
            let videoURL = capturedVideo.url;
            let posterURL = capturedImage.url;
            return <video src={videoURL} poster={posterURL} controls />;
        } else if (liveVideo) {
            return <Video srcObject={liveVideo.stream} src={liveVideo.url} muted />;
        } else {
            let banStyle = {};
            if (liveVideo === undefined) {
                banStyle.visibility = 'hidden';
            }
            return (
                <span className="fa-stack fa-lg placeholder">
                    <i className="fa fa-camera fa-stack-1x" />
                    <i className="fa fa-ban fa-stack-2x" style={banStyle} />
                </span>
            );
        }
    }

    renderControls() {
        return (
            <div className="controls">
                {this.renderDeviceMenu()}
                {this.renderDuration()}
                {this.renderButtons()}
            </div>
        )
    }

    renderDeviceMenu() {
        let { liveVideo, duration, devices, selectedDeviceID } = this.props;
        if (duration !== undefined || !liveVideo) {
            return null;
        }
        return (
            <div className="devices">
                <select>
                    <option>Front</option>
                </select>
            </div>
        );
    }

    renderDuration() {
        let { duration } = this.props;
        if (duration === undefined) {
            return null;
        }
        let hh = Math.floor(duration / 3600).toString().padStart(2, '0');
        let mm = Math.floor(duration / 60 % 60).toString().padStart(2, '0');
        let ss = Math.floor(duration % 60).toString().padStart(2, '0');
        return <div className="duration">{`${hh}:${mm}:${ss}`}</div>
    }

    renderButtons() {
        let { liveVideo, capturedVideo, duration } = this.props;
        let { onCancel, onStart, onStop, onRetake, onAccept } = this.props;
        if (capturedVideo) {
            return (
                <div className="buttons">
                    <button onClick={onRetake}>Retake</button>
                    <button onClick={onAccept}>Accept</button>
                </div>
            );
        } else if (liveVideo && duration !== undefined) {
            return (
                <div className="buttons">
                    <button onClick={onStop}>Stop</button>
                </div>
            );
        } else {
            return (
                <div className="buttons">
                    <button onClick={onCancel}>Cancel</button>
                    <button onClick={onStart} disabled={!liveVideo}>Start</button>
                </div>
            );
        }
    }
}

class Video extends PureComponent {
    render() {
        let { srcObject, ...props } = this.props;
        if (srcObject instanceof Blob) {
            // srcObject is supposed to accept a blob but that's not
            // currently supported by the browsers
            props.src = this.blobURL = URL.createObjectURL(srcObject);
        }
        return <video ref={this.setNode} {...props} />
    }

    setNode = (node) => {
        this.node = node;
    }

    setSrcObject() {
        let { srcObject } = this.props;
        if (!(srcObject instanceof Blob)) {
            this.node.srcObject = srcObject;
        }
        this.node.play();
    }

    componentDidMount() {
        this.setSrcObject();
    }

    componentDidUpdate(prevProps, prevState) {
        let { srcObject } = this.props;
        if (prevProps.srcObject !== srcObject) {
            this.setSrcObject();
        }
    }

    componentWillUnmount() {
        if (this.blobURL) {
            URL.revokeObjectURL(this.blobURL);
        }
    }
}

if (process.env.NODE_ENV !== 'production') {
    const PropTypes = require('prop-types');
    VideoDialogBox.propTypes = {
        onCancel: PropTypes.func,
        onAccept: PropTypes.func,
    };

    VideoDialogBoxSync.propTypes = {
        liveVideo: PropTypes.object,
        capturedVideo: PropTypes.object,
        capturedImage: PropTypes.object,
        duration: PropTypes.number,
        devices: PropTypes.arrayOf(PropTypes.object),
        selectedDeviceID: PropTypes.string,

        onChoose: PropTypes.func,
        onCancel: PropTypes.func,
        onStart: PropTypes.func,
        onStop: PropTypes.func,
        onRetake: PropTypes.func,
        onAccept: PropTypes.func,
    };
}

export {
    VideoDialogBox as default,
    VideoDialogBox,
    VideoDialogBoxSync,
};
