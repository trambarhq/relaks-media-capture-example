var defaultOptions = {
    video: true,
    audio: true,
};

function RelaksCamera(options) {
    this.options = {};
    this.liveVideo = undefined;
    this.liveAudio = undefined;
    this.lastError = null;
    this.destroyed = false;

    this.waitPromise = null;
    this.waitReject = null;
    this.waitResolve = null;
    this.waitTimeout = 0;

    for (var name in defaultOptions) {
        if (options && options[name] !== undefined) {
            this.options[name] = options[name];
        } else {
            this.options[name] = defaultOptions[name];
        }
    }
}

var prototype = RelaksCamera.prototype;

/**
 * Begin the capturing process, first by acquiring a recording device.
 * Capturing won't start until start() is called
 */
prototype.activate = function() {
    if (!this.active) {
        this.acquire();
        this.active = true;
        this.notifyChange();
    }
};

/**
 * End the capturing process, release the recording device and free
 * captured resources if extract() wasn't called
 */
prototype.deactivate = function() {
    if (this.active) {
        var _this = this;
        var delay = this.options.deactivateDelay || 0;
        setTimeout(function() {
            _this.release();
            _this.revoke();
        }, delay);
        this.active = false;
        this.notifyChange();
    }
};

/**
 * Acquire an input device
 *
 * @return {Promise}
 */
prototype.acquire = function(deviceID) {
    var _this = this;
    var audio = false;
    var video = false;
    if (this.options.audio) {
        audio = true;
    }
    if (this.options.video) {
        if (deviceID) {
            video = deviceID;
        } else {
            video = true;
        }
    }
    var constraints = { video, audio };
    return getMediaStream(constraints).catch(function(err) {
        _this.lastError = err;
        return null;
    }).then(function(stream) {
        var input = null;
        if (stream && !_this.destroyed) {
            input = {
                stream: stream
            }
        }
        if (video) {
            _this.liveVideo = input;
        } else if (audio) {
            _this.liveAudio = input;
        }
    });
};

/**
 * Start capturing video/audio
 *
 * @return {Promise}
 */
prototype.start = function() {

};

/**
 * Stop capturing video/audio
 *
 * @return {Promise}
 */
prototype.stop = function() {

};

/**
 * Capture a snapshot of the video input
 *
 * @param  {Object|undefined} dimensions
 *
 * @return {Promise}
 */
prototype.captureImage = function(dimensions) {
    let width = video.videoWidth;
    let height = video.videoHeight;
    let canvas = document.createElement('CANVAS');
    canvas.width = width;
    canvas.height = height;
};

/**
 * Release recording device
 */
prototype.release = function() {
    var input = this.liveVideo || this.liveAudio;
    if (input) {
        // stop all tracks
        var tracks = input.stream.getTracks();
        for (var i = 0; i < tracks.length; i++) {
            tracks[i].stop();
        }
    }
    this.liveVideo = undefined;
    this.liveAudio = undefined;
};

/**
 * Revoke the blob URL of captured media and set them to undefined
 */
prototype.revoke = function() {
    if (this.capturedVideo) {
        if (this.extractedMedia.indexOf(this.capturedVideo) === -1) {
            URL.revokeObjectURL(this.capturedVideo.url);
        }
        this.capturedVideo = undefined;
    }
    if (this.capturedAudio) {
        if (this.extractedMedia.indexOf(this.capturedAudio) === -1) {
            URL.revokeObjectURL(this.capturedAudio.url);
        }
        this.extractedMedia.push(this.capturedAudio);
    }
    if (this.capturedImage) {
        if (this.extractedMedia.indexOf(this.capturedImage) === -1) {
            URL.revokeObjectURL(this.capturedImage.url);
        }
        this.extractedMedia.push(this.capturedImage);
    }
};

/**
 * Add captured media to the list of object whose blob URL we don't revoke
 *
 * @return {Object}
 */
prototype.extract = function() {
    if (this.capturedVideo) {
        this.extractedMedia.push(this.capturedVideo);
    }
    if (this.capturedAudio) {
        this.extractedMedia.push(this.capturedAudio);
    }
    if (this.capturedImage) {
        this.extractedMedia.push(this.capturedImage);
    }
};

prototype.clear = function() {
    this.revoke();
    this.notifyChange();
};

prototype.change = function() {
    var _this = this;
    if (!this.waitPromise) {
        this.waitPromise = new Promise(function(resolve, reject) {
            _this.waitResolve = resolve;
            _this.waitReject = reject;
        });
    }
    return this.waitPromise;
};

prototype.notifyChange = function() {
    var resolve = this.waitResolve;
    if (resolve) {
        this.waitPromise = null;
        this.waitResolve = null;
        this.waitReject = null;
        resolve();
    }
};

function getMediaStream(constraints) {
    try {
        return navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
        return Promise.reject(err);
    }
}

/**
 * Save canvas contents to a blob using toBlob() if browser supports it,
 * otherwise fallback to toDataURL()
 *
 * @param  {HTMLCanvasElement} canvas
 * @param  {String} mimeType
 * @param  {Number} quality
 *
 * @return {Promise<Blob>}
 */
function saveCanvasContents(canvas, mimeType, quality) {
    return new Promise(function(resolve, reject) {
        if (typeof(canvas.toBlob) === 'function') {
            resolve.toBlob(cb, mimeType, 90);
        } else {
            let dataURL = canvas.toDataURL(mimeType, quality);
            let xhr = new XMLHttpRequest();
            xhr.responseType = 'blob';
            xhr.open('GET', url);
            xhr.onload = function(evt) {
                if (xhr.status >= 400) {
                    reject(new Error('Error parsing data URL'));
                } else {
                    resolve(xhr.response);
                }
            };
        }
    });
}

function RelaksCameraError(message) {
    this.message = message;
}

RelaksCameraError.prototype = Object.create(Error.prototype)

module.exports = RelaksCamera;
