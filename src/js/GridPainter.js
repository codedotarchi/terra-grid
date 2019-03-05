
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
        });
    }

    static add(color1, color2) {
        return GridColor.clamp(new GridColor({
            r: color1.r + color2.r,
            g: color1.r + color2.g,
            b: color1.r + color2.b,
        }));
    }
    // Returns the differnece in Color between low and high
    static diff(high, low) {
        return GridColor.clamp(new GridColor({
            r: high.r - low.r,
            g: high.g - low.g,
            b: high.b - low.b
        }));
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
            const colorDiff = GridColor.clamp(GridColor.divide(GridColor.diff(high, low), numColors - 1));
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
        this.setPosition(index, params.divs, params.width, params.height);

        // Used for advancing in different directions
        this.advance = true;
    }

    // Move to next Color in the color list
    nextColor() {
        if (this.colorIndex < this.colors.length - 1) {
            this.colorIndex++;
            this.color = this.colors[this.colorIndex];
        }
    }

    // Move to the previous color in the color list
    prevColor() {
        if (this.colorIndex > 0) {
            this.colorIndex--;
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
        function componentToHex(c) {
            var hex = c.toString(16);
            return hex.length == 1 ? '0' + hex : hex;
        }

        return '#' + componentToHex(this.color.r) + componentToHex(this.color.g) + componentToHex(this.color.b);
    }

    // Currently only supports equal div in X and Y
    setPosition(index, divs, width, height) {
        this.index = index;
        this.row = Math.floor(index / divs);
        this.col = index % divs;

        // this.x = this.col * width;
        // this.y = this.row * height;
        // this.width = width;
        // this.height = height;

        this.x = Math.round(width * this.col);
        this.y = Math.round(height * this.row);

        const nextx = Math.round(width * (this.col + 1));
        const nexty = Math.round(height * (this.row + 1));

        this.width = nextx - this.x;
        this.height = nexty - this.y;

        // this.width = (this.col === divs - 1) ? ((this.col + 1) * width - this.x) : Math.floor(width);
        // this.height = (this.row === divs - 1) ? ((this.row + 1) * height - this.y) : Math.floor(height);

    }

    // Gets the Cells Drawing Rect for Cell Updates
    getRect() {
        return ({
            x: this.x,
            y: this.y,
            w: this.width,
            h: this.height
        });
    }

    // Gets the Cells rows and columns
    getGridPos() {
        return ({
            row: this.row,
            col: this.col
        });
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

        this.initPattern = (params.initPattern !== undefined) ? params.initPattern : 'alternate';

        // SETUP DRAWING CANVAS
        this.container.appendChild(this.canvas);
        this.canvas.gridPainter = this; // TODO Attatch the canvas to the grid ??? 
        this.context = this.canvas.getContext('2d');
        // this.context.imageSmoothingQuality = 'high';
        // this.context.translate(0.5, 0.5);

        this.cellWidth = this.canvas.width / this.divisions;
        this.cellHeight = this.canvas.height / this.divisions;

        this.gridParams = {
            colorArray: this.colors,
            divs: this.divisions,
            width: this.cellWidth,
            height: this.cellHeight
        };

        this.cells = this.setPattern(this.initPattern);

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
            if (this.callbacks.onclickCallback !== undefined) this.callbacks.onclickCallback(this, e);
        };

        // TODO ----- ADD OTHER EVENT HANDLERS HERE
    }

    // TODO - Add patterns to this
    // Set the Cells to different patterns
    setPattern(pattern) {
        // Create a new Array 
        let cells = new Array(this.divisions * this.divisions);
        for (let i = 0; i < cells.length; i++) {
            cells[i] = new GridCell(i, this.startColor, this.gridParams);
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
                return new GridCell(index, randomIndex, this.gridParams);
            });

        } else { // If No Pattern supplied, return all black grid pattern
            cells = cells.map((cell, index) => {
                new GridCell(index, this.startColor, this.gridParams);
            });
        }

        return cells;
    }

    // Gets the Cell row and column from the Canvas Coords
    getCellPosition(coord) {
        let row, col;
        col = Math.floor(this.divisions * coord.x / this.canvas.width);
        row = Math.floor(this.divisions * coord.y / this.canvas.height);
        return { row: row, col: col };
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
        });
    }

    // Draws the cell to the canvas based on index
    renderCell(cell) {
        const rect = cell.getRect();
        const color = cell.getColor();

        this.context.fillStyle = color;
        this.context.fillRect(rect.x, rect.y, rect.w, rect.h);
    }

    // Draws/Redraws all cells
    renderAllCells() {
        for (let i = 0; i < this.cells.length; i++) {
            this.renderCell(this.cells[i]);
        }
    }

    // TODO - Clear this up
    getImageDataResample(width, height) {
        var width_source = this.canvas.width;
        var height_source = this.canvas.height;
        width = Math.round(width);
        height = Math.round(height);

        var ratio_w = width_source / width;
        var ratio_h = height_source / height;
        var ratio_w_half = Math.ceil(ratio_w / 2);
        var ratio_h_half = Math.ceil(ratio_h / 2);

        var ctx = this.context;
        var img = ctx.getImageData(0, 0, width_source, height_source);
        var img2 = ctx.createImageData(width, height);

        var data = img.data;
        var data2 = img2.data;

        // Sampling Procedure
        for (var j = 0; j < height; j++) {
            for (var i = 0; i < width; i++) {
                var x2 = (i + j * width) * 4;
                var weight = 0;
                var weights = 0;
                var weights_alpha = 0;
                var gx_r = 0;
                var gx_g = 0;
                var gx_b = 0;
                var gx_a = 0;
                var center_y = (j + 0.5) * ratio_h;
                var yy_start = Math.floor(j * ratio_h);
                var yy_stop = Math.ceil((j + 1) * ratio_h);
                for (var yy = yy_start; yy < yy_stop; yy++) {
                    var dy = Math.abs(center_y - (yy + 0.5)) / ratio_h_half;
                    var center_x = (i + 0.5) * ratio_w;
                    var w0 = dy * dy; //pre-calc part of w
                    var xx_start = Math.floor(i * ratio_w);
                    var xx_stop = Math.ceil((i + 1) * ratio_w);
                    for (var xx = xx_start; xx < xx_stop; xx++) {
                        var dx = Math.abs(center_x - (xx + 0.5)) / ratio_w_half;
                        var w = Math.sqrt(w0 + dx * dx);
                        if (w >= 1) {
                            //pixel too far
                            continue;
                        }
                        //hermite filter
                        weight = 2 * w * w * w - 3 * w * w + 1;
                        var pos_x = 4 * (xx + yy * width_source);
                        //alpha
                        gx_a += weight * data[pos_x + 3];
                        weights_alpha += weight;
                        //colors
                        if (data[pos_x + 3] < 255)
                            weight = weight * data[pos_x + 3] / 250;
                        gx_r += weight * data[pos_x];
                        gx_g += weight * data[pos_x + 1];
                        gx_b += weight * data[pos_x + 2];
                        weights += weight;
                    }
                }
                data2[x2] = gx_r / weights;
                data2[x2 + 1] = gx_g / weights;
                data2[x2 + 2] = gx_b / weights;
                data2[x2 + 3] = gx_a / weights_alpha;
            }
        }

        return data2;
        // //clear and resize canvas
        // if (resize_canvas === true) {
        //     canvas.width = width;
        //     canvas.height = height;
        // } else {
        //     ctx.clearRect(0, 0, width_source, height_source);
        // }

        // //draw
        // ctx.putImageData(img2, 0, 0);
    }

    getImageData() {
        const imgdata = this.context.getImageData(0, 0, 256, 256);
        return imgdata.data;
    }

    // Attatches this to another external container
    attatchTo(container) {
        container.appendChild(this.container);
    }

    // TODO -------------------------------------------------------------------

    // downloadGrid() {
    // TODO
    // }

    // uploadGrid(divisions, values) {
    // TODO
    // }

}