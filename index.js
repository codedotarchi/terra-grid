// import * as tf from './tf.min.js';

console.log(tf.getBackend());
// window.gan = new Pix2Pix([256, 256, 3], 32);
// Pix2Pix Generator
class Pix2Pix {
    constructor(imageShape, numFilters) {
        // # Input shape
        // self.img_rows = 256
        // self.img_cols = 256
        // self.channels = 3
        // self.img_shape = (self.img_rows, self.img_cols, self.channels)
        this.imageShape = imageShape; // ex: [256, 256, 3] = [rows, columns, channels]
        this.imageRows = imageShape[0];
        this.imageColumns = imageShape[1];
        this.imageChannels = imageShape[2];

        // # Configure data loader
        // self.dataset_name = 'facades'
        // self.data_loader = DataLoader(dataset_name = self.dataset_name,
        // img_res = (self.img_rows, self.img_cols))


        // # Calculate output shape of D(PatchGAN)
        // patch = int(self.img_rows / 2 ** 4)
        // self.disc_patch = (patch, patch, 1)
        const patch = Math.floor(this.imageRows / Math.pow(2, 4)); // What is this?
        this.dis_patch = [patch, patch, 1];

        // # Number of filters in the first layer of G and D
        // self.gf = 64
        // self.df = 64
        this.g_filters = numFilters;
        this.d_filters = numFilters;

        // optimizer = Adam(0.0002, 0.5)
        this.learningRate = 0.0002;
        this.beta1 = 0.5;
        this.beta2 = 0.5;
        this.epsilon = 0.5;
        this.adam = tf.train.adam(this.learningRate, this.beta1);

        // # Build and compile the discriminator
        // self.discriminator = self.build_discriminator()
        // self.discriminator.compile(loss = 'mse',
        //     optimizer = optimizer,
        //     metrics = ['accuracy'])
        this.discriminator = this.buildDiscriminator();

        // #-------------------------
        // # Construct Computational
        // #   Graph of Generator
        // #-------------------------

        // # Build the generator
        // self.generator = self.build_generator()
        this.generator = this.buildGenerator();

        // # Input images and their conditioning images
        // img_A = Input(shape = self.img_shape)
        // img_B = Input(shape = self.img_shape)
        const inputA = tf.input({ shape: this.imageShape });
        const inputB = tf.input({ shape: this.imageShape });

        // # By conditioning on B generate a fake version of A
        // fake_A = self.generator(img_B)
        const fakeA = this.generator(inputB); //????

        // # For the combined model we will only train the generator
        // self.discriminator.trainable = False

        // # Discriminators determines validity of translated images / condition pairs
        // valid = self.discriminator([fake_A, img_B])
        const valid = this.discriminator([fakeA, inputB]); //????

        // self.combined = Model(inputs = [img_A, img_B], outputs = [valid, fake_A])
        // self.combined.compile(loss = ['mse', 'mae'],
        //     loss_weights = [1, 100],
        //     optimizer = optimizer)
        this.combined = tf.Model({ inputs: [img_A, img_B], outputs: [valid, fake_A] });
        this.combined.compile({
            optimizer: this.optimizer,
            loss: ['mse', 'mae'],
            lossWeights: [1, 100]
        });
    }
    loadData(imageList) {

    }

    buildGenerator(inputB) {
        // def conv2d(layer_input, filters, f_size = 4, bn = True):
        // """Layers used during downsampling"""
        // d = Conv2D(filters, kernel_size = f_size, strides = 2, padding = 'same')(layer_input)
        // d = LeakyReLU(alpha = 0.2)(d)
        // if bn:
        //     d = BatchNormalization(momentum = 0.8)(d)
        // return d
        function conv2d(layer_input, filters, f_size = 4, bn = true) {
            let d = tf.layers.conv2d({
                kernelSize: f_size,
                filters: filters,
                strides: 2,
                // activation: 'relu',
                // kernelInitializer: 'VarianceScaling', 
                padding: 'same'
            }).apply(layer_input);

            d = tf.layers.leakyReLU({
                alpha: 0.2
            }).apply(d);

            if (bn) d = tf.layers.batchNormalization({ momentum: 0.8 }).apply(d);

            return d;
        }

        // def deconv2d(layer_input, skip_input, filters, f_size = 4, dropout_rate = 0):
        // """Layers used during upsampling"""
        // u = UpSampling2D(size = 2)(layer_input)
        // u = Conv2D(filters, kernel_size = f_size, strides = 1, padding = 'same', activation = 'relu')(u)
        // if dropout_rate:
        //     u = Dropout(dropout_rate)(u)
        // u = BatchNormalization(momentum = 0.8)(u)
        // u = Concatenate()([u, skip_input])
        // return u

        function deconv2d(layer_input, skip_input, filters, f_size = 4, dropout_rate = 0) {
            let u = tf.layers.upSampling2d({
                size: [2, 2]
            }).apply(layer_input);

            u = tf.layers.conv2d({
                kernelSize: f_size,
                filters: filters,
                strides: 1,
                activation: 'relu',
                // kernelInitializer: 'VarianceScaling', 
                padding: 'same'
            }).apply(u);

            if (dropout_rate) u = tf.layers.dropout({
                rate: dropout_rate
            }).apply(u);

            u = tf.layers.batchNormalization({ momentum: 0.8 }).apply(u);

            u = tf.layers.concatenate().apply([u, skip_input]);

            return u;
        }

        // # Image input
        // d0 = Input(shape = self.img_shape)
        const d0 = tf.input({ shape: this.imageShape });

        // # Downsampling
        // d1 = conv2d(d0, self.gf, bn = False)
        // d2 = conv2d(d1, self.gf * 2)
        // d3 = conv2d(d2, self.gf * 4)
        // d4 = conv2d(d3, self.gf * 8)
        // d5 = conv2d(d4, self.gf * 8)
        // d6 = conv2d(d5, self.gf * 8)
        // d7 = conv2d(d6, self.gf * 8)

        const d1 = conv2d(d0, this.g_filters, bn = False);
        const d2 = conv2d(d1, this.g_filters * 2);
        const d3 = conv2d(d2, this.g_filters * 4);
        const d4 = conv2d(d3, this.g_filters * 8);
        const d5 = conv2d(d4, this.g_filters * 8);
        const d6 = conv2d(d5, this.g_filters * 8);
        const d7 = conv2d(d6, this.g_filters * 8);


        // # Upsampling
        // u1 = deconv2d(d7, d6, self.gf * 8)
        // u2 = deconv2d(u1, d5, self.gf * 8)
        // u3 = deconv2d(u2, d4, self.gf * 8)
        // u4 = deconv2d(u3, d3, self.gf * 4)
        // u5 = deconv2d(u4, d2, self.gf * 2)
        // u6 = deconv2d(u5, d1, self.gf)

        const u1 = deconv2d(d7, d6, this.g_filters * 8);
        const u2 = deconv2d(u1, d5, this.g_filters * 8);
        const u3 = deconv2d(u2, d4, this.g_filters * 8);
        const u4 = deconv2d(u3, d3, this.g_filters * 4);
        const u5 = deconv2d(u4, d2, this.g_filters * 2);
        const u6 = deconv2d(u5, d1, this.g_filters);

        // u7 = UpSampling2D(size = 2)(u6)
        // output_img = Conv2D(self.channels, kernel_size = 4, strides = 1, padding = 'same', activation = 'tanh')(u7)
        const u7 = tf.layers.upSampling2d({ size: [2, 2] }).apply(u6);
        const output = tf.layers.conv2d({
            kernelSize: 4,
            filters: this.imageChannels,
            strides: 1,
            activation: 'tanh',
            // kernelInitializer: 'VarianceScaling', 
            padding: 'same'
        }).apply(u7);

        // return Model(d0, output_img)
        return tf.model({ inputs: d0, outputs: output });


    }

    buildDiscriminator() {
        // def d_layer(layer_input, filters, f_size = 4, bn = True):
        // """Discriminator layer"""
        // d = Conv2D(filters, kernel_size = f_size, strides = 2, padding = 'same')(layer_input)
        // d = LeakyReLU(alpha = 0.2)(d)
        // if bn:
        //     d = BatchNormalization(momentum = 0.8)(d)
        // return d

        function dLayer(layer_input, filters, f_size = 4, bn = true) {
            let d = tf.layers.conv2d({
                kernelSize: f_size,
                filters: filters,
                strides: 2,
                // activation: 'relu',
                // kernelInitializer: 'VarianceScaling', 
                padding: 'same'
            }).apply(layer_input);

            d = tf.layers.leakyReLU({
                alpha: 0.2
            }).apply(d);

            if (bn) d = tf.layers.batchNormalization({ momentum: 0.8 }).apply(d);

            return d;
        }

        // img_A = Input(shape = self.img_shape)
        // img_B = Input(shape = self.img_shape)
        input1 = tf.input({ shape: this.imageShape });
        input2 = tf.input({ shape: this.imageShape });

        // # Concatenate image and conditioning image by channels to produce input
        // combined_imgs = Concatenate(axis = -1)([img_A, img_B])
        combinedImgs = tf.layers.concatenate().apply([input1, input2]);

        // d1 = d_layer(combined_imgs, self.df, bn = False)
        // d2 = d_layer(d1, self.df * 2)
        // d3 = d_layer(d2, self.df * 4)
        // d4 = d_layer(d3, self.df * 8)

        const d1 = dLayer(combinedImgs, this.d_filters);
        const d2 = dLayer(d1, this.df * 2);
        const d3 = dLayer(d2, this.df * 4);
        const d4 = dLayer(d3, this.df * 8);

        // validity = Conv2D(1, kernel_size = 4, strides = 1, padding = 'same')(d4)
        const output = tf.layers.conv2d({
            inputShape: [28, 28, 1],
            kernelSize: 4,
            filters: 1,
            strides: 1,
            padding: 'same'
        }).apply(layer_input);

        // return Model([img_A, img_B], validity)
        return tf.model({ inputs: [input1, input2], outputs: output });
    }

    async train(data, epochs, batchSize = 1, sampleInterval = 50) {
        // start_time = datetime.datetime.now()
        let fakeA, dLossReal, dLossFake, dLoss, gLoss;
        // # Adversarial loss ground truths
        // valid = np.ones((batch_size,) + self.disc_patch)
        // fake = np.zeros((batch_size,) + self.disc_patch)
        const valid = tf.ones((batchSize) + this.dis_patch); //??
        const fake = tf.zeros((batchSize) + this.dis_patch); //??


        // for epoch in range(epochs):
        //     for batch_i, (imgs_A, imgs_B) in enumerate(self.data_loader.load_batch(batch_size)):
        for (let epoch in epochs) {
            // ??
            let i;
            for (let imgPair of this.dataLoader.loadBatch(batchSize)) { // ?? Do in ImgPair.A and ImgPair.B
                // TODO
            }
        }

        // # ---------------------
        // #  Train Discriminator
        // # ---------------------

        // # Condition on B and generate a translated version
        // fake_A = self.generator.predict(imgs_B)
        fakeA = this.generator.predict(imgPair.b);

        // # Train the discriminators(original images = real / generated = Fake)
        // d_loss_real = self.discriminator.train_on_batch([imgs_A, imgs_B], valid)
        // d_loss_fake = self.discriminator.train_on_batch([fake_A, imgs_B], fake)
        // d_loss = 0.5 * np.add(d_loss_real, d_loss_fake)
        dLossReal = await this.discriminator.trainOnBatch([imgPair.a, imgPair.b], valid);
        dLossFake = await this.discriminator.trainOnBatch([fakeA, imgPair.b], fake);
        dLoss = 0.5 * tf.addStrict(dLossReal, dLossFake);

        // # -----------------
        // #  Train Generator
        // # -----------------

        // # Train the generators
        // g_loss = self.combined.train_on_batch([imgs_A, imgs_B], [valid, imgs_A])
        gLoss = await this.combined.trainOnBatch([imgPair.a, imgPair.b], [valid, imgPair.a]);

        // elapsed_time = datetime.datetime.now() - start_time
        // # Plot the progress
        console.log('[Epoch ' + epoch + '/' + epochs + '] [Batch ' + batch_i + '/' + self.data_loader.n_batches + '] [D loss: ' + d_loss[0] + ', acc: ' + (100 * d_loss[1]) + '] [G loss: ' + g_loss[0] + '] time: ' + elapsed_time);
        // # If at save interval => save generated image samples
        // if batch_i % sample_interval == 0:
        //     self.sample_images(epoch, batch_i)

        if (batch_i % sampleInterval == 0) {
        }

    }

    static preprocess(image) {
        return tf.tidy(() => {

            //convert to a tensor 
            const tensor = tf.browser.fromPixels(image).toFloat();

            //resize 
            const resized = tf.image.resizeBilinear(tensor, [256, 256]);

            //normalize 
            const offset = tf.scalar(127.5);
            const normalized = resized.div(offset).sub(tf.scalar(1.0));

            //We add a dimension to get a batch shape 
            // const batched = normalized.expandDims(0);
            return normalized;

        });
    }

    static postprocess(tensor, w, h) {
        return tf.tidy(() => {

            //normalization factor  
            const scale = tf.scalar(0.5);

            //unnormalize and sqeeze 
            const squeezed = tensor.squeeze().mul(scale).add(scale);

            //resize to canvas size 
            const resized = tf.image.resizeBilinear(squeezed, [w, h]);

            return resized;
        });
    }

    predict(image) {
        return tf.tidy(() => {

            //get the prediction
            const gImg = model.predict(preprocess(imgData));

            //post process
            const postImg = postprocess(gImg, 512, 512);
            return postImg;

        });
    }
}

// Drawing Grid
class Grid {
    constructor(divisions, canvas) {
        this.divisions = divisions;
        this.cells = new Array(divisions * divisions);
        this.canvas = canvas;
        this.canvas.gridObj = this;
        this.context = canvas.getContext('2d');

        this.canvas.width = 512;
        this.canvas.height = 512;

        this.cellWidth = this.canvas.width / this.divisions;
        this.cellHeight = this.canvas.height / this.divisions;

        this.colWhite = { val: true, r: 255, g: 255, b: 255 };
        this.colBlack = { val: false, r: 0, g: 0, b: 0 };

        this.clearAllCells(this.colWhite);
        this.drawAllCells();

        this.canvas.onclick = function (e) {
            // Get the mouse coords
            let coord = {
                x: e.pageX - this.offsetLeft,
                y: e.pageY - this.offsetTop
            };
            // console.log(coord);

            // Get cell position, flip the color, and set new value
            let pos = this.gridObj.getCellPosition(coord);
            // console.log(pos);

            let col = this.gridObj.flipColor(this.gridObj.getCellCol(pos));
            // console.log(col);

            this.gridObj.setCellValue(pos, col);

            // Draw the new cell on the canvas
            this.gridObj.drawCell(this.gridObj.getCellIndex(pos));

            // callback(this.getPixelData());
        };
    }

    // Flips color between black and white
    flipColor(col) {
        if (col.val) {
            return this.colBlack;
        } else {
            return this.colWhite;
        }
    }

    getCellRect(pos) {
        let xPos = Math.floor(this.cellWidth * pos.x);
        let yPos = Math.floor(this.cellHeight * pos.y);

        return { x: xPos, y: yPos, w: this.cellWidth, h: this.cellHeight };
    }

    getCellPosition(coord, from) {
        let xPos, yPos;
        if (from === 'index') {
            let index = coord;
            xPos = index % this.divisions;
            yPos = Math.floor(index / this.divisions);
        } else {
            xPos = Math.floor(this.divisions * coord.x / this.canvas.width);
            yPos = Math.floor(this.divisions * coord.y / this.canvas.height);
        }

        return { x: xPos, y: yPos };

    }

    getCellIndex(pos) {
        let index = pos.y * this.divisions + pos.x;
        return index;

    }

    getCellCol(pos) {
        return this.cells[this.getCellIndex(pos)];
    }

    // Set a RGB Val = {r, g, b}
    setCellValue(pos, col) {
        this.cells[this.getCellIndex(pos)] = col;
    }

    // Clear out all cell values
    clearAllCells(col) {
        for (let i = 0; i < this.cells.length; i++) {
            this.cells[i] = col;
        }
    }

    // Draws the cell to the canvas based on index
    drawCell(index) {
        let col = this.cells[index];
        this.context.fillStyle = 'rgb(' + col.r + ',' + col.g + ',' + col.b + ')';

        let rect = this.getCellRect(this.getCellPosition(index, 'index'));
        this.context.fillRect(rect.x, rect.y, rect.w, rect.h);
    }

    // Draws/Redraws all cells
    drawAllCells() {
        for (let i = 0; i < this.cells.length; i++) {
            this.drawCell(i);
        }
    }

    // TODO
    downloadGrid() {
        let grid = {};
        grid.divisions = this.divisions;
    }

    // TODO
    uploadGrid(divisions, values) {

    }

}


// async function setup() {
// }


// function loadImages(container, path, images) {
//     let img;
//     for (let i = 1; i <= 400; i++) {
//         // Show all of the images
//         img = document.createElement('img');
//         img.src = path + i + '.jpg';
//         container.appendChild(img);
//         images[i - 1] = img;
//     }
// }

// window.model;

// async function loadModel() {
//     await tf.loadLayersModel('./model/model.json').then((result) => {
//         window.model = result;
//     } );
// }

// Loads the Model from this button
async function loadModel(button) {
    button.className = 'tab model downloading';
    await tf.loadLayersModel(button.modelPath).then((model) => {
        button.model = model;
        button.isLoaded = true;
        button.className = 'tab model downloaded';
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

// Run This Function after the Document Loads
/*document.onload =  */function init() {
    // model names
    let modelNames = ['256_grid8_bin',
        '256_grid8_grad',
        '256_grid16_bin',
        '256_grid16_grad'];

    window.modelButtons = [];


    for (let i = 0; i < modelNames.length; i++) {

        let modelPath = './models/' + modelNames[i] + '_tfjs/model.json';
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
}

init();





// window.dataContainer = document.getElementsByClassName('container')[0];
// window.dataset = new Array(400);
// window.images = new Array(400);

// // document.onload = function () {
// //     for (let i = 1; i <= 400; i++) {
// //         window.dataset.push(Pix2Pix.preprocess(window.images[i - 1]));
// //     }
// // };

// loadImages(window.dataContainer, './datasets/facades/train/', window.images);


