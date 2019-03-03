'use strict';

const e = React.createElement;

class InputPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            colorDepth: 1,
            gridSize: 8
        }
    }

    render() {
        console.log('rendering the Input Panel');

        return e(
            'canvas',
            {
                onClick: () => this.setState({
                    coloDepth: this.state.colorDepth + 1,
                    gridSize: ((prev) => {
                        if (prev === 8) {
                            this.state.gridSize = 16;
                        } else {
                            this.state.gridSize = 8;
                        }
                    })(this.gridSize)
                })
            },
            null);
    }
}

class CloseButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = { isCLosed: false };
    }

    render() {
        return 'fuck this'
    }
}
