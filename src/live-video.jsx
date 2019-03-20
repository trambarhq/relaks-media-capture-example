import React, { useRef, useEffect } from 'react';

function LiveVideo(props) {
    const { srcObject, ...vprops } = props;
    const node = useRef();

    useEffect(() => {
        if (srcObject instanceof MediaStream) {
            node.current.srcObject = srcObject;
            node.current.play();
            return () => {
                node.current.pause();
                node.current.srcObject = null;
            };
        } else if (srcObject instanceof Blob) {
            const url = URL.createObjectURL(srcObject);
            node.current.src = url;
            node.current.oncanplay = function(evt) {
                evt.target.play();
            };
            return () => {                
                node.current.src = '';
                node.current.oncanplay = null;
                URL.revokeObjectURL(url);
            };
        }
    }, [ srcObject ]);

    return <video ref={node} {...vprops} />;
}

export {
    LiveVideo as default,
    LiveVideo,
};
