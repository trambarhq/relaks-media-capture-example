import React, { PureComponent } from 'react';

class LiveVideo extends PureComponent {
    render() {
        let { srcObject, ...props } = this.props;
        if (srcObject instanceof Blob) {
            // srcObject is supposed to accept a blob but that's not
            // currently supported by the browsers
            props.src = this.blobURL = URL.createObjectURL(srcObject);
        }
        return <video ref={this.setNode} {...props} />
    }

    setNode = (node) => {
        this.node = node;
    }

    setSrcObject() {
        let { srcObject } = this.props;
        if (srcObject) {
            if (!(srcObject instanceof Blob)) {
                this.node.srcObject = srcObject;
            }
            this.node.play();
        }
    }

    componentDidMount() {
        this.setSrcObject();
    }

    componentDidUpdate(prevProps, prevState) {
        let { srcObject } = this.props;
        if (prevProps.srcObject !== srcObject) {
            this.setSrcObject();
        }
    }

    componentWillUnmount() {
        if (this.blobURL) {
            URL.revokeObjectURL(this.blobURL);
        }
    }
}

export {
    LiveVideo as default,
    LiveVideo,
};
