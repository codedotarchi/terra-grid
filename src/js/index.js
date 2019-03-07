// import * as React from 'react';
// import ReactDOM from 'react-dom';
// import * as Terra from '../components/ui.components.jsx'
// import '@babel/polyfill';
// import * as Viewer from '../js/TopoViewer.js';
// import * as Painter from '../js/GridPainter.js';
// import * as tf from '../lib/tf.min.js';

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
// window.terraGrid.imageURLs = ['./test/img/1-outputs.png',
//     './test/img/2-outputs.png',
//     './test/img/3-outputs.png',
//     './test/img/4-outputs.png',
//     './test/img/5-outputs.png',
//     './test/img/6-outputs.png'];
// window.terraGrid.images = window.terraGrid.imageURLs.map((imageURL) => {
//     let image = document.createElement('img');
//     image.src = imageURL;
//     image.width = 256;
//     image.height = 256;
//     return image;
// });

// // MODEL SELECT BUTTONS
// let modelNames = ['256_grid8_bin',
//     '256_grid8_grad',
//     '256_grid16_bin',
//     '256_grid16_grad'];

// window.modelButtons = [];

// // Loads the Model from this button
// async function loadModel(button) {
//     button.className = 'tab model downloading';
//     await tf.loadLayersModel(button.modelPath).then((model) => {
//         console.log(model);
//         button.model = model;
//         button.isLoaded = true;
//         button.className = 'tab model downloaded';
//     }, (error) => {
//         console.log('fuckThis: ' + error);
//     });
// }

// // Set this Button's Model to the current active Model
// function setActiveModel(button) {
//     // Set all Buttons to inactive except this button
//     for (let i = 0; i < window.modelButtons.length; i++) {
//         // Set Inactive
//         if (window.modelButtons[i].className === 'tab model downloaded active') {
//             window.modelButtons[i].className = 'tab model downloaded';
//         }
//     }
//     button.className = 'tab model downloaded active';

//     window.activeModel = button.model;
// }

// function setupButtons() {
//     // Set up Model Buttons
//     for (let i = 0; i < modelNames.length; i++) {

//         let modelPath = '../models/' + modelNames[i] + '_tfjs/model.json';
//         let modelButton = document.getElementById(modelNames[i]);

//         //Set up model Buttons
//         window.modelButtons.push(modelButton);
//         modelButton.isLoaded = false;
//         modelButton.modelPath = modelPath;

//         modelButton.onclick = function () {
//             if (this.isLoaded) {
//                 // Load the Model
//                 setActiveModel(this);
//             } else {
//                 loadModel(this);
//             }
//         };
//     }
// }

function setupContainers() {
    window.mainContainer = document.getElementById('mainContainer');
    window.painterContainer = document.createElement('div');

    window.painterContainer.style.float = 'left';
    window.painterContainer.style.border = '2px solid #3e3e3e';

    window.selectedImage = document.createElement('img');
    window.selectedImage.style.width = window.terrawidth + 'px';
    window.selectedImage.style.float = 'left';
    // const imageSelectorContainer = document.createElement('div');
    // imageSelectorContainer.style.float = 'left';
    window.canvasContainer = document.createElement('div');
    window.canvasContainer.style.float = 'left';

    // Add to document
    window.mainContainer.appendChild(window.painterContainer);
    window.mainContainer.appendChild(window.selectedImage);
    // mainContainer.appendChild(imageSelectorContainer);
    window.mainContainer.appendChild(window.canvasContainer);
}

window.terraGrid.init = () => {
    setupButtons();
    setupContainers();

    // // TOPO VIEWER
    // // -----------------------------------------------------
    // window.topoModel = new Viewer.TopoViewer({
    //     container: window.canvasContainer,
    //     backgroundColor: 0x1e1e1e,
    //     width: window.terrawidth,
    //     height: window.terrawidth,
    //     isBakedLighting: false,
    //     heightScale: 8
    // });

    // window.canvasContainer.onmouseenter = () => {
    //     // console.log('MOUSE ENTER');
    //     window.topoModel.isAnimating = true;
    //     window.topoModel.animate();
    //     // console.log('ANNIMATION STARTED');
    // };

    // window.canvasContainer.onmouseout = () => {
    //     // console.log('MOUSE EXIT');
    //     window.topoModel.isAnimating = false;
    //     window.topoModel.stopAnimate();
    // };

    // var Painter = {};
    // Painter.GridPainter = GridPainter;

    // GRID SELECTOR
    //----------------------------------------------------
    window.gridPainter = new GridPainter({
        container: window.painterContainer,
        width: window.terrawidth,
        height: window.terrawidth,
        divisions: 8,
        numColors: 4,
        colorLow: { r: 30, g: 30, b: 30 },
        colorHigh: { r: 250, g: 250, b: 250 },

        callbacks: {
            onclickCallback: (gridPainter, event) => {
                // TODO - This is where the TF update takes place
                // window.topoModel.updateModel(gridPainter.getImageDataResample(256, 256));
                console.log('Sending Model');


                window.data = gridPainter.getImageDataResample(256, 256);

                // Preprocess
                window.inputTensor = tf.browser.fromPixels(window.data, 3).toFloat();
                window.resized = tf.image.resizeBilinear(window.inputTensor, [256, 256]);
                const offset = tf.scalar(127.5);
                window.normalized = window.resized.div(offset).sub(tf.scalar(1.0));
                window.expanded = window.normalized.expandDims();

                //get the prediction
                window.prediction = window.activeModel.predict(window.expanded);

                // Postprocess
                const scale = tf.scalar(0.5);
                window.squeezed = window.prediction.squeeze().mul(scale).add(scale);
                window.resized = tf.image.resizeBilinear(window.squeezed, [window.terrawidth, window.terrawidth]);

                // Output
                const outputCanvas = document.getElementById('outputImage');
                outputCanvas.width = outputCanvas.height = window.terrawidth;
                window.outputImage = tf.browser.toPixels(window.resized, outputCanvas);

                //post process
                // const postImg = postprocess(gImg, 512, 512);

            }
        }
    });


};