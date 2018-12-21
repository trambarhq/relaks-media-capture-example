import React, { PureComponent } from 'react';
import { VideoDialogBox, VideoDialogBoxSync } from 'video-dialog-box';
import { PhotoDialogBox, PhotoDialogBoxSync } from 'photo-dialog-box';

import 'style.scss';

class FrontEnd extends PureComponent {
    static displayName = 'FrontEnd';

    constructor(props) {
        super(props);
        this.state = {
            selection: null,
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
        let { selection } = this.state;
        if (!selection) {
            return null;
        }
        let dialogBoxProps = {
            onClose: this.handleDialogClose,
        };
        let DialogBox;
        switch (selection) {
            case 'video-dialog-sync-pending':
                DialogBox = VideoDialogBoxSync;
                break;
            case 'video-dialog-sync-denied':
                DialogBox = VideoDialogBoxSync;
                dialogBoxProps.liveVideo = null;
                break;
            case 'video-dialog-sync-previewing':
                DialogBox = VideoDialogBoxSync;
                dialogBoxProps.liveVideo = {
                    stream: sampleVideoBlob,
                };
                break;
            case 'video-dialog-sync-recording':
                DialogBox = VideoDialogBoxSync;
                dialogBoxProps.liveVideo = {
                    stream: sampleVideoBlob,
                };
                dialogBoxProps.duration = 500;
                break;
            case 'video-dialog-sync-finished':
                DialogBox = VideoDialogBoxSync;
                dialogBoxProps.liveVideo = {
                    stream: sampleVideoBlob,
                };
                dialogBoxProps.duration = 500;
                dialogBoxProps.capturedVideo = {
                    url: sampleVideoURL,
                    blob: sampleVideoBlob,
                };
                dialogBoxProps.capturedImage = {
                    url: sampleImageURL,
                };
                dialogBoxProps.duration = 500;
                break;
            case 'video-dialog':
                DialogBox = VideoDialogBox;
                break;
            case 'photo-dialog-sync-pending':
                DialogBox = PhotoDialogBoxSync;
                break;
            case 'photo-dialog-sync-denied':
                DialogBox = PhotoDialogBoxSync;
                break;
            case 'photo-dialog-sync-previewing':
                DialogBox = PhotoDialogBoxSync;
                break;
            case 'photo-dialog-sync-finished':
                DialogBox = PhotoDialogBoxSync;
                break;
            case 'photo-dialog':
                DialogBox = PhotoDialogBox;
                break;
        }
        return <DialogBox {...dialogBoxProps} />;
    }

    renderButtons() {
        return (
            <div>
                <ul className="list">
                    <li><button id="video-dialog-sync-pending" onClick={this.handleButtonClick}>VideoDialogBoxSync (pending)</button></li>
                    <li><button id="video-dialog-sync-denied" onClick={this.handleButtonClick}>VideoDialogBoxSync (permission denied)</button></li>
                    <li><button id="video-dialog-sync-previewing" onClick={this.handleButtonClick}>VideoDialogBoxSync (previewing)</button></li>
                    <li><button id="video-dialog-sync-recording" onClick={this.handleButtonClick}>VideoDialogBoxSync (recording)</button></li>
                    <li><button id="video-dialog-sync-finished" onClick={this.handleButtonClick}>VideoDialogBoxSync (finished)</button></li>
                    <li><button id="video-dialog" onClick={this.handleButtonClick}>VideoDialogBox</button></li>
                </ul>
                <ul className="list">
                    <li><button id="photo-dialog-sync-pending" onClick={this.handleButtonClick}>PhotoDialogBoxSync (pending)</button></li>
                    <li><button id="photo-dialog-sync-denied" onClick={this.handleButtonClick}>PhotoDialogBoxSync (permission denied)</button></li>
                    <li><button id="photo-dialog-sync-previewing" onClick={this.handleButtonClick}>PhotoDialogBoxSync (previewing)</button></li>
                    <li><button id="photo-dialog-sync-finished" onClick={this.handleButtonClick}>PhotoDialogBoxSync (finished)</button></li>
                    <li><button id="photo-dialog" onClick={this.handleButtonClick}>PhotoDialogBox</button></li>
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
}

const sampleImageURL = require('../assets/sample.jpg');
const sampleVideoURL = require('../assets/sample.mp4');
const sampleVideoBlob;

fetch(sampleVideoURL).then((response) => {
    return response.blob((blob) => {
        sampleVideoBlob = blob;
    });
});

export {
    FrontEnd as default,
    FrontEnd
};
