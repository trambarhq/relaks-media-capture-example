import React, { PureComponent } from 'react';
import { AsyncComponent } from 'relaks';
import RelaksMediaCapture from 'relaks-media-capture';
import LiveVideo from 'live-video';

class VideoDialogBox extends AsyncComponent {
    static displayName = 'VideoDialogBoxAsync';

    constructor(props) {
        super(props);
        let options = {
            video: true,
            audio: true,
            preferredDevice: 'usb',
        };
        this.capture = new RelaksMediaCapture(options);
    }

    async renderAsync(meanwhile) {
        meanwhile.delay(50, 50);
        let props = {
            onStart: this.handleStart,
            onStop: this.handleStop,
            onPause: this.handlePause,
            onResume: this.handleResume,
            onClear: this.handleClear,
            onChoose: this.handleChoose,
            onAccept: this.handleAccept,
            onCancel: this.handleCancel,
        };
        meanwhile.show(<VideoDialogBoxSync {...props} />);
        this.capture.activate();
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
        super.componentWillUnmount();
        this.capture.deactivate();
    }

    handleStart = (evt) => {
        this.capture.start();
        this.capture.snap();
    }

    handleStop = (evt) => {
        this.capture.stop();
    }

    handlePause = (evt) => {
        this.capture.pause();
    }

    handleResume = (evt) => {
        this.capture.resume();
    }

    handleClear = (evt) => {
        this.capture.clear();
    }

    handleChoose = (evt) => {
        this.capture.choose(evt.id);
    }

    handleCancel = (evt) => {
        let { onClose } = this.props;
        if (onClose) {
            onClose({
                type: 'cancel',
                target: this,
            })
        }
    }

    handleAccept = (evt) => {
        let { onCapture } = this.props;
        if (onCapture) {
            let media = this.capture.extract();
            let evt = {
                type: 'capture',
                target: this,
            };
            if (media.video) {
                evt.video = media.video;
            } else if (media.audio) {
                evt.audio = media.audio;
            }
            if (media.image) {
                evt.image = media.image;
            }
            onCapture(evt);
        }
        this.capture.deactivate();
        this.handleCancel();
    }
}

class VideoDialogBoxSync extends PureComponent {
    static displayName = 'VideoDialogBoxSync';

    constructor(props) {
        super(props);
        this.state = {
            viewportWidth: 320,
            viewportHeight: 240,
        };
    }

    static getDerivedStateFromProps(props, state) {
        let { liveVideo } = props;
        if (liveVideo) {
            let html = document.body.parentNode;
            let viewportWidth = liveVideo.width;
            let viewportHeight = liveVideo.height;
            let availableWidth = html.clientWidth - 50;
            let availableHeight = html.clientHeight - 100;
            if (viewportWidth > availableWidth) {
                viewportHeight = Math.round(viewportHeight * availableWidth / viewportWidth);
                viewportWidth = availableWidth;
            }
            if (viewportHeight > availableHeight) {
                viewportWidth = Math.round(viewportWidth * availableHeight / viewportHeight);
                viewportHeight = availableHeight;
            }
            return { viewportWidth, viewportHeight };
        }
        return null;
    }

    render() {
        return (
            <div className="overlay">
                <div className="dialog-box video">
                    {this.renderTitle()}
                    {this.renderCameraOutput()}
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

    renderCameraOutput() {
        let { status } = this.props;
        let { viewportWidth, viewportHeight } = this.state;
        let style = {
            width: viewportWidth,
            height: viewportHeight,
        };
        let className = `video-viewport ${status}`;
        return (
            <div className={className} style={style}>
                {this.renderPicture()}
            </div>
        );
    }

    renderPicture() {
        let { status, liveVideo, capturedVideo, capturedImage } = this.props;
        let { viewportWidth, viewportHeight } = this.state;
        let videoStyle = {
            width: viewportWidth,
            height: viewportHeight,
        };
        switch (status) {
            case 'acquiring':
                return (
                    <span className="fa-stack fa-lg">
                        <i className="fa fa-camera fa-stack-1x" />
                    </span>
                );
            case 'denied':
                return (
                    <span className="fa-stack fa-lg">
                        <i className="fa fa-camera fa-stack-1x" />
                        <i className="fa fa-ban fa-stack-2x" />
                    </span>
                );
            case 'initiating':
                return <LiveVideo muted />;
            case 'previewing':
            case 'capturing':
            case 'paused':
                return <LiveVideo srcObject={liveVideo.stream} style={videoStyle} muted />;
            case 'captured':
                return <video src={capturedVideo.url} poster={capturedImage.url} style={videoStyle} controls />;
        }
    }

    renderControls() {
        return (
            <div className="controls">
                {this.renderDuration() || this.renderDeviceMenu()}
                {this.renderVolume()}
                {this.renderButtons()}
            </div>
        )
    }

    renderDeviceMenuOrDuration() {
        let duration = this.renderDuration();
        if (duration) {
            return duration;
        }
        let deviceMenu = this.render
    }

    renderDeviceMenu() {
        let { devices, selectedDeviceID, duration } = this.props;
        if (!devices || devices.length <= 1) {
            return <div className="devices" />;
        }
        return (
            <div className="devices">
                <select onChange={this.handleDeviceChange} value={selectedDeviceID}>
                {
                    devices.map((device, i) => {
                        let label = device.label.replace(/\([0-9a-f]{4}:[0-9a-f]{4}\)/, '');
                        return <option value={device.id} key={i}>{label}</option>;
                    })
                }
                </select>
            </div>
        );
    }

    renderDuration() {
        let { duration } = this.props;
        if (duration === undefined) {
            return null;
        }
        let seconds = duration / 1000;
        let hh = Math.floor(seconds / 3600).toString().padStart(2, '0');
        let mm = Math.floor(seconds / 60 % 60).toString().padStart(2, '0');
        let ss = Math.floor(seconds % 60).toString().padStart(2, '0');
        return <div className="duration">{`${hh}:${mm}:${ss}`}</div>
    }

    renderVolume() {
        let { status, volume } = this.props;
        if (volume === undefined || status === 'captured') {
            return <div className="volume" />;
        }
        let iconClassName = 'fa';
        if (volume > 40) {
            iconClassName += ' fa-volume-up';
        } else if (volume > 10) {
            iconClassName += ' fa-volume-down';
        } else {
            iconClassName += ' fa-volume-off';
        }
        let barClassName = 'volume-bar';
        if (status === 'capturing') {
            barClassName += ' capturing';
        }
        return (
            <div className="volume">
                <i className={iconClassName} />
                <div className="volume-bar-frame">
                    <div className={barClassName} style={{ width: volume + '%' }} />
                </div>
            </div>
        );
    }

    renderButtons() {
        let { status } = this.props;
        let { onCancel, onStart, onPause, onResume, onStop, onClear, onAccept } = this.props;
        switch (status) {
            case 'acquiring':
            case 'denied':
            case 'initiating':
            case 'previewing':
                return (
                    <div className="buttons">
                        <button onClick={onCancel}>Cancel</button>
                        <button onClick={onStart} disabled={status !== 'previewing'}>Start</button>
                    </div>
                );
            case 'capturing':
                return (
                    <div className="buttons">
                        <button onClick={onPause}>Pause</button>
                        <button onClick={onStop}>Stop</button>
                    </div>
                );
            case 'paused':
                return (
                    <div className="buttons">
                        <button onClick={onResume}>Resume</button>
                        <button onClick={onStop}>Stop</button>
                    </div>
                );
            case 'captured':
                return (
                    <div className="buttons">
                        <button onClick={onClear}>Retake</button>
                        <button onClick={onAccept} disabled={status !== 'captured'}>Accept</button>
                    </div>
                );
        }
    }

    handleDeviceChange = (evt) => {
        let { onChoose } = this.props;
        let id = evt.target.value;
        if (onChoose) {
            onChoose({
                type: 'choose',
                target: this,
                id,
            });
        }
    }
}

if (process.env.NODE_ENV !== 'production') {
    const PropTypes = require('prop-types');
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
            stream: PropTypes.instanceOf(Object).isRequired,
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
        selectedDeviceID: PropTypes.string,

        onChoose: PropTypes.func,
        onCancel: PropTypes.func,
        onStart: PropTypes.func,
        onStop: PropTypes.func,
        onPause: PropTypes.func,
        onResume: PropTypes.func,
        onClear: PropTypes.func,
        onAccept: PropTypes.func,
    };
}

export {
    VideoDialogBox as default,
    VideoDialogBox,
    VideoDialogBoxSync,
};
