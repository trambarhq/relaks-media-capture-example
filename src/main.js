import React, { createElement } from 'react';
import { render } from 'react-dom';
import { FrontEnd } from 'front-end';

window.addEventListener('load', initialize);

function initialize(evt) {
    let appContainer = document.getElementById('app-container');
    if (!appContainer) {
        throw new Error('Unable to find app element in DOM');
    }
    let appElement = createElement(FrontEnd, {});
    render(appElement, appContainer);
}
