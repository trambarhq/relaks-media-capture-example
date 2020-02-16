import React, { useState } from 'react';
import { useListener } from 'relaks';
import { VideoDialogBox } from './video-dialog-box.jsx';
import { PhotoDialogBox } from './photo-dialog-box.jsx';
import { AudioDialogBox } from './audio-dialog-box.jsx';
import './style.scss';

function FrontEnd(props) {
  const [ selection, setSelection ] = useState(null);

  const handleButtonClick = useListener((evt) => {
    setSelection(evt.target.id);
  });
  const handleDialogClose = useListener((evt) => {
    setSelection(null);
  });
  const handleMediaCapture = useListener((evt) => {
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
  require('./props.js');
}

export {
  FrontEnd
};
