// import * as React from 'react';
// import ReactDOM from 'react-dom';
// import * as Terra from '../components/ui.components.jsx'

import * as Viewer from '../js/TopoViewer.js'
import * as Painter from '../js/GridPainter.js'

// Error Message
// if (WEBGL.isWebGLAvailable() === false) {
//     document.body.appendChild(WEBGL.getWebGLErrorMessage());
// }

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

// Default Width/Height
window.terrawidth = 500;

window.terraGrid.init = () => {
    const mainContainer = document.getElementById('mainContainer');
    const painterContainer = document.createElement('div');
    painterContainer.style.float = 'left';
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

    
    // GRID SELECTOR
    //----------------------------------------------------
    window.gridPainter = new Painter.GridPainter({
        container: painterContainer,
        width: window.terrawidth,
        height: window.terrawidth,
        divisions: 16,
        numColors: 8,

        callback: {
            onclick: (gridPainter, event) => { return false }
        }
    });


    // TOPO VIEWER
    //-----------------------------------------------------
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
    }

    canvasContainer.onmouseout = () => {
        // console.log('MOUSE EXIT');
        window.topoModel.isAnimating = false;
        window.topoModel.stopAnimate();
    }

    selectedImage.onclick = () => {
        window.topoModel.cycleMaterial();
    }

    let index = 0;
    for (let imageURL of window.terraGrid.imageURLs) {

        let image = document.createElement('img');
        image.dataset.index = index;
        image.src = imageURL;
        image.style.width = window.terrawidth / window.terraGrid.imageURLs.length + 'px';
        image.style.display = 'block';

        image.onclick = function () {

            // Set the current image pointer and update the image display panel
            window.currImage = window.terraGrid.images[parseInt(this.dataset.index)];
            selectedImage.src = window.terraGrid.imageURLs[parseInt(this.dataset.index)];

            window.topoModel.updateModel(window.currImage);
        }

        imageSelectorContainer.appendChild(image);

        index++;
    }


    // Code to run on document load
    
    // const body = document.getElementById('bodyContainer');
    // const testContainer = document.getElementById('testContainer');


    // const imageURL = window.terraGrid.imageURLs[window.terraGrid.currImageIndex];
    
    // const inputImage = new Image();
    // inputImage.src = imageURL;
    // imgContainer.appendChild(inputImage);

    // const params = {
        
    // };

    // window.topoViewer = new Viewer.TopoViewer(params);
    // window.topoViewer.attatchTo(testContainer);

    // window.topoViewer.updateModel();

    // inputImage.onload = () => {window.topoViewer.updateModel(inputImage);}
    // window.topoViewer.animate(window.topoViewer);

    // window.rtree = ReactDOM.render(<Terra.TopoViewPort3d imageURL={imageURL} params={params} />, body);
}