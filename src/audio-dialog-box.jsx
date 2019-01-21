import React, { PureComponent } from 'react';
import { AsyncComponent } from 'relaks';
import RelaksMediaCapture from 'relaks-media-capture';

class AudioDialogBox extends AsyncComponent {
    static displayName = 'AudioDialogBoxAsync';

    constructor(props) {
        super(props);
        let options = {
            video: false,
            audio: true,
            preferredDevice: 'front',
            watchVolume: true,
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
        this.capture.activate();
        do {
            props.status = this.capture.status;
            props.devices = this.capture.devices;
            props.chosenDeviceID = this.capture.chosenDeviceID;
            props.duration = this.capture.duration;
            props.volume = this.capture.volume;
            props.capturedAudio = this.capture.capturedAudio;
            meanwhile.show(<AudioDialogBoxSync {...props} />);
            await this.capture.change();
        } while (this.capture.active);
        return <AudioDialogBoxSync {...props} />;
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        this.capture.deactivate();
    }

    handleStart = (evt) => {
        this.capture.start();
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
        let { capturedAudio } = this.capture;
        if (onCapture) {
            let evt = {
                type: 'capture',
                target: this,
                audio: {
                    blob: capturedAudio.blob,
                    duration: capturedAudio.duration,
                },
            };
            onCapture(evt);
        }
        this.capture.deactivate();
        this.handleCancel();
    }
}

class AudioDialogBoxSync extends PureComponent {
    static displayName = 'AudioDialogBoxSync';

    constructor(props) {
        super(props);
        this.state = {
            viewportWidth: 640,
            viewportHeight: 240,
        };
    }

    render() {
        return (
            <div className="overlay">
                <div className="dialog-box video">
                    {this.renderTitle()}
                    {this.renderViewport()}
                    {this.renderControls()}
                </div>
            </div>
        );
    }

    renderTitle() {
        let { onCancel } = this.props;
        return (
            <div className="title">
                Audio Recorder
                <i className="fa fa-window-close" onClick={onCancel} />
            </div>
        );
    }

    renderViewport() {
        let { status } = this.props;
        let { viewportWidth, viewportHeight } = this.state;
        let style = {
            width: viewportWidth,
            height: viewportHeight,
        };
        let className = `video-viewport ${status}`;
        return (
            <div className={className} style={style}>
                {this.renderVideo()}
            </div>
        );
    }

    renderVideo() {
        let { status, capturedAudio } = this.props;
        switch (status) {
            case 'acquiring':
            case 'initiating':
            case 'previewing':
            case 'capturing':
            case 'paused':
                return (
                    <span className="fa-stack fa-lg">
                        <i className="fa fa-microphone fa-stack-1x" />
                    </span>
                );
            case 'denied':
                return (
                    <span className="fa-stack fa-lg">
                        <i className="fa fa-microphone fa-stack-1x" />
                        <i className="fa fa-ban fa-stack-2x" />
                    </span>
                );
            case 'captured':
                return <audio src={capturedAudio.url} controls />;
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

    renderDeviceMenu() {
        let { devices, chosenDeviceID, duration } = this.props;
        if (!devices || devices.length <= 1) {
            return <div className="devices" />;
        }
        return (
            <div className="devices">
                <select onChange={this.handleDeviceChange} value={chosenDeviceID}>
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
        let barClassName = `volume-bar ${status}`;
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
}

export {
    AudioDialogBox as default,
    AudioDialogBox,
    AudioDialogBoxSync,
};
