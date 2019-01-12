Relaks Media Capture Example
============================

In [previous examples](https://github.com/trambarhq/relaks#examples), we used [Relaks](https://github.com/trambarhq/relaks) to facilitate retrieval of remote data. In this example we're going to do something different. We're going to build a component that captures video through a webcam. It's meant to demonstrate that Relaks can be used to solve a broad range of problems. It'll also yield a reusable library that we can employ in future projects.

One way to think of Relaks is that it's React with time added. Where as `render()` produces a picture, `renderAsync()` produces an animation, composed of multiple pictures appearing at different points in time. When we use Relaks to render a page progressively, we're actually creating an animation that looks as follows:

* Frame 1: Message indicating the page is loading
* Frame 2: Page with 60% of the data it needs
* Frame 3: Page with 85% of the data
* Frame 4: Page with 100% of the data

For our video capturing component, we'd create something like this:

* Frame 1: Placeholder graphic while wanting for the user to grant permission to camera
* Frame 2: Input from camera 1
* Frame 3: Input from camera 2 (after the user made the switch)
* Frame 4: Changes to the UI indicating recording has commenced (after the user pressed the **Start** button)
* Frame 5: Duration changes to `00:01`
* Frame 6: Duration changes to `00:02`
*  ...
* Frame 64: Duration changes to `01:00`
* Frame 65: The recorded video (after the user pressed the **Stop** button)

This animation runs for a bit longer, naturally. It's also non-linear. The user can change how it unfolds. Conceptually though, it's not at all different from what we've been creating so far. We're going to employ the same strategy as before: create a regular React component that handles the visual aspects and a Relaks component that handles with the temporal aspects.

Meanwhile, the details concerning with camera management and video encoding will get shoved into a [separate reusable class](https://github.com/trambarhq/relaks-media-capture).

## Live Demo

You can see the example in action [here](https://trambar.io/examples/media-capture/). It's little more than a list of buttons. The first seven brings up the synchronous component in various state, with video files as stand-in for camera input. The last button brings up the asynchronous component, wired up to a real camera.

![Screen shot](docs/img/screenshot.jpg)

## Getting Started

To see the code running in debug mode, first clone this repository. In the working folder, run `npm install`. Once that's done, run `npm run start` to launch [WebPack Dev Server](https://webpack.js.org/configuration/dev-server/). Open a browser window and enter `http://localhost:8080` as the location.

Run `npm run start-https` if you wish to see the example in a different device. Either Chrome or Firefox permit the use of the camera in an insecure page (unless the server is localhost). Therefore WebPack Dev Server needs to employ HTTPS. The browser will still regard the page as suspect. You'll need to confirm that you really want to go there.

## VideoDialogBoxAsync

The example was built in a sort of backward fashion. `VideoDialogBoxAsync` was coded first with the help of dummy props. Once the user interface was finished and the set of necessary props was established, `VideoDialogBox` was written, which supplies these props to its synchronous partner. The code that actually deals with video recording was written last.

Let us first examine `VideoDialogBoxAsync` ([video-dialog-box.jsx](https://github.com/chung-leong/relaks-media-capture-example/blob/master/src/video-dialog-box.jsx#L111)). Its `propTypes` are listed below:

```javascript
VideoDialogBoxSync.propTypes = {
    status: PropTypes.oneOf([
        'acquiring',
        'denied',
        'initiating',
        'previewing',
        'capturing',
        'paused',
        'captured',
    ]),
    liveVideo: PropTypes.shape({
        stream: PropTypes.instanceOf(MediaStream).isRequired,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
    }),
    capturedVideo: PropTypes.shape({
        url: PropTypes.string.isRequired,
        blob: PropTypes.instanceOf(Blob).isRequired,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
    }),
    capturedImage: PropTypes.shape({
        url: PropTypes.string.isRequired,
        blob: PropTypes.instanceOf(Blob).isRequired,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
    }),
    volume: PropTypes.number,
    duration: PropTypes.number,
    devices: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string,
    })),
    selectedDeviceID: PropTypes.string,

    onChoose: PropTypes.func,
    onCancel: PropTypes.func,
    onStart: PropTypes.func,
    onStop: PropTypes.func,
    onPause: PropTypes.func,
    onResume: PropTypes.func,
    onClear: PropTypes.func,
    onAccept: PropTypes.func,
}
```

The capturing process starts with a status of `acquiring`, when we ask the browser for permission to use the camera. If the user choose not to grant permission, the status changes to `denied`. Otherwise the status becomes `initiating`, which last only a brief moment, before it changes to `previewing`. At this point the video stream is available and we can show the user want he's about to capture.

When the user clicks the **Start** button, the status changes to `capturing`. If he clicks the **Pause** button at some point, the status would change to `paused`. A click on **Resume** changes the status back to `capturing`.

When the user finally clicks the **Stop** button, the status becomes `captured`.

```javascript
render() {
    return (
        <div className="overlay">
            <div className="dialog-box video">
                {this.renderTitle()}
                {this.renderViewport()}
                {this.renderControls()}
            </div>
        </div>
    );
}
```

```javascript
renderViewport() {
    let { status } = this.props;
    let { viewportWidth, viewportHeight } = this.state;
    let style = {
        width: viewportWidth,
        height: viewportHeight,
    };
    let className = `video-viewport ${status}`;
    return (
        <div className={className} style={style}>
            {this.renderVideo()}
        </div>
    );
}
```

```javascript
renderVideo() {
    let { status, liveVideo, capturedVideo, capturedImage } = this.props;
    let { viewportWidth, viewportHeight } = this.state;
    let videoStyle = {
        width: viewportWidth,
        height: viewportHeight,
    };
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
            return <LiveVideo srcObject={liveVideo.stream} style={videoStyle} muted />;
        case 'captured':
            return <video src={capturedVideo.url} poster={capturedImage.url} style={videoStyle} controls />;
    }
}
```

```javascript
renderControls() {
    return (
        <div className="controls">
            {this.renderDuration() || this.renderDeviceMenu()}
            {this.renderVolume()}
            {this.renderButtons()}
        </div>
    )
}
```

## VideoDialogBox

```javascript
VideoDialogBox.propTypes = {
    onClose: PropTypes.func,
    onCapture: PropTypes.func,
};
```

```javascript
constructor(props) {
    super(props);
    let options = {
        video: true,
        audio: true,
        preferredDevice: 'front',
        watchVolume: true,
    };
    this.capture = new RelaksMediaCapture(options);
}
```

```javascript
async renderAsync(meanwhile) {
    meanwhile.delay(50, 50);
    let props = {
        onStart: this.handleStart,
        onStop: this.handleStop,
        onPause: this.handlePause,
        onResume: this.handleResume,
        onClear: this.handleClear,
        onChoose: this.handleChoose,
        onAccept: this.handleAccept,
        onCancel: this.handleCancel,
    };
    meanwhile.show(<VideoDialogBoxSync {...props} />);
    this.capture.activate();
    do {
        props.status = this.capture.status;
        props.devices = this.capture.devices;
        props.selectedDeviceID = this.capture.selectedDeviceID;
        props.liveVideo = this.capture.liveVideo;
        props.duration = this.capture.duration;
        props.volume = this.capture.volume;
        props.capturedImage = this.capture.capturedImage;
        props.capturedVideo = this.capture.capturedVideo;
        meanwhile.show(<VideoDialogBoxSync {...props} />);
        await this.capture.change();
    } while (this.capture.active);
    return <VideoDialogBoxSync {...props} />;
}
```

```javascript
handleStart = (evt) => {
    this.capture.start();
    this.capture.snap();
}

handleStop = (evt) => {
    this.capture.stop();
}

handlePause = (evt) => {
    this.capture.pause();
}

handleResume = (evt) => {
    this.capture.resume();
}

handleClear = (evt) => {
    this.capture.clear();
}

handleChoose = (evt) => {
    this.capture.choose(evt.id);
}
```

```javascript
handleAccept = (evt) => {
    let { onCapture } = this.props;
    if (onCapture) {
        let evt = {
            type: 'capture',
            target: this,
            video: {
                blob: this.capturedVideo.blob,
                width: this.capturedVideo.width,
                height: this.capturedVideo.height,
                duration: this.capturedVideo.duration,
            },
            image: {
                blob: this.capturedVideo.blob,
                width: this.capturedVideo.width,
                height: this.capturedVideo.height,
            },
        };
        onCapture(evt);
    }
    this.capture.deactivate();
    this.handleCancel();
}
```
