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
            onChoose: this.handleCameraChoose,
        };
        let DialogBox;
        switch (selection) {
            case 'video-dialog-sync-acquiring':
                DialogBox = VideoDialogBoxSync;
                dialogBoxProps.status = 'acquiring';
                break;
            case 'video-dialog-sync-denied':
                DialogBox = VideoDialogBoxSync;
                dialogBoxProps.status = 'denied';
                dialogBoxProps.liveVideo = null;
                break;
            case 'video-dialog-sync-initiating':
                DialogBox = VideoDialogBoxSync;
                dialogBoxProps.status = 'initiating';
                dialogBoxProps.devices = devices;
                dialogBoxProps.selectedDeviceID = device.id;
                break;
            case 'video-dialog-sync-previewing':
                DialogBox = VideoDialogBoxSync;
                dialogBoxProps.status = 'previewing';
                dialogBoxProps.devices = devices;
                dialogBoxProps.selectedDeviceID = device.id;
                dialogBoxProps.liveVideo = fakeLive(sample.video);
                break;
            case 'video-dialog-sync-recording':
                DialogBox = VideoDialogBoxSync;
                dialogBoxProps.status = 'recording';
                dialogBoxProps.devices = devices;
                dialogBoxProps.selectedDeviceID = device.id;
                dialogBoxProps.liveVideo = fakeLive(sample.video);
                dialogBoxProps.duration = 14700;
                break;
            case 'video-dialog-sync-paused':
                DialogBox = VideoDialogBoxSync;
                dialogBoxProps.status = 'paused';
                dialogBoxProps.devices = devices;
                dialogBoxProps.selectedDeviceID = device.id;
                dialogBoxProps.liveVideo = fakeLive(sample.video);
                dialogBoxProps.duration = 14700;
                break;
            case 'video-dialog-sync-recorded':
                DialogBox = VideoDialogBoxSync;
                dialogBoxProps.status = 'recorded';
                dialogBoxProps.devices = devices;
                dialogBoxProps.selectedDeviceID = device.id;
                dialogBoxProps.liveVideo = fakeLive(sample.video);;
                dialogBoxProps.duration = 38500;
                dialogBoxProps.capturedVideo = sample.video;
                dialogBoxProps.capturedImage = sample.image;
                break;
            case 'video-dialog':
                DialogBox = VideoDialogBox;
                dialogBoxProps.onChoose = undefined;
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
