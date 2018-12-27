var defaultOptions = {
    video: true,
    audio: true,
    preferredDevice: 'front',
    chooseNewDevice: true,
};

function RelaksCamera(options) {
    this.options = {};
    this.status = undefined;
    this.liveVideo = undefined;
    this.liveAudio = undefined;
    this.lastError = null;
    this.devices = [];
    this.selectedDeviceID = undefined;

    this.waitPromise = null;
    this.waitReject = null;
    this.waitResolve = null;
    this.waitTimeout = 0;

    this.handleDeviceChange = this.handleDeviceChange.bind(this);
    this.handleStreamEnd = this.handleStreamEnd.bind(this);

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
        if (this.capturedVideo || this.capturedAudio || this.capturedImage) {
            // can't reactivate without calling reset() first
            return;
        }
        this.acquire();
        this.active = true;
        this.notifyChange();
        this.monitorDevices();
    }
};

/**
 * End the capturing process, release the recording device and free
 * captured resources if extract() wasn't called
 */
prototype.deactivate = function() {
    if (this.active) {
        var _this = this;
        var delay = this.options.deactivationDelay || 0;
        setTimeout(function() {
            _this.releaseInput();
            _this.revokeBlobs();
        }, delay);
        this.ignoreDevices();
        this.active = false;
        this.notifyChange();
    }
};

/**
 * Acquire an input device
 *
 * @return {Promise}
 */
prototype.acquire = function() {
    var _this = this;
    var audio = false;
    var video = false;
    var type = '';
    if (!this.status) {
        this.status = 'acquiring';
    }
    if (this.options.audio) {
        audio = true;
        type = 'audio';
    }
    if (this.options.video) {
        video = true;
        type = 'video';
    }
    return getDevices(type).then(function(devices) {
        var preferred = _this.selectedDeviceID || _this.options.preferredDevice;
        var device = chooseDevice(devices, preferred);
        if (device) {
            if (video) {
                video = { deviceId: device.id };
            } else if (audio) {
                audio = device.id;
            }
        }
        var constraints = { video, audio };
        return getMediaStream(constraints).then(function(stream) {
            // stop all tracks
            _this.status = 'initiating';
            _this.devices = devices;
            _this.selectedDeviceID = (device) ? device.id : undefined;
            _this.notifyChange();
            return getMediaStreamMeta(stream).then(function(meta) {
                var input = _this.liveVideo || _this.liveAudio;
                if (input) {
                    _this.releaseInput();
                }
                if (video) {
                    _this.liveVideo = {
                        stream: stream,
                        height: meta.height,
                        width: meta.width,
                    };
                } else if (audio) {
                    _this.liveAudio = {
                        stream: stream,
                    };
                }
                _this.monitorInput();
                _this.status = 'previewing';
                _this.notifyChange();
            });
        }).catch(function(err) {
            _this.lastError = err;
            _this.status = 'denied';
            _this.notifyChange();
            return null;
        });
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
prototype.snap = function(dimensions) {
    var width = video.videoWidth;
    var height = video.videoHeight;
    var canvas = document.createElement('CANVAS');
    canvas.width = width;
    canvas.height = height;
};

/**
 * Keep an eye out for device addition/removal
 */
prototype.monitorDevices = function() {
    var mediaDevices = navigator.mediaDevices;
    if (mediaDevices && mediaDevices.addEventListener) {
        mediaDevices.addEventListener('devicechange', this.handleDeviceChange);
    }
}

prototype.ignoreDevices = function() {
    var mediaDevices = navigator.mediaDevices;
    if (mediaDevices && mediaDevices.removeEventListener) {
        mediaDevices.removeEventListener('devicechange', this.handleDeviceChange);
    }
}

/**
 * Keep an eye on the input stream
 */
prototype.monitorInput = function() {
    var input = this.liveVideo || this.liveAudio;
    var tracks = input.stream.getTracks();
    for (var i = 0; i < tracks.length; i++) {
        tracks[i].onended = this.handleStreamEnd;
    }
};

/**
 * Release recording device
 */
prototype.releaseInput = function() {
    var input = this.liveVideo || this.liveAudio;
    if (input) {
        // stop all tracks
        var tracks = input.stream.getTracks();
        for (var i = 0; i < tracks.length; i++) {
            tracks[i].onended = undefined;
            tracks[i].stop();
        }
    }
    this.liveVideo = undefined;
    this.liveAudio = undefined;
};

/**
 * Revoke the blob URL of captured media and set them to undefined
 */
prototype.revokeBlobs = function() {
    if (this.capturedVideo) {
        URL.revokeObjectURL(this.capturedVideo.url);
        this.capturedVideo = undefined;
    }
    if (this.capturedAudio) {
        URL.revokeObjectURL(this.capturedAudio.url);
        this.capturedAudio = undefined;
    }
    if (this.capturedImage) {
        URL.revokeObjectURL(this.capturedImage.url);
        this.capturedImage = undefined;
    }
};

/**
 * Add captured media to the list of object, sans blob URLs
 *
 * @return {Object}
 */
prototype.extract = function() {
    var media = {};
    if (this.capturedVideo) {
        media.video = {
            blob: this.capturedVideo,
            width: this.capturedVideo.width,
            height: this.capturedVideo.height,
            duration: this.capturedVideo.duration,
        };
    }
    if (this.capturedAudio) {
        media.audio = {
            blob: this.capturedVideo,
            duration: this.capturedVideo.duration,
        };
    }
    if (this.capturedImage) {
        media.image = {
            blob: this.capturedVideo,
            width: this.capturedVideo.width,
            height: this.capturedVideo.height,
        };
    }
};

prototype.reacquire = function() {
    this.status = 'initiating';
    this.releaseInput();
    this.notifyChange();
    return this.acquire();
};

prototype.choose = function(deviceID) {
    this.selectedDeviceID = deviceID;
    return this.reacquire();
};

prototype.clear = function() {
    this.revokeBlobs();
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

prototype.handleDeviceChange = function(evt) {
    var _this = this;
    var devicesBefore = this.devices;
    var type;
    if (this.options.audio) {
        type = 'audio';
    }
    if (this.options.video) {
        type = 'video';
    }
    if (this.scanningDevices) {
        return;
    }
    this.scanningDevices = true;
    getDevices(type).then(function(devices) {
        var newDevice = null;
        var useNewDevice = false;
        if (_this.status === 'initiating' || _this.status === 'previewing') {
            useNewDevice = _this.options.chooseNewDevice;
        }
        if (useNewDevice) {
            for (var i = 0; i < devices.length; i++) {
                var device = devices[i];
                var added = true;
                for (var j = 0; j < devicesBefore.length; j++) {
                    var deviceBefore = devicesBefore[j];
                    if (device.id === deviceBefore.id) {
                        added = false;
                        break;
                    }
                }
                if (added) {
                    newDevice = devices[i];
                    break;
                }
            }
        }
        _this.devices = devices;
        _this.scanningDevices = false;
        if (newDevice) {
            // use the new device
            _this.choose(newDevice.id);
        } else {
            // just note the change to the device list
            _this.notifyChange();
        }
    });
};

prototype.handleStreamEnd = function(evt) {
    var input = this.liveVideo || this.liveAudio;
    if (input) {
        var tracks = input.stream.getTracks();
        for (var i = 0; i < tracks.length; i++) {
            if (evt.target === tracks[i]) {
                if (this.status === 'previewing') {
                    this.reacquire();
                } else if (this.status === 'recording' || this.status === 'paused') {
                    this.releaseInput();
                    this.stop();
                }
                break;
            }
        }
    }
};

function getMediaStream(constraints) {
    try {
        return navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
        return Promise.reject(err);
    }
}

function getMediaStreamMeta(stream) {
    return new Promise(function(resolve, reject) {
        var video = document.createElement('VIDEO');
        video.srcObject = stream;
        video.muted = true;
        // dimensions aren't always available when loadedmetadata fires
        // listening for additional event just in case
        video.onloadedmetadata =
        video.onloadeddata =
        video.oncanplay = function(evt) {
            var target = evt.target;
            var w = target.videoWidth;
            var h = target.videoHeight;
            if (resolve && w && h) {
                resolve({ width: w, height: h });
                target.pause();
                resolve = null;
            }
        };
        video.onerror = function(evt) {
            var err = new RelaksMediaCaptureError('Unable to obtain metadata');
            reject(err);
            video.pause();
        };
        video.play();
    });
}

function getDevices(type) {
    var mediaDevices = navigator.mediaDevices;
    if (mediaDevices && mediaDevices.enumerateDevices) {
        return new Promise(function(resolve, reject) {
            mediaDevices.enumerateDevices().then(function(devices) {
                var list = [];
                var kind = type + 'input';
                for (var i = 0; i < devices.length; i++) {
                    var device = devices[i];
                    if (device.kind === kind && device.deviceId) {
                        list.push({
                            id: device.deviceId,
                            label: device.label,
                        });
                    }
                }
                resolve(list);
            }).catch(function(err) {
                resolve([]);
            });
        });
    } else {
        return Promise.resolve([]);
    }
}

function chooseDevice(devices, preferred) {
    if (preferred) {
        for (var i = 0; i < devices.length; i++) {
            var device = devices[i];
            if (device.id === preferred) {
                return device;
            }
        }
        var fragment = preferred.toLowerCase();
        for (var i = 0; i < devices.length; i++) {
            var device = devices[i];
            var label = device.label
            if (label && label.toLowerCase().indexOf(fragment) !== -1) {
                return device;
            }
        }
    }
    return devices[0];
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
            var dataURL = canvas.toDataURL(mimeType, quality);
            var xhr = new XMLHttpRequest();
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

function RelaksMediaCaptureError(message) {
    this.message = message;
}

RelaksMediaCaptureError.prototype = Object.create(Error.prototype)

module.exports = RelaksCamera;
