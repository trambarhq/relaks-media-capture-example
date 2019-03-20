import React, { useState } from 'react';
import { VideoDialogBox, VideoDialogBoxSync } from 'video-dialog-box';
import { PhotoDialogBox, PhotoDialogBoxSync } from 'photo-dialog-box';
import { AudioDialogBox, AudioDialogBoxSync } from 'audio-dialog-box';

import 'style.scss';

function FrontEnd(props) {
    const [ selection, setSelection ] = useState(null);
    const [ camera, setCamera ] = useState(0);

    const handleButtonClick = (evt) => {
        setSelection(evt.target.id);
    };
    const handleDialogClose = (evt) => {
        setSelection(null);
    };
    const handleMediaCapture = (evt) => {
        if (evt.image) {
            console.log('image:', evt.image);
        }
        if (evt.video) {
            console.log('video:', evt.video);
        }
        if (evt.audio) {
            console.log('audio:', evt.audio);
        }
    };
    const handleCameraChoose = (evt) => {
        let index = devices.findIndex(device => device.id === evt.id);
        setCamera(index);
    };

    return (
        <div>
            {renderButtons()}
            {renderDialogBox()}
        </div>
    );

    function renderDialogBox() {
        if (!selection) {
            return null;
        }
        const sample = samples[camera];
        const device = devices[camera];
        const dialogBoxProps = {
            onClose: handleDialogClose,
            onCancel: handleDialogClose,
            onCapture: handleMediaCapture,
            onChoose: handleCameraChoose,
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
                    chosenDeviceID: device.id,
                });
                break;
            case 'video-dialog-sync-previewing':
                DialogBox = VideoDialogBoxSync;
                Object.assign(dialogBoxProps, {
                    status: 'previewing',
                    devices: devices,
                    chosenDeviceID: device.id,
                    liveVideo: fakeLive(sample.video),
                    volume: 50,
                });
                break;
            case 'video-dialog-sync-recording':
                DialogBox = VideoDialogBoxSync;
                Object.assign(dialogBoxProps, {
                    status: 'capturing',
                    devices: devices,
                    chosenDeviceID: device.id,
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
                    chosenDeviceID: device.id,
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
                    chosenDeviceID: device.id,
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
            case 'photo-dialog':
                DialogBox = PhotoDialogBox;
                Object.assign(dialogBoxProps, {
                    onChoose: undefined,
                    onCancel: undefined,
                });
                break;
            case 'audio-dialog':
                DialogBox = AudioDialogBox;
                Object.assign(dialogBoxProps, {
                    onChoose: undefined,
                    onCancel: undefined,
                });
                break;
        }
        return <DialogBox {...dialogBoxProps} />;
    }

    function renderButtons() {
        return (
            <div>
                <ul className="list">
                    <li><button id="video-dialog-sync-acquiring" onClick={handleButtonClick}>VideoDialogBoxSync (acquiring)</button></li>
                    <li><button id="video-dialog-sync-denied" onClick={handleButtonClick}>VideoDialogBoxSync (denied)</button></li>
                    <li><button id="video-dialog-sync-initiating" onClick={handleButtonClick}>VideoDialogBoxSync (initiating)</button></li>
                    <li><button id="video-dialog-sync-previewing" onClick={handleButtonClick}>VideoDialogBoxSync (previewing)</button></li>
                    <li><button id="video-dialog-sync-recording" onClick={handleButtonClick}>VideoDialogBoxSync (recording)</button></li>
                    <li><button id="video-dialog-sync-paused" onClick={handleButtonClick}>VideoDialogBoxSync (paused)</button></li>
                    <li><button id="video-dialog-sync-recorded" onClick={handleButtonClick}>VideoDialogBoxSync (recorded)</button></li>
                </ul>
                <ul className="list">
                    <li><button id="video-dialog" onClick={handleButtonClick}>VideoDialogBox</button></li>
                    <li><button id="photo-dialog" onClick={handleButtonClick}>PhotoDialogBox</button></li>
                    <li><button id="audio-dialog" onClick={handleButtonClick}>AudioDialogBox</button></li>
                </ul>
            </div>
        );
    }
}

const devices = [
    {
        id: 'camera0',
        label: 'Camera 1',
    },
    {
        id: 'camera1',
        label: 'Camera 2',
    }
];
const samples = [
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
        const videoRes = await fetch(sample.video.url);
        const imageRes = await fetch(sample.image.url);
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

if (process.env.NODE_ENV !== 'production') {
    require('./props');
}

export {
    FrontEnd as default,
    FrontEnd
};
