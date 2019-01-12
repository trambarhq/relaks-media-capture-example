import React, { PureComponent } from 'react';
import { VideoDialogBox, VideoDialogBoxSync } from 'video-dialog-box';

import 'style.scss';

class FrontEnd extends PureComponent {
    static displayName = 'FrontEnd';

    constructor(props) {
        super(props);
        this.state = {
            selection: null,
            camera: 0,
        };
    }

    /**
     * Render the application
     *
     * @return {VNode}
     */
    render() {
        return (
            <div>
                {this.renderButtons()}
                {this.renderDialogBox()}
            </div>
        );
    }

    renderDialogBox() {
        let { selection, camera } = this.state;
        if (!selection) {
            return null;
        }
        let sample = samples[camera];
        let device = devices[camera];
        let dialogBoxProps = {
            onClose: this.handleDialogClose,
            onCancel: this.handleDialogClose,
            onCapture: this.handleMediaCapture,
            onChoose: this.handleCameraChoose,
        };
        let DialogBox;
        switch (selection) {
            case 'video-dialog-sync-acquiring':
                DialogBox = VideoDialogBoxSync;
                Object.assign(dialogBoxProps, {
                    status: 'acquiring'
                });
                break;
            case 'video-dialog-sync-denied':
                DialogBox = VideoDialogBoxSync;
                Object.assign(dialogBoxProps, {
                    status: 'denied',
                    liveVideo: null,
                });
                break;
            case 'video-dialog-sync-initiating':
                DialogBox = VideoDialogBoxSync;
                Object.assign(dialogBoxProps, {
                    status: 'initiating',
                    devices: devices,
                    selectedDeviceID: device.id,
                });
                break;
            case 'video-dialog-sync-previewing':
                DialogBox = VideoDialogBoxSync;
                Object.assign(dialogBoxProps, {
                    status: 'previewing',
                    devices: devices,
                    selectedDeviceID: device.id,
                    liveVideo: fakeLive(sample.video),
                    volume: 50,
                });
                break;
            case 'video-dialog-sync-recording':
                DialogBox = VideoDialogBoxSync;
                Object.assign(dialogBoxProps, {
                    status: 'capturing',
                    devices: devices,
                    selectedDeviceID: device.id,
                    liveVideo: fakeLive(sample.video),
                    duration: 14700,
                    volume: 95,
                });
                break;
            case 'video-dialog-sync-paused':
                DialogBox = VideoDialogBoxSync;
                Object.assign(dialogBoxProps, {
                    status: 'paused',
                    devices: devices,
                    selectedDeviceID: device.id,
                    liveVideo: fakeLive(sample.video),
                    duration: 14700,
                    volume: 25,
                });
                break;
            case 'video-dialog-sync-recorded':
                DialogBox = VideoDialogBoxSync;
                Object.assign(dialogBoxProps, {
                    status: 'captured',
                    devices: devices,
                    selectedDeviceID: device.id,
                    liveVideo: fakeLive(sample.video),
                    duration: 38500,
                    capturedVideo: sample.video,
                    capturedImage: sample.image,
                    volume: 10,
                });
                break;
            case 'video-dialog':
                DialogBox = VideoDialogBox;
                Object.assign(dialogBoxProps, {
                    onChoose: undefined,
                    onCancel: undefined,
                });
                break;
        }
        return <DialogBox {...dialogBoxProps} />;
    }

    renderButtons() {
        return (
            <div>
                <ul className="list">
                    <li><button id="video-dialog-sync-acquiring" onClick={this.handleButtonClick}>VideoDialogBoxSync (acquiring)</button></li>
                    <li><button id="video-dialog-sync-denied" onClick={this.handleButtonClick}>VideoDialogBoxSync (denied)</button></li>
                    <li><button id="video-dialog-sync-initiating" onClick={this.handleButtonClick}>VideoDialogBoxSync (initiating)</button></li>
                    <li><button id="video-dialog-sync-previewing" onClick={this.handleButtonClick}>VideoDialogBoxSync (previewing)</button></li>
                    <li><button id="video-dialog-sync-recording" onClick={this.handleButtonClick}>VideoDialogBoxSync (recording)</button></li>
                    <li><button id="video-dialog-sync-paused" onClick={this.handleButtonClick}>VideoDialogBoxSync (paused)</button></li>
                    <li><button id="video-dialog-sync-recorded" onClick={this.handleButtonClick}>VideoDialogBoxSync (recorded)</button></li>
                    <li><button id="video-dialog" onClick={this.handleButtonClick}>VideoDialogBox</button></li>
                </ul>
            </div>
        );
    }

    handleButtonClick = (evt) => {
        this.setState({ selection: evt.target.id });
    }

    handleDialogClose = (evt) => {
        this.setState({ selection: null });
    }

    handleMediaCapture = (evt) => {
        if (evt.image) {
            console.log('image:', evt.image);
        }
        if (evt.video) {
            console.log('video:', evt.video);
        }
    }

    handleCameraChoose = (evt) => {
        let index = devices.findIndex((device) => {
            return (device.id === evt.id);
        });
        this.setState({ camera: index });
    }
}

let devices = [
    {
        id: 'camera0',
        label: 'Camera 1',
    },
    {
        id: 'camera1',
        label: 'Camera 2',
    }
];

let samples = [
    {
        video: {
            url: require('../assets/sample1.mp4'),
            blob: null,
            width: 640,
            height: 480,
        },
        image: {
            url: require('../assets/sample1.jpg'),
            blob: null,
            width: 640,
            height: 480,
        }
    },
    {
        video: {
            url: require('../assets/sample2.mp4'),
            blob: null,
            width: 480,
            height: 360,
        },
        image: {
            url: require('../assets/sample2.jpg'),
            blob: null,
            width: 480,
            height: 360,
        }
    },
];
loadSamples(samples);

async function loadSamples(samples) {
    for (let sample of samples) {
        let videoRes = await fetch(sample.video.url);
        let imageRes = await fetch(sample.image.url);
        sample.video.blob = await videoRes.blob();
        sample.image.blob = await imageRes.blob();
    }
}

function fakeLive(video) {
    return {
        stream: video.blob,
        width: video.width,
        height: video.height,
    };
}

export {
    FrontEnd as default,
    FrontEnd
};
