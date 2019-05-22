const responses = require('./wall-e-responses');

class WallEResponse {
  constructor(message = responses.DEFAULT_RESPONSE_MESSAGE) {
    this.message = message;
  }
}

module.exports = WallEResponse;