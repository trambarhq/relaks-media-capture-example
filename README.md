Relaks Media Capture Example
============================

In [previous examples](https://github.com/trambarhq/relaks#examples), we had used [Relaks](https://github.com/trambarhq/relaks) to retrieve remote data. In this example we're going to do something different. We're going to build a component that captures video through a webcam. It's meant to demonstrate that Relaks can be used to solve a broad range of problems.

One way to think of Relaks is that it is React with time. Whereas a React component's render function produces a picture, a Relaks component's render function produces an animation, composed of multiple pictures appearing at different points in time. When we use Relaks to render a page progressively, we're really creating an animation that looks as follows:

* Frame 1: Message indicating the page is loading
* Frame 2: Page with 60% of the data it needs
* Frame 3: Page with 85% of the data
* Frame 4: Page with 100% of the data

For our video capturing component, we'd create something like this:

* Frame 1: Placeholder graphic while waiting for the user to grant permission to use camera
* Frame 2: Input from camera 1
* Frame 3: Input from camera 2 (after the user made the switch)
* Frame 4: Changes to the UI indicating recording has commenced (after the user pressed the **Start** button)
* Frame 5: Duration changes to `00:01`
* Frame 6: Duration changes to `00:02`
*  ...
* Frame 64: Duration changes to `01:00`
* Frame 65: The recorded video (after the user pressed the **Stop** button)

This animation runs for a bit longer, naturally. It's also non-linear: The user can affect how it unfolds. Conceptually though, it's not at all different from what we've been creating so far.

## Live Demo

You can see the example in action [here](https://trambar.io/examples/media-capture/). It's little more than a list of three buttons. Clicking on a button bring up a dialog box for capturing a video clip, an audio clip, or a photo.

Note: `VideoDialogBox` and `AudioDialoBox` will not work in Safari or Edge due to the lack of support for media recording.

[![Screen shot](docs/img/screenshot.jpg)](https://trambar.io/examples/media-capture/)

## Getting Started

To see the code running in debug mode, first clone this repository. In the working folder, run `npm install`. Once that's done, run `npm run dev` to launch [WebPack Dev Server](https://webpack.js.org/configuration/dev-server/). Open a browser window and enter `http://localhost:8080` as the location.

Run `npm run dev-https` if you wish to see the example in a phone or a tablet. Neither Chrome or Firefox permits the use of the camera in an insecure page (unless the server is localhost). WebPack Dev Server therefore needs to use HTTPS. The browser will still regard the page as suspect. You'll have to confirm that you really want to go there.

## VideoDialogBox

The source code of `VideoDialogBox` ([video-dialog-box.jsx](https://github.com/trambarhq/relaks-media-capture-example/blob/master/src/video-dialog-box.jsx)) is organized like that of any functional React component. The top half of the function consists of set-up code that invokes various hooks. The bottom half consists of UI rendering code. `VideoDialogBox` is a Relaks component so it's declared as async. Asynchronous operations are performed in the middle of the function--after hook invocations and before UI code.

In addition to the [usual rules concerning hook usage](https://reactjs.org/docs/hooks-rules.html), Relaks requires that all hooks to be called prior to the first call to the `show()`.

The component's full source code is listed below. We'll break it down section by section further down the page. Just skim through it.

```javascript
import React, { useMemo, useEffect, useCallback } from 'react';
import Relaks, { useProgress } from 'relaks';
import RelaksMediaCapture from 'relaks-media-capture';
import { LiveVideo } from 'live-video';
import { constrainSize } from 'utils';

async function VideoDialogBox(props) {
    const { onClose, onCapture } = props;
    const [ show ] = useProgress();
    const capture = useMemo(() => {
        return new RelaksMediaCapture({
            video: true,
            audio: true,
            preferredDevice: 'front',
            watchVolume: true,
        });
    }, []);

    const handleStart = useCallback((evt) => {
        capture.start();
        capture.snap();
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
        const { capturedVideo, capturedImage } = capture;
        if (onCapture) {
            onCapture({
                video: {
                    blob: capturedVideo.blob,
                    width: capturedVideo.width,
                    height: capturedVideo.height,
                    duration: capturedVideo.duration,
                },
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
                Video Recorder
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
        const { status, liveVideo, capturedVideo, capturedImage } = capture;
        switch (status) {
            case 'acquiring':
                return (
                    <span className="fa-stack fa-lg">
                        <i className="fa fa-video fa-stack-1x" />
                    </span>
                );
            case 'denied':
                return (
                    <span className="fa-stack fa-lg">
                        <i className="fa fa-video fa-stack-1x" />
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
                return <video src={capturedVideo.url} poster={capturedImage.url} style={size} controls />;
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

const component = Relaks.memo(VideoDialogBox);

export {
    component as VideoDialogBox,
};
```

As usual, the first thing we do is copying the component's props into local variables:

```javascript
    const { onClose, onCapture } = props;
```

There are just two: a callback to close the dialog box and another for returning the result.

Next, we obtain the `show()` function from `useProgress`:

```javascript
    const [ show ] = useProgress();
```

Then we create an instance of [`RelaksMediaCapture`](https://github.com/trambarhq/relaks-media-capture), a reusable class that encapsulates all details concerning video/audio recording:

```javascript
    const capture = useMemo(() => {
        return new RelaksMediaCapture({
            video: true,
            audio: true,
            preferredDevice: 'front',
            watchVolume: true,
        });
    }, []);
```

The parameter given to the constructor indicates that we want both video and audio, that we prefer the front-facing camera, and that we want the object to monitor the microphone.

What follows is a series of event handlers, each of which is involved when the user clicks a button. `handleStart()` starts the recording process:

```javascript
    const handleStart = useCallback((evt) => {
        capture.start();
        capture.snap();
    });
```

It also asks for a snapshot from the camera, which we can subsequently use as the video's "poster."

`handlePause()` pauses recording while `handleResume()` resumes it:

```javascript
    const handlePause = useCallback((evt) => {
        capture.pause();
    });
    const handleResume = useCallback((evt) => {
        capture.resume();
    });
```

`handleStop()` ends recording:

```javascript
    const handleStop = useCallback((evt) => {
        capture.stop();
    });
```

`handleClear()` discards what was recorded so the user can start over:

```javascript
    const handleClear = useCallback((evt) => {
        capture.clear();
    });
```

`handleAccept()` returns the captured video and image to the parent component:

```javascript
    const handleAccept = useCallback((evt) => {
        const { capturedVideo, capturedImage } = capture;
        if (onCapture) {
            onCapture({
                video: {
                    blob: capturedVideo.blob,
                    width: capturedVideo.width,
                    height: capturedVideo.height,
                    duration: capturedVideo.duration,
                },
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
```

While `handleClose()` just tells to parent component to close the dialog box:

```javascript
    const handleCancel = useCallback((evt) => {
        if (onClose) {
            onClose({});
        }
    });
```

When the user chooses a different camera, `handleDeviceChange()` is called:

```javascript
    const handleDeviceChange = useCallback((evt) => {
        capture.choose(evt.target.value);
    });
```

That's it for event handling. I hope that the code was largely self-explanatory.

The last hook we invoke is `useEffect`. We use it to initiate the media capture object and to shut it down when the component unmounts:

```javascript
    useEffect(() => {
        capture.activate();
        return () => {
            capture.deactivate();
        };
    }, []);
```

Now we've reached the part of function where asynchronous operations take place. The code is surprisingly simple:

```javascript
    do {
        render();
        await capture.change();
    } while (capture.active);
```

Basically, we wait for our media capture object to experience a change. When that happens, we rerender.

At first glance the loop above might seem disconcerting. It seems like a newbie mistake to wait for change to occur in a loop. Due to JavaScript's single-threaded nature, such a loop would cause the browser to lock up in synchronous code. We're dealing with asynchronous code here, however. The loop is perfectly okay. Code execution will jump to somewhere else while we wait for a change.

The usefulness of the loop would be more apparent if we imagine that other actions will occur after we've captured the video. Suppose we want to upload the video to the server. We would handle that in the following manner:

```javascript
    do {
        render();
        await capture.change();
    } while (capture.active);

    uploader.queue(capture.capturedVideo.blob);
    uploader.queue(capture.capturedImage.blob);
    uploader.activate();
    do {
        render();
        await uploader.change();
    } while(uploader.active);
```

Now suppose that after uploading the file, we need to wait for the video to be transcoded. Every few seconds we want to ask the server how much progress it has made. Doing so would be fairly straight forward:

```javascript
    do {
        render();
        await capture.change();
    } while (capture.active);

    uploader.queue(capture.capturedVideo.blob);
    uploader.queue(capture.capturedImage.blob);
    uploader.activate();
    do {
        render();
        await uploader.change();
    } while(uploader.active);

    const { transcodingProgressURL } = uploader.result;
    let transcodingProgress = 0;
    while (transcodingProgress < 100) {
        transcodingProgress = await fetch(transcodingProgressURL);
        render();
        await delay(3000);
    };
```

As you can see, the use of loops allows us to easily slot in addition steps. The imperative coding style makes the program flow much more obvious.

Anyway, let us get back to the actual code of our example. All that's left is the component's UI code. The helper function `render()` is the starting point. It uses `show()` from `useProgress` to update the interface:

```javascript
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
```

`renderTitle()` is fairly boring. It just draws a `div` with some text and an icon:

```javascript
    function renderTitle() {
        return (
            <div className="title">
                Video Recorder
                <i className="fa fa-window-close" onClick={handleCancel} />
            </div>
        );
    }
```

`renderViewport()` is responsible for the component's main contents. It draws a container `div` and calls another function to render the video itself:

```javascript
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
```

What `renderVideo()` produces depends on the current status of the media capture object:

```javascript
    function renderVideo(size) {
        const { status, liveVideo, capturedVideo, capturedImage } = capture;
        switch (status) {
            case 'acquiring':
                return (
                    <span className="fa-stack fa-lg">
                        <i className="fa fa-video fa-stack-1x" />
                    </span>
                );
            case 'denied':
                return (
                    <span className="fa-stack fa-lg">
                        <i className="fa fa-video fa-stack-1x" />
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
                return <video src={capturedVideo.url} poster={capturedImage.url} style={size} controls />;
        }
    }
```

The capturing process begins with a status of `acquiring`, when we ask the browser for permission to use the camera. If the user choose not to grant permission, the status changes to `denied`. Otherwise the status becomes `initiating`, which lasts only a brief moment before it changes to `previewing`. At this point the video stream is available and we can show the user what the camera is seeing.

When the user clicks the **Start** button, the status changes to `capturing`. If the user clicks the **Pause** button at some point, the status would change to `paused`. A click on **Resume** would change it back to `capturing`.

When the user finally clicks the **Stop** button, the status becomes `captured`.

The `liveVideo` property of `capture` holds a [`MediaStream`](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream) object. It represents the live input from the camera. When attached to a `<video />` as its [`srcObject`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/srcObject), the element will show the video feed. `liveVideo` will change when the user select a different camera. It could also change when the user rotate the device.

`capturedVideo` and `capturedImage` are the end results of the capturing operation. The latter is used as a video element's "poster."

The `LiveVideo` component ([`live-video.jsx`](https://github.com/chung-leong/relaks-media-capture-example/blob/master/src/live-video.jsx)) doesn't do anything aside from rendering a `video` element. It's a workaround for React's inability to set an element's `srcObject` via prop.

The live video needs to be muted to avoid audio feedback.

`renderControls()` draws the bottom part of the dialog box:

```javascript
    function renderControls() {
        return (
            <div className="controls">
                {renderDuration() || renderDeviceMenu()}
                {renderVolume()}
                {renderButtons()}
            </div>
        )
    }
```

On the left side of the dialog box we have either the duration or device selection menu. `renderDeviceMenu()` makes use of the capture object's `devices` and `chosenDeviceID` properties:

```javascript
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
```

The list of devices can change when the user plugs in a new device.

`renderDuration()` meanwhile uses `duration`, the video length in millisecond.

```javascript
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
```

The property is undefined unless the status is `capturing`, `captured`, or `paused`.

The volume indicator reassures the user that his voice is being picked up. `renderVolume()` makes use of `volume` from the capture object:

```javascript
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
```

It's is a number between 0 and 100 indicating the strength of audio. Whenever it changes the promise returned by `capture.change()` will resolve, triggering a rerendering of the component.

What buttons are shown depends on the current status:

```javascript
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
```

At the very end, we call `Relaks.memo()` to convert our async function into a regular React component and export it:

```javascript
const component = Relaks.memo(VideoDialogBox);

export {
    component as VideoDialogBox,
};
```

That's it!

## Taking Photo

Taking a picture is probably a more common feature in web applications than video capturing. We can easily accomplish that by stripping down `VideoDialogBox`. `PhotoDialogBox` ([photo-dialog-box.jsx](https://github.com/chung-leong/relaks-media-capture-example/blob/master/src/photo-dialog-box.jsx)) is the result.

## Final Thoughts

I hope this example has lent you some new insights into Relaks. As was said earlier, Relaks is React wih time. It lets you tap into the power of ES7 async/await, a feature that greatly simplifies management of asynchronous operations.

In an future example, we're going to implement the file uploader that appeared in our hypothetical code. Stay tuned!
