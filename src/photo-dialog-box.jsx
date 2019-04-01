import React, { useMemo, useEffect, useCallback } from 'react';
import Relaks, { useProgress } from 'relaks';
import RelaksMediaCapture from 'relaks-media-capture';
import LiveVideo from 'live-video';
import { constrainSize } from 'utils';

async function PhotoDialogBox(props) {
    const { onClose, onCapture } = props;
    const capture = useMemo(() => {
        return new RelaksMediaCapture({
            video: true,
            audio: false,
            preferredDevice: 'front',
            captureImageOnly: true,
        });
    }, []);
    const [ show ] = useProgress(50, 50);
    const target = { func: PhotoDialogBox, props };

    useEffect(() => {
        capture.activate();

        return () => {
            capture.deactivate();
        };
    }, [ capture ]);

    const handleSnap = useCallback((evt) => {
        capture.snap();
    });
    const handleClear = useCallback((evt) => {
        capture.clear();
    });
    const handleDeviceChange = useCallback((evt) => {
        capture.choose(evt.target.value);
    });
    const handleCancel = useCallback((evt) => {
        if (onClose) {
            onClose({
                type: 'cancel',
                target,
            });
        }
    });
    const handleAccept = useCallback((evt) => {
        const { capturedImage } = capture;
        if (onCapture) {
            onCapture({
                type: 'capture',
                target,
                image: {
                    blob: capturedImage.blob,
                    width: capturedImage.width,
                    height: capturedImage.height,
                },
            });
        }
        capture.deactivate();
        handleCancel();
    });

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
                Image Capture
                <i className="fa fa-window-close" onClick={handleCancel} />
            </div>
        );
    }

    function renderViewport() {
        const { status, liveVideo } = capture; 
        const classNames = [ 'video-viewport', status ];
        const size = constrainSize(liveVideo, { width: 320, height: 240 });
        return (
            <div className={classNames.join(' ')} style={size}>
                {renderVideo(size)}
            </div>
        );
    }

    function renderVideo(size) {
        const { status, liveVideo, capturedImage } = capture;
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
                return <LiveVideo srcObject={liveVideo.stream} style={size} muted />;
            case 'captured':
                return <img src={capturedImage.url} style={size} />;
        }
    }

    function renderControls() {
        return (
            <div className="controls">
                {renderDeviceMenu()}
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
                        <button onClick={handleSnap} disabled={status !== 'previewing'}>Take</button>
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

const component = Relaks.memo(PhotoDialogBox);

export {
    component as PhotoDialogBox,
};
