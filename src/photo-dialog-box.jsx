import React, { PureComponent } from 'react';
import { AsyncComponent } from 'relaks';
import RelaksMediaCapture from 'relaks-media-capture';
import LiveVideo from 'live-video';

class PhotoDialogBox extends AsyncComponent {
    static displayName = 'PhotoDialogBoxAsync';

    constructor(props) {
        super(props);
        let options = {
            video: true,
            audio: false,
            preferredDevice: 'front',
            captureImageOnly: true,
        };
        this.capture = new RelaksMediaCapture(options);
    }

    async renderAsync(meanwhile) {
        meanwhile.delay(50, 50);
        let props = {
            onSnap: this.handleSnap,
            onClear: this.handleClear,
            onChoose: this.handleChoose,
            onAccept: this.handleAccept,
            onCancel: this.handleCancel,
        };
        this.capture.activate();
        do {
            props.status = this.capture.status;
            props.devices = this.capture.devices;
            props.selectedDeviceID = this.capture.selectedDeviceID;
            props.liveVideo = this.capture.liveVideo;
            props.capturedImage = this.capture.capturedImage;
            meanwhile.show(<PhotoDialogBoxSync {...props} />);
            await this.capture.change();
        } while (this.capture.active);
        return <PhotoDialogBoxSync {...props} />;
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        this.capture.deactivate();
    }

    handleSnap = (evt) => {
        this.capture.snap();
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
        let { capturedImage } = this.capture;
        if (onCapture) {
            let evt = {
                type: 'capture',
                target: this,
                image: {
                    blob: capturedImage.blob,
                    width: capturedImage.width,
                    height: capturedImage.height,
                },
            };
            onCapture(evt);
        }
        this.capture.deactivate();
        this.handleCancel();
    }
}

class PhotoDialogBoxSync extends PureComponent {
    static displayName = 'PhotoDialogBoxSync';

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
                Image Capture
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
        let { status, liveVideo, capturedImage } = this.props;
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
                return <img src={capturedImage.url} style={videoStyle} />;
        }
    }

    renderControls() {
        return (
            <div className="controls">
                {this.renderDeviceMenu()}
                {this.renderButtons()}
            </div>
        )
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

    renderButtons() {
        let { status } = this.props;
        let { onCancel, onSnap, onClear, onAccept } = this.props;
        switch (status) {
            case 'acquiring':
            case 'denied':
            case 'initiating':
            case 'previewing':
                return (
                    <div className="buttons">
                        <button onClick={onCancel}>Cancel</button>
                        <button onClick={onSnap} disabled={status !== 'previewing'}>Take</button>
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
        selectedDeviceID: PropTypes.string,

        onChoose: PropTypes.func,
        onCancel: PropTypes.func,
        onSnap: PropTypes.func,
        onClear: PropTypes.func,
        onAccept: PropTypes.func,
    };
}

export {
    PhotoDialogBox as default,
    PhotoDialogBox,
    PhotoDialogBoxSync,
};
