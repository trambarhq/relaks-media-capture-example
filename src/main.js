import { createElement } from 'react';
import { render } from 'react-dom';
import { FrontEnd } from 'front-end';

window.addEventListener('load', initialize);

function initialize(evt) {
    const container = document.getElementById('react-container');
    const element = createElement(FrontEnd, {});
    render(element, container);
}
