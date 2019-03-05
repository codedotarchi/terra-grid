
// Color class for 256 RGB
class GridColor {
    constructor(params) {
        this.r = params.r || 0;
        this.g = params.g || 0;
        this.b = params.b || 0;
    }

    // Sets the rgb color value
    setColor(obj) {
        this.r = obj.r;
        this.g = obj.g;
        this.b = obj.b;
    }

    static copy(color) {
        return new GridColor({
            r: color.r,
            g: color.g,
            b: color.b
        })
    }

    static add(color1, color2) {
        return GridColor.clamp(new GridColor({
            r: color1.r + color2.r,
            g: color1.r + color2.g,
            b: color1.r + color2.b,
        }))
    }
    // Returns the differnece in Color between low and high
    static diff(high, low) {
        return GridColor.clamp(new GridColor({
            r: high.r - low.r,
            g: high.g - low.g,
            b: high.b - low.b
        }))
    }

    static divide(color, scalar) {
        if (scalar && scalar != 0) {
            return new GridColor({
                r: Math.floor(Math.abs(color.r / scalar)),
                g: Math.floor(Math.abs(color.g / scalar)),
                b: Math.floor(Math.abs(color.b / scalar))
            });
        } else {
            return new GridColor();
        }
    }

    static clamp(color) {
        let newColor = GridColor.copy(color);
        if (newColor.r < 0) newColor.r = 0;
        if (newColor.g < 0) newColor.g = 0;
        if (newColor.b < 0) newColor.b = 0;

        if (newColor.r > 255) newColor.r = 255;
        if (newColor.g > 255) newColor.g = 255;
        if (newColor.b > 255) newColor.b = 255;

        return newColor;
    }

    // returns an array of Colors linearly interoplated between low and high Color
    static interval(low, high, numColors) {
        // If numberof colors is not provided or less than 1 return black
        if (!numColors || numColors < 1) {
            return [new GridColor()];
            // If number of colors is 1 return low
        } else if (numColors === 1) {
            return [low];
        } else {
            const colorDiff = GridColor.clamp(GridColor.diff(high, low));

            const colorInterval = [];
            let colorStep = GridColor.copy(low);
            for (let i = 0; i < numColors; i++) {
                colorInterval.push(GridColor.copy(colorStep));
                colorStep = GridColor.add(colorStep, colorDiff);
            }
            if (numColors === colorInterval.length) {
                return colorInterval;
            }
        }
    }

}

class GridCell {
    constructor(index, initialColorIndex, params) {
        this.colors = params.colorArray;
        this.colorIndex = initialColorIndex;
        this.color = this.colors[this.colorIndex];
        setPosition(index, params.divs, params.width, params.height);

        // Used for advancing in different directions
        this.advance = true;
    }

    // Move to next Color in the color list
    nextColor() {
        if (colorIndex < this.colors.length - 1) {
            this.colorIndex += this.colorIndex;
            this.color = this.colors[this.colorIndex];
        }
    }

    // Move to the previous color in the color list
    prevColor() {
        if (colorIndex < 0) {
            this.colorIndex -= this.colorIndex;
            this.color = this.colors[this.colorIndex];
        }
    }

    // Advances the color, independant of direction, if at the end of the list
    // It will advance in the opposite direction
    advanceColor() {
        if ((this.colorIndex === 0) || (this.colorIndex === this.colors.length - 1)) this.advance = !this.advance;
        if (this.advance) {
            this.nextColor();
        } else {
            this.prevColor();
        }
    }

    // Sets the Color relative to the index in the color swatch
    setColor(index) {
        if ((index != this.colorIndex) && (index >= 0) && (index < this.colors.length)) {
            this.colorIndex = index;
            this.color = this.colors[this.colorIndex];
        }
    }

    // helpful for binary switching
    flipColor() {
        this.setColor(1 - this.colorIndex);
    }

    // Returns a valid CSS RGB Color
    getColor() {
        return rgb(this.r, this.g, this.b);
    }
    // Currently only supports equal div in X and Y
    setPosition(index, divs, width, height) {
        this.index = index;
        this.row = Math.floor(index / divs);
        this.col = index % divs;
        this.x = Math.floor(width * col);
        this.y = Math.floor(height * row);
        this.width = width;
        this.height = height;
    }

    // Gets the Cells Drawing Rect for Cell Updates
    getRect() {
        return ({
            x: this.x,
            y: this.y,
            w: this.width,
            h: this.height
        })
    }

    // Gets the Cells rows and columns
    getGridPos() {
        return ({
            row: this.row,
            col: this.col
        })
    }

}

export class GridPainter {

    constructor(params) {
        // GRID PAINTER CONFIG PARAMS
        this.container = (params.container !== undefined) ? params.container : document.createElement('div');
        this.container.className = (params.containerClassName !== undefined) ? params.containerClassName : this.container.className;
        this.canvas = (params.canvas !== undefined) ? params.canvas : document.createElement('canvas');
        this.canvas.className = (params.canvasClassName !== undefined) ? params.canvasClassName : this.canvasClassName;
        this.canvas.width = (params.width !== undefined) ? params.width : 512;
        this.canvas.height = (params.height !== undefined) ? params.height : 512;
        this.divisions = (params.divisions !== undefined) ? params.divisions : 16;

        // External callbacks that can be registered for Events created by the class
        // The GridPainter object will be passed into the callback arguments along with the originial event.
        this.callbacks = (params.callbacks !== undefined) ? params.callbacks : {};
        this.numColors = Array.isArray(params.colors) ? params.colors.length : (params.numColors || 2);
        this.colorLow = params.colorLow ? new GridColor(params.colorLow) : new GridColor({ r: 12, g: 12, b: 12 });
        this.colorHigh = params.colorHigh ? new GridColor(params.colorHigh) : new GridColor({ r: 240, g: 240, b: 240 });
        this.startColor = (params.startColor !== undefined) ? params.startColor : 0;
        this.colors = Array.isArray(params.colors) ? params.colors.map((color) => { return new GridColor(color); }) : GridColor.interval(this.colorLow, this.colorHigh, this.numColors);

        console.log(this.colors);

        this.initPattern = (params.initPattern !== undefined) ? params.initPattern : 'alternate';

        console.log(this.initPattern);

        // SETUP DRAWING CANVAS
        this.container.appendChild(this.canvas);
        this.canvas.gridPainter = this; // TODO Attatch the canvas to the grid ??? 
        this.context = this.canvas.getContext('2d');

        this.cellWidth = this.canvas.width / this.divisions;
        this.cellHeight = this.canvas.height / this.divisions;

        this.gridParams = {
            colorArray: this.colors,
            divs: this.divisions,
            width: this.cellWidth,
            height: this.cellHeight
        }

        this.cells = this.setPattern(this.initPattern);

        console.log(this.cells);


        // TODO -------------------------------------------------------------------

        // SETUP EVENT HANDLERS
        this.setupEventHandlers();

        // RENDER ALL CELLS
        this.renderAllCells();
    }

    // Setsup the event handlers for the GridPainter
    setupEventHandlers() {

        // Canvas On Click
        // ---------------
        this.canvas.onclick = (e) => {
            // Get the mouse coords
            const coord = {
                x: e.pageX - this.canvas.offsetLeft,
                y: e.pageY - this.canvas.offsetTop
            };

            // Get the Cell and Cell Index
            const cellIndex = this.getCellIndex(coord);
            const cell = this.cells[cellIndex];

            // Change the cell Color (Flip if Binary, otherwise advance the color, up or down)
            if (this.numColors === 2) cell.flipColor();
            if (this.numColors > 2) cell.advanceColor();

            // Render the new cell on the canvas
            this.renderCell(cell);

            // Optional Callback
            if (this.callbacks.onclick) this.callbacks.onclick(this, e);
        }

        // TODO ----- ADD OTHER EVENT HANDLERS HERE
    }

    // TODO - Add patterns to this
    // Set the Cells to different patterns
    setPattern(pattern) {
        // Create a new Array 
        let cells = new Array(this.divisions * this.divisions);
        for (let i = 0; i < cells.length; i++) {
            cells.push(new GridCell(i, this.startColor, this.gridParams));
        }

        // TODO move to switch-case...
        if (pattern === 'alternate') {
            cells = cells.map((cell, index) => {
                let row = (Math.floor(index / this.divisions)) % 2;
                let col = (index % this.divisions) % 2;
                if ((!row && !col) || (row && col)) return new GridCell(index, 0, this.gridParams);
                return new GridCell(index, this.numColors - 1, this.gridParams);
            });

        } else if (pattern === 'random') {
            cells = cells.map((cell, index) => {
                let randomIndex = Math.floor(Math.random() * (this.numColors - 1));
                return new GridCell(index, randomIndex, this.gridParams)
            });

        } else { // If No Pattern supplied, return all black grid pattern
            cells = cells.map((cell, index) => {
                new GridCell(index, this.startColor, this.gridParams);
            });
        }

        return cells
    }

    // Gets the Cell row and column from the Canvas Coords
    getCellPosition(coord) {
        let row, col;
        col = Math.floor(this.divisions * coord.x / this.canvas.width);
        row = Math.floor(this.divisions * coord.y / this.canvas.height);
        return { row: row, col: col }
    }

    // Gets the Cell index from the Canvas Coords
    getCellIndex(coord) {
        let pos = this.getCellPosition(coord);
        return pos.row * this.divisions + pos.col;
    }

    // Clear out all cell values (does not rerender the cells)
    setAllCells(colorIndex) {
        this.cells = this.cells.map((cell, index) => {
            return new GridCell(index, colorIndex, this.gridParams);
        })
    }

    // Draws the cell to the canvas based on index
    renderCell(cell) {
        const rect = cell.getRect();
        const color = cell.getColor();

        this.context.fillStyle(color);
        this.context.fillRect(rect.x, rect.y, rect.w, rect.h);
    }

    // Draws/Redraws all cells
    renderAllCells() {
        for (let i = 0; i < this.cells.length; i++) {
            this.renderCell(this.cells[i]);
        }
    }

    // Attatches this to another external container
    attatchTo(container) {
        container.appendChild(this.container);
    }

    // TODO -------------------------------------------------------------------

    downloadGrid() {
        // TODO
    }

    uploadGrid(divisions, values) {
        // TODO
    }

}