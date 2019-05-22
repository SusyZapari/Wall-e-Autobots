class Engine {
  constructor(engineName, engineId, engineVinId, engineDesignationId, engineVersionId, fuelTypeId, cylinderHeadTypeId){
    this.engineId = engineId;
    this.engineName = engineName;
    this.engineVinId = engineVinId;
    this.engineDesignationId = engineDesignationId;
    this.engineVersionId = engineVersionId;
    this.fuelTypeId = fuelTypeId;          
    this.cylinderHeadTypeId = cylinderHeadTypeId;
  }
}

module.exports = Engine;