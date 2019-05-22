const request = require('request');
const Model = require('./Model');
const SubModel = require('./SubModel');
const Engine = require('./Engine');
const Part = require('./Part');

const API_URL = 'https://api.beta.partstech.com/';
const SUBMODELS = 'taxonomy/vehicles/submodels?year=[year]&make=[make]&model=[model]';
const SEARCH = 'catalog/search';

const modelsPerMaker = new Map();
modelsPerMaker.set('Volkswagen', [
  new Model('Golf', 968),
  new Model('Jetta', 960),
  new Model('Passat', 979),
]);
modelsPerMaker.set('Kia', [
  new Model('Optima', 104),
]);

const makesMap= new Map();
makesMap.set('Volkswagen', 74);
makesMap.set('BMW', 31);
makesMap.set('Kia', 21);

const subModelsPerModel = new Map();
subModelsPerModel.set('Jetta', [
  new SubModel('BASE', 20),
  new SubModel('SE', 49),
  new SubModel('Sport', 141),
]);
subModelsPerModel.set('Golf', [
  new SubModel('BASE', 20),
  new SubModel('COMFORT', 2856),
]);
subModelsPerModel.set('Optima', [
  new SubModel('SX', 3),
]);

const enginesPerSubModel = new Map();
enginesPerSubModel.set('GOLF-BASE', 
  new Engine('', 2041, 1, 1034, 3, 5, 6),
);
enginesPerSubModel.set('GOLF-COMFORT', 
  new Engine('', 2041, 1, 1035, 3, 5, 6),
);
enginesPerSubModel.set('OPTIMA-SX', 
  new Engine('', 56, 7, 1, 3, 5, 6),
);

const partsMap = new Map();
partsMap.set('BUJIA', 7212);
partsMap.set('LIMPIAPARABRISAS', 8852);

module.exports = {

  getModelId: function(make, model) {
    const models = modelsPerMaker.get(make);
    //console.log("models", models);
    
    let modelId = 0;
    if (modelsPerMaker.has(make)) {
      const filteredModels = modelsPerMaker.get(make).filter( filteredModel => { if (filteredModel.modelName == model) return filteredModel.modelId});
      //console.log("filtered model:", filteredModels);
      
      if (filteredModels.length > 0) {
        modelId = filteredModels[0].modelId;
      }
    }
    return modelId;
  },
  getMakeId: function(make) {
    return makesMap.get(make);
  },
  getSubModel: function (year, make, model) {
  
    let modelId = this.getModelId(make, model);
    
    let makeId = this.getMakeId(make);
    console.log("makeId=" + makeId);
    
    const url = API_URL + SUBMODELS.replace('[year]', year).replace('[make]', makeId).replace('[model]', modelId);

    console.log("URL", url);
    
    const options = {  
      url: url,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + process.env.PARTS_API_TOKEN 
      }};
    
    request(options, function(err, res, body) {
      if (!err) {
        console.log('res from bosh:', body)
      } else {
        console.error("Unable to send message:" + err);
      }
    });
  },
  
  getSubModelId(model, subModel) {
    //console.log('subModel:', subModel);
    const subModels = subModelsPerModel.get(model);
    //console.log('subModels:', subModels);
    
    const result =  subModels.filter(
      filteredSubModel => {
        //console.log(filteredSubModel);
        //console.log(filteredSubModel.subModelName.toUpperCase() == subModel.toUpperCase());
        return filteredSubModel.subModelName.toUpperCase() == subModel.toUpperCase()
      }
    );
    //console.log('submodel id',result);
    
    let subModelIdToReturn = 0;
    
    if (result !=='undefined' && result.length >0) {
        subModelIdToReturn = result[0].subModelId;
    }
    
    return subModelIdToReturn;
  },
  searchPart: async function(year, make, model, subModel, partName) {
    const url = API_URL + SEARCH;
    const partId = partsMap.get(partName.toUpperCase());
    const mapKey = (model + "-" + subModel).toUpperCase();
    const engine = enginesPerSubModel.get(mapKey);
    
    console.log("partName:",partName.toUpperCase());
    console.log("partid:",partId);
    console.log("engine:",engine);
    console.log("mapKey:",mapKey);
    
    const requestBody = {
      "searchParams": {
        "vehicleParams": {
          "yearId": parseInt(year),
          "makeId": parseInt(this.getMakeId(make)),
          "modelId": parseInt(this.getModelId(make, model)),
          "subModelId": parseInt(this.getSubModelId(model, subModel)),
          "engineId": parseInt(engine.engineId),
          engineParams: {
            engineVinId: parseInt(engine.engineVinId),
            engineDesignationId: parseInt(engine.engineDesignationId),
            engineVersionId: parseInt(engine.engineVersionId),
            fuelTypeId: parseInt(engine.fuelTypeId),
            cylinderHeadTypeId: parseInt(engine.cylinderHeadTypeId)
          }
        },
        "partTypeIds": [partId]
      }
    }

    const options = {  
      url: url,
      method: 'POST',
      json: requestBody,
      headers: {
        'Authorization': 'Bearer ' + process.env.PARTS_API_TOKEN 
      }};
    
    console.log('search api payload', JSON.stringify(requestBody, null, 2));
    return new Promise((resolve, reject) => {
      request(options, function(err, res, body) {
        if (!err) {
          let result = new Part();

          console.log('body from bosch:', body);
          if (body !== 'undefined' && body.parts.length > 0) {
            result.partId = body.parts[0].partId;
            result.partName = body.parts[0].partName;
            result.imageURL = body.parts[0].images[0].preview;
            result.vehicleName = body.parts[0].vehicleName;
          }

          console.log('res from bosch:', result);
          resolve(result);
        } else {
          console.error("Unable to send message:" + err);
          reject(err);
        }
      });
      
    });
  }
}