import React, { useMemo, useEffect, useCallback } from 'react';
import Relaks, { useProgress } from 'relaks';
import RelaksMediaCapture from 'relaks-media-capture';

async function AudioDialogBox(props) {
    const { onClose, onCapture } = props;
    const [ show ] = useProgress();
    const capture = useMemo(() => {
        return new RelaksMediaCapture({
            video: false,
            audio: true,
            preferredDevice: 'front',
            watchVolume: true,
        });
    }, []);

    const handleStart = useCallback((evt) => {
        capture.start();
    });
    const handlePause = useCallback((evt) => {
        capture.pause();
    });
    const handleResume = useCallback((evt) => {
        capture.resume();
    });
    const handleStop = useCallback((evt) => {
        capture.stop();
    });
    const handleClear = useCallback((evt) => {
        capture.clear();
    });
    const handleAccept = useCallback((evt) => {
        const { capturedAudio } = capture;
        if (onCapture) {
            onCapture({
                audio: {
                    blob: capturedAudio.blob,
                    duration: capturedAudio.duration,
                },
            });
        }
        capture.deactivate();
        handleCancel();
    });
    const handleCancel = useCallback((evt) => {
        if (onClose) {
            onClose({});
        }
    });
    const handleDeviceChange = useCallback((evt) => {
        capture.choose(evt.target.value);
    });

    useEffect(() => {
        capture.activate();
        return () => {
            capture.deactivate();
        };
    }, []);

    do {
        render();
        await capture.change();
    } while (capture.active);

    function render() {
        show(
            <div className="overlay">
                <div className="dialog-box video">
                    {renderTitle()}
                    {renderViewport()}
                    {renderControls()}
                </div>
            </div>
        );
    }

    function renderTitle() {
        return (
            <div className="title">
                Audio Recorder
                <i className="fa fa-window-close" onClick={handleCancel} />
            </div>
        );
    }

    function renderViewport() {
        const { status } = capture;
        const classNames = [ 'video-viewport', status ];
        const size = { width: 640, height: 240 };
        return (
            <div className={classNames.join(' ')} style={size}>
                {renderAudio()}
            </div>
        );
    }

    function renderAudio() {
        const { status, capturedAudio } = capture;
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
        const { devices, chosenDeviceID } = capture;
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
        const { duration } = capture;
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
        const { status, volume } = capture;
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
        const { status } = capture;
        switch (status) {
            case 'acquiring':
            case 'denied':
            case 'initiating':
            case 'previewing':
                return (
                    <div className="buttons">
                        <button onClick={handleCancel}>Cancel</button>
                        <button onClick={handleStart} disabled={status !== 'previewing'}>Start</button>
                    </div>
                );
            case 'capturing':
                return (
                    <div className="buttons">
                        <button onClick={handlePause}>Pause</button>
                        <button onClick={handleStop}>Stop</button>
                    </div>
                );
            case 'paused':
                return (
                    <div className="buttons">
                        <button onClick={handleResume}>Resume</button>
                        <button onClick={handleStop}>Stop</button>
                    </div>
                );
            case 'captured':
                return (
                    <div className="buttons">
                        <button onClick={handleClear}>Retake</button>
                        <button onClick={handleAccept} disabled={status !== 'captured'}>Accept</button>
                    </div>
                );
        }
    }
}

const component = Relaks.memo(AudioDialogBox);

export {
    component as AudioDialogBox,
};
