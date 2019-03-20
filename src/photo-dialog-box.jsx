import React, { useState, useEffect } from 'react';
import Relaks, { useProgress } from 'relaks/hooks';
import { useSizeConstraint } from 'utils';
import RelaksMediaCapture from 'relaks-media-capture';
import LiveVideo from 'live-video';

async function PhotoDialogBox(props) {
    const { onClose, onCapture } = props;
    const [ capture ] = useState(() => {
        return new RelaksMediaCapture({
            video: true,
            audio: false,
            preferredDevice: 'front',
            captureImageOnly: true,
        });
    });
    const [ show ] = useProgress(50, 50);
    const target = { func: PhotoDialogBox, props };

    useEffect(() => {
        capture.activate();

        return () => {
            capture.deactivate();
        };
    }, []);

    const handleSnap = (evt) => {
        capture.snap();
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
    };

    const handlers = {
        onSnap: handleSnap,
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
            liveVideo: capture.liveVideo,
            capturedImage: capture.capturedImage,
        };
        show(<PhotoDialogBoxSync {...sprops} {...handlers} />);
        await capture.change();
    } while (capture.active);
}

function PhotoDialogBoxSync(props) {
    const { status, liveVideo, capturedImage } = props;
    const { devices, chosenDeviceID } = props;
    const { onCancel, onChoose, onSnap, onClear, onAccept } = props;
    const size = useSizeConstraint(liveVideo, { width: 320, height: 240 });
    const target = { func: PhotoDialogBoxSync, props };

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
                Image Capture
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
};

const asyncComponent = Relaks(PhotoDialogBox);
const syncComponent = PhotoDialogBoxSync;

export {
    asyncComponent as default,
    asyncComponent as PhotoDialogBox,
    syncComponent as PhotoDialogBoxSync,
};
