class User {
  constructor(
    userId, state = 0, partName = null, makes = null, year = 0, model = null, subModel = null
  ) {
    this.userId = userId;
    this.state = state;
    this.partName = partName;
    this.makes = makes;
    this.year = year;
    this.model = model;
    this.subModel = subModel;
  }
  
  isReadyToOrder() {
    return this.year != null && this.model != null && this.makes != null && this.subModel != null;
  }
}

module.exports = User;