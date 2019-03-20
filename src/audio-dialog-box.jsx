import React, { useState, useEffect } from 'react';
import Relaks, { useProgress } from 'relaks/hooks';
import RelaksMediaCapture from 'relaks-media-capture';
import LiveVideo from 'live-video';

async function AudioDialogBox(props) {
    const { onClose, onCapture } = props;
    const [ capture ] = useState(() => {
        return new RelaksMediaCapture({
            video: false,
            audio: true,
            preferredDevice: 'front',
            watchVolume: true,
        });
    });
    const [ show ] = useProgress(50, 50);
    const target = { func: AudioDialogBox, props };

    useEffect(() => {
        capture.activate();

        return () => {
            capture.deactivate();
        };
    }, []);

    const handleStart = (evt) => {
        capture.start();
    };
    const handleStop = (evt) => {
        capture.stop();
    };
    const handlePause = (evt) => {
        capture.pause();
    };
    const handleResume = (evt) => {
        capture.resume();
    };
    const handleClear = (evt) => {
        capture.clear();
    };
    const handleChoose = (evt) => {
        capture.choose(evt.id);
    };
    const handleCancel = (evt) => {
        if (onClose) {
            onClose({
                type: 'cancel',
                target,
            });
        }
    };
    const handleAccept = (evt) => {
        const { capturedAudio } = capture;
        if (onCapture) {
            onCapture({
                type: 'capture',
                target,
                audio: {
                    blob: capturedAudio.blob,
                    duration: capturedAudio.duration,
                },
            });
        }
        capture.deactivate();
        handleCancel();
    };

    const handlers = {
        onStart: handleStart,
        onStop: handleStop,
        onPause: handlePause,
        onResume: handleResume,
        onClear: handleClear,
        onChoose: handleChoose,
        onAccept: handleAccept,
        onCancel: handleCancel,
    };
    do {
        const sprops = {
            status: capture.status,
            devices: capture.devices,
            chosenDeviceID: capture.chosenDeviceID,
            duration: capture.duration,
            volume: capture.volume,
            capturedAudio:  capture.capturedAudio,
        };
        show(<AudioDialogBoxSync {...sprops} {...handlers} />);
        await capture.change();
    } while (capture.active);
}

function AudioDialogBoxSync(props) {
    const { status, capturedAudio } = props;
    const { devices, chosenDeviceID, duration, volume } = props;
    const { onCancel, onChoose, onStart, onPause, onResume, onStop, onClear, onAccept } = props;
    const size = { width: 640, height: 240 };
    const target = { func: AudioDialogBoxSync, props };

    const handleDeviceChange = (evt) => {
        const id = evt.target.value;
        if (onChoose) {
            onChoose({
                type: 'choose',
                target,
                id,
            });
        }
    };

    return (
        <div className="overlay">
            <div className="dialog-box video">
                {renderTitle()}
                {renderViewport()}
                {renderControls()}
            </div>
        </div>
    );

    function renderTitle() {
        return (
            <div className="title">
                Audio Recorder
                <i className="fa fa-window-close" onClick={onCancel} />
            </div>
        );
    }

    function renderViewport() {
        const classNames = [ 'video-viewport', status ];
        return (
            <div className={classNames.join(' ')} style={size}>
                {renderVideo()}
            </div>
        );
    }

    function renderVideo() {
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

    function renderControls() {
        return (
            <div className="controls">
                {renderDuration() || renderDeviceMenu()}
                {renderVolume()}
                {renderButtons()}
            </div>
        )
    }

    function renderDeviceMenu() {
        if (!devices || devices.length <= 1) {
            return <div className="devices" />;
        }
        return (
            <div className="devices">
                <select onChange={handleDeviceChange} value={chosenDeviceID}>
                    {devices.map(renderDeviceMenuOption)}
                </select>
            </div>
        );
    }

    function renderDeviceMenuOption(device, i) {
        const label = device.label.replace(/\([0-9a-f]{4}:[0-9a-f]{4}\)/, '');
        return <option value={device.id} key={i}>{label}</option>;
    }

    function renderDuration() {
        if (duration === undefined) {
            return null;
        }
        const seconds = duration / 1000;
        const hh = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const mm = Math.floor(seconds / 60 % 60).toString().padStart(2, '0');
        const ss = Math.floor(seconds % 60).toString().padStart(2, '0');
        return <div className="duration">{`${hh}:${mm}:${ss}`}</div>
    }

    function renderVolume() {
        if (volume === undefined || status === 'captured') {
            return <div className="volume" />;
        }
        const iconClassNames = [ 'fa' ];
        if (volume > 40) {
            iconClassNames.push('fa-volume-up');
        } else if (volume > 10) {
            iconClassNames.push('fa-volume-down');
        } else {
            iconClassNames.push('fa-volume-off');
        }
        const barClassNames = [ 'volume-bar', status ];
        const barStyle = { width: volume + '%' };
        return (
            <div className="volume">
                <i className={iconClassNames.join(' ')} />
                <div className="volume-bar-frame">
                    <div className={barClassNames.join(' ')} style={barStyle} />
                </div>
            </div>
        );
    }

    function renderButtons() {
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
}

const asyncComponent = Relaks(AudioDialogBox);
const syncComponent = AudioDialogBoxSync;

export {
    asyncComponent as default,
    asyncComponent as AudioDialogBox,
    syncComponent as AudioDialogBoxSync,
};
