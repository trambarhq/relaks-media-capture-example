function constrainSize(liveVideo, defDimensions) {
    let { width, height } = defDimensions;
    if (liveVideo) {
        const html = document.body.parentNode;
        const availableWidth = html.clientWidth - 50;
        const availableHeight = html.clientHeight - 100;

        width = liveVideo.width;
        height = liveVideo.height;
        if (liveVideo.width > availableWidth) {
            height = Math.round(height * availableWidth / width);
            width = availableWidth;
        }
        if (height > availableHeight) {
            width = Math.round(width * availableHeight / height);
            height = availableHeight;
        }
    }
    return { width, height };
}

export {
    constrainSize,
};
