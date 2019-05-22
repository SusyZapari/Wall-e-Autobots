class Part {  
  constructor(partId = null, partName = null, imageURL = null, vehicleName = null) {
    this.partId = partId;
    this.partName = partName;
    this.imageURL = imageURL;
    this.vehicleName = vehicleName;
  }
}

module.exports = Part;