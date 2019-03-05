// import * as React from 'react';
// import ReactDOM from 'react-dom';
// import * as Terra from '../components/ui.components.jsx'
import '@babel/polyfill';
import * as Viewer from '../js/TopoViewer.js';
import * as Painter from '../js/GridPainter.js';
import * as tf from '../lib/tf.min.js';

console.log(tf.getBackend());

// Error Message
// if (WEBGL.isWebGLAvailable() === false) {
//     document.body.appendChild(WEBGL.getWebGLErrorMessage());
// }
// Default Width/Height
window.terrawidth = 800; // TODO - Set to determine this on windowSize

// Global APp namespace
window.terraGrid = {};

// Test Images
window.terraGrid.currImageIndex = 0;
window.terraGrid.imageURLs = ['./test/img/1-outputs.png',
    './test/img/2-outputs.png',
    './test/img/3-outputs.png',
    './test/img/4-outputs.png',
    './test/img/5-outputs.png',
    './test/img/6-outputs.png'];
window.terraGrid.images = window.terraGrid.imageURLs.map((imageURL) => {
    let image = document.createElement('img');
    image.src = imageURL;
    image.width = 256;
    image.height = 256;
    return image;
});

// MODEL SELECT BUTTONS
let modelNames = ['256_grid8_bin',
    '256_grid8_grad',
    '256_grid16_bin',
    '256_grid16_grad'];

window.modelButtons = [];

// Loads the Model from this button
async function loadModel(button) {
    button.className = 'tab model downloading';
    await tf.loadLayersModel(button.modelPath).then((model) => {
        button.model = model;
        button.isLoaded = true;
        button.className = 'tab model downloaded';
    }, (error) => {
        console.log('fuckThis: ' + error);
    });
}

// Set this Button's Model to the current active Model
function setActiveModel(button) {
    // Set all Buttons to inactive except this button
    for (let i = 0; i < window.modelButtons.length; i++) {
        // Set Inactive
        if (window.modelButtons[i].className === 'tab model downloaded active') {
            window.modelButtons[i].className = 'tab model downloaded';
        }
    }
    button.className = 'tab model downloaded active';

    window.activeModel = button.model;
}


window.terraGrid.init = () => {
    // Set up Model Buttons
    for (let i = 0; i < modelNames.length; i++) {

        let modelPath = '../models/' + modelNames[i] + '_tfjs/model.json';
        let modelButton = document.getElementById(modelNames[i]);

        //Set up model Buttons
        window.modelButtons.push(modelButton);
        modelButton.isLoaded = false;
        modelButton.modelPath = modelPath;

        modelButton.onclick = function () {
            if (this.isLoaded) {
                // Load the Model
                setActiveModel(this);
            } else {
                loadModel(this);
            }
        };
    }

    const mainContainer = document.getElementById('mainContainer');
    const painterContainer = document.createElement('div');

    painterContainer.style.float = 'left';
    painterContainer.style.border = '2px solid #3e3e3e';

    const selectedImage = document.createElement('img');
    selectedImage.style.width = window.terrawidth + 'px';
    selectedImage.style.float = 'left';
    // const imageSelectorContainer = document.createElement('div');
    // imageSelectorContainer.style.float = 'left';
    const canvasContainer = document.createElement('div');
    canvasContainer.style.float = 'left';

    // Add to document
    mainContainer.appendChild(painterContainer);
    mainContainer.appendChild(selectedImage);
    // mainContainer.appendChild(imageSelectorContainer);
    mainContainer.appendChild(canvasContainer);

    // TOPO VIEWER
    // -----------------------------------------------------
    window.topoModel = new Viewer.TopoViewer({
        container: canvasContainer,
        backgroundColor: 0x1e1e1e,
        width: window.terrawidth,
        height: window.terrawidth,
        isBakedLighting: false,
        heightScale: 8
    });

    canvasContainer.onmouseenter = () => {
        // console.log('MOUSE ENTER');
        window.topoModel.isAnimating = true;
        window.topoModel.animate();
        // console.log('ANNIMATION STARTED');
    };

    canvasContainer.onmouseout = () => {
        // console.log('MOUSE EXIT');
        window.topoModel.isAnimating = false;
        window.topoModel.stopAnimate();
    };

    // GRID SELECTOR
    //----------------------------------------------------
    window.gridPainter = new Painter.GridPainter({
        container: painterContainer,
        width: window.terrawidth,
        height: window.terrawidth,
        divisions: 8,
        numColors: 4,
        colorLow: { r: 30, g: 30, b: 30 },
        colorHigh: { r: 250, g: 250, b: 250 },

        callbacks: {
            onclickCallback: (gridPainter, event) => {
                // TODO - This is where the TF update takes place
                window.topoModel.updateModel(gridPainter.getImageDataResample(256, 256));
            }
        }
    });


};