import React, { useState, useCallback } from 'react';
import { VideoDialogBox } from 'video-dialog-box';
import { PhotoDialogBox } from 'photo-dialog-box';
import { AudioDialogBox } from 'audio-dialog-box';
import 'style.scss';

function FrontEnd(props) {
    const [ selection, setSelection ] = useState(null);

    const handleButtonClick = useCallback((evt) => {
        setSelection(evt.target.id);
    });
    const handleDialogClose = useCallback((evt) => {
        setSelection(null);
    });
    const handleMediaCapture = useCallback((evt) => {
        if (evt.image) {
            console.log('image:', evt.image);
        }
        if (evt.video) {
            console.log('video:', evt.video);
        }
        if (evt.audio) {
            console.log('audio:', evt.audio);
        }
    });

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
        const DialogBoxes = {
            video: VideoDialogBox,
            photo: PhotoDialogBox,
            audio: AudioDialogBox,
        };
        const DialogBox = DialogBoxes[selection];
        return <DialogBox onClose={handleDialogClose} onCapture={handleMediaCapture} />;
    }

    function renderButtons() {
        return (
            <div>
                <ul className="list">
                    <li><button id="video" onClick={handleButtonClick}>VideoDialogBox</button></li>
                    <li><button id="photo" onClick={handleButtonClick}>PhotoDialogBox</button></li>
                    <li><button id="audio" onClick={handleButtonClick}>AudioDialogBox</button></li>
                </ul>
            </div>
        );
    }
}

if (process.env.NODE_ENV !== 'production') {
    require('./props');
}

export {
    FrontEnd as default,
    FrontEnd
};
