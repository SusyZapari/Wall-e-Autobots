//const tf = require('@tensorflow/tfjs')
const tf = require('@tensorflow/tfjs-node');

global.fetch = require('node-fetch');
const http = require("https");
const fs = require('fs');
const jpeg = require('jpeg-js');

const NUMBER_OF_CHANNELS = 3

const mobilenet = require('@tensorflow-models/mobilenet');

module.exports = {
  loadModel: async function(path) {
    const mn = await mobilenet.load();
    return mn
  },
  readImage: async function (path) {
    const tempFileName = "temp.jpg"
    let res = await this.download(path, tempFileName);
    const buf = fs.readFileSync(tempFileName)
    const pixels = jpeg.decode(buf, true)
    return pixels
  },
  download: function(url, dest) {
    return new Promise((resolve, reject) => {
      http.get(url, (res) => {
        if (res.statusCode !== 200) {
          let err = new Error('File couldn\'t be retrieved');
          err.status = res.statusCode;
          return reject(err);
        }
        let chunks = [];
        res.setEncoding('binary');
        res.on('data', (chunk) => {
          chunks += chunk;
        }).on('end', () => {
          let stream = fs.createWriteStream(dest);
          stream.write(chunks, 'binary');
          stream.on('finish', () => {
            resolve('File Saved !');
          });
          res.pipe(stream);
        })
      }).on('error', (e) => {
        console.log("Error: " + e);
        reject(e.message);
      });
    })
  },
  
  imageByteArray: function (image, numChannels) {
    const pixels = image.data
    const numPixels = image.width * image.height;
    const values = new Int32Array(numPixels * numChannels);
    
    for (let i = 0; i < numPixels; i++) {
      for (let channel = 0; channel < numChannels; ++channel) {
        values[i * numChannels + channel] = pixels[i * 4 + channel];
      }
    }

    return values
  },
  
  imageToInput: function (image, numChannels) {
    const values = this.imageByteArray(image, numChannels)
    const outShape = [image.height, image.width, numChannels];
    const input = tf.tensor3d(values, outShape, 'int32');
    return input
  },
  
  loadModel: async function(path) {
    const mn = await mobilenet.load();
    return mn;
  },
  
  imageRecognition: async function(imageUrl) {
    const image = await this.readImage(imageUrl)
    const input = this.imageToInput(image, NUMBER_OF_CHANNELS)
    const mn_model = await this.loadModel()
    const predictions = await mn_model.classify(input)
    console.log('classification results:\n', predictions)
    return predictions;
  }
};
