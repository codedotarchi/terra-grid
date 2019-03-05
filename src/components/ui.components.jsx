import * as React from 'react';
import * as ReactDOM from 'react-dom';
// import * as tf from 'tensorflow/tfjs';
import * as Three from 'three';
import * as Viewer from '../js/TopoViewer.js'


// This set of controls performs orbiting, dollying (zooming), and panning.
// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
//
//    Orbit - left mouse / touch: one-finger move
//    Zoom - middle mouse, or mousewheel / touch: two-finger spread or squish
//    Pan - right mouse, or left mouse + ctrl/meta/shiftKey, or arrow keys / touch: two-finger move






// import { updateExpressionWithTypeArguments } from 'typescript';

// Global Terra Namespace
// window.terra = window.terra ? window.terra : {};

// Global Terra Data Structures and Functions
// terra.updateScene //todo
// terra.blankImage //todo

// Output
export class TopoViewPort3d extends React.Component {
    constructor(props) {
        super(props);
        this.state = { isActive: true };
        this.topoViewer = new Viewer.TopoViewer(this.props.params);
    }

    componentDidMount() {
        this.container.appendChild(this.topoViewer.getDOMElement());
    }

    render() {
        this.topoViewer.updateInputData(this.props.imageURL);
        console.log('RENDERED: TOPO VIEWER');
        return <div ref={thisNode => this.container=thisNode} />
        // return <div dangerouslySetInnerHTML={{ __html: this.state.contents }} />
        
    }
}


// window.terra.TopoViewer = new TopoViewer();

// React Components for the Terra Grid
// export class App extends React.Component {
//     // this.props.modelNames
//     // this.props.grid
//     // this.props.color
//     constructor(props) {
//         super(props);
//         this.state = {
//             models: {},
//             currModel: false,
//         };

//         this.handleDownloaded = this.handleDownloaded.bind(this);
//         this.handleActive = this.handleActive.bind(this);
//     }

//     handleDownloaded(modelName, model) {
//         if (modelName && model) {
//             this.setState({
//                 modelName: model,
//                 currModel: model
//             });
//         }

//     }

//     handleActive(modelName) {
//         if (modelName && this.state.models[modelName]) {
//             this.setState({ currModel: this.state.models[modelName] });
//         }
//     }
//     // TODO
//     render() {
//         return (<div>
//             <ModelSelectBar modelNames={this.props.modelNames} onModelDownloaded={this.handleDownloaded} onModelActive={this.handleActive} />
//             <ModelDisplayContainer grid={this.props.grid} color={this.props.color} model={this.state.currModel} />
//         </div>
//         )
//     }
// }

// Model Section
// class ModelSelectBar extends React.Component {
//     // this.props.modelNames
//     // this.props.onModelDownloaded
//     // this.props.onModelActive

//     constructor(props) {
//         super(props);
//     }

//     render() {
//         const modelButtons = this.props.modelNames.map((name) =>
//             <ModelSelectButton key={name} modelName={name} onModelActive={this.props.onModelActive} onModelDownloaded={this.props.onModelDownloaded} />);

//         return <div className='tab model'>
//             <h2>Load and Select one of the following models</h2>
//             {modelButtons}
//         </div>
//     }
// }

// Model Selection Button
// class ModelSelectButton extends React.Component {
//     // this.props.modelName
//     // this.props.onModelDownloaded
//     // this.props.onModelActive

//     constructor(props) {
//         super(props);

//         this.state = {
//             isActive: false,
//             isDownloading: false,
//             isDownloaded: false
//         };

//         this.handleClick = this.handleClick.bind(this);
//     }

//     async handleClick() {
//         // Start downloading the model
//         if (!this.state.isDownloaded && !this.state.isDownloaded) {
//             this.setState({ isDownloading: true });
//             const modelPath = '../models/' + this.props.modelName + '/model.json'
//             await tf.loadLayersModel(modelPath).then((model) => {
//                 this.props.onModelDownloaded(this.props.modelName, model);
//                 this.setState({ isDownloading: false, isDownloaded: true });
//             });
//             // The Model is downloaded so toggle active
//         } else {
//             this.setState({ isActive: !this.state.isActive });
//             this.onModelActive(this.props.modelName);
//         }
//     }

//     render() {
//         const className = 'tab model';
//         if (this.state.isActive) className += ' active';
//         if (this.state.isDownloading) className += ' downloading';
//         if (this.state.isDownloaded) className += ' downloaded';
//         return (
//             <button className={className} id={this.props.modelName} onClick={this.handleClick}>
//                 {this.props.modelName}
//             </button>
//         );
//     }
// }


// Model Input and Display
// class ModelDisplayContainer extends React.Component {
//     // this.props.grid
//     // this.props.color
//     // this.props.model

//     constructor(props) {
//         super(props);
//         this.state = {
//             inputImageURL: new Image(),
//             returnImageURL: new Image(),
//         };

//         this.handleTensorChange = this.handleTensorChange.bind(this);
//         this.handleTensorChange = this.handleTensorChange.bind(this);
//     }

//     async handleTensorChange(image) {

//         this.setState({ imputImage: image });

//         await this.props.model.predict(preprocess(image)).then((result) => {
//             if (result) {
//                 const result = postprocess(result);
//                 this.setState({ returnImageURL: result });
//                 this.handleReturnChange(result);
//             } else {
//                 console.log('no can do...');
//             }
//         });
//     }

//     // handleResultChange(image) {
//     //     terra.updateScene(image);
//     //     this.setState({ modelScene: terra.updateScene(this.state.modelScene, image) });
//     // }

//     render() {
//         return (
//             <div className=' '>
//                 <InputTensorGrid gridSpacing={this.props.grid} color={this.props.color} onImageChange={this.handleTensorChange} />
//                 <ReturnTensorImage image={this.state.returnImageURL} />
//                 <TopoViewPort3d image={this.state.returnImageURL} />
//             </div>
//         );
//     }
// }

// Input
// class InputTensorGrid extends React.Component {
//     // this.props.grid
//     // this.props.color

//     constructor(props) {
//         super(props);

//         const canvas = <canvas onClick={this.handleClick} />;
//         const context = canvas.get2dContest; //todo
        
//         this.grid = new Grid(this.props.gridSpacing, this.props.color);

//         this.state = {
//             gridSpacing: this.props.gridSpacing,
//             color: this.props.color,
//             grid: grid,
//             canvas: <canvas onClick={this.handleClick} />,
//             context: context
//         };
//     }

//     handleClick(e) {
//         this.state.grid.changeCell(this.canvas) // todo : maybe needs context
//         this.props.onImageChange(this.getImage());
//     }

//     render() {
//         // Adjust the Grid Size
//         if (!(this.props.gridSpacing === this.state.gridSpacing)) {
//             // todo
//             this.state.grid.changeSpacing(this.props.gridSpacing);
//             this.props.onImageChange(this.getImage());
//         }

//         // Adjust Color Depth
//         if (!(this.props.color === this.state.color)) {
//             // todo
//             this.state.grid.changeColor(this.props.color);
//             this.props.onImageChange(this.getImage());
//         }

//         return this.canvas;
//     }
// }

// Return
// class ReturnTensorImage extends React.Component {
//     constructor(props) {
//         super(props);
//         this.state = { isActive: true };
//     }

//     render() {
//         return (<div>
//             <h3>Prediction</h3>
//             <img src={this.props.image} />
//         </div>
//         )
//     }
// }






