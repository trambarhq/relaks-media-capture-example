import React, { createElement } from 'react';
import { render } from 'react-dom';
import { FrontEnd } from 'front-end';

window.addEventListener('load', initialize);

function initialize(evt) {
    let container = document.getElementById('react-container');
    let element = createElement(FrontEnd, {});
    render(element, container);
}
