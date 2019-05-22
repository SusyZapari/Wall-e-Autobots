const WallEResponse = require('./WallEResponse');
const constants = require('./constants');
const wallEGreetings = require('./wall-e-greetings');
const wallEResponses = require('./wall-e-responses');
const NLPResponse = require('./NLPResponse');
const firebaseService = require('./firebase-service');
const partsApiService = require('./parts-api-service');
const User = require('./User');

const STATE_IDLE = 0;
const STATE_GREETING = 1;
const STATE_GOT_HELP_REQUEST = 2;
const STATE_GOT_ASK_FOR_PARTS_REQUEST = 3;
const STATE_RECEIVING_PART_INFO = 4;
const STATE_RECEIVING_DETAILED_PART_INFO = 5;
const STATE_WAITING_FOR_PURCHASE_CONFIRMATION = 6;
const STATE_PAYMENT_RECEIVED = 7;
const STATE_GETTING_SHIPPING_DETAILS = 8;
const STATE_OPTION_NOT_RECOGNIZED = 9;
const STATE_RECEIVING_PHONE_NUMBER = 10;
const STATE_CALLING_USER = 1;

const INTENT_GREETING = 'GREETING';

const REPLACE_REGEX_PART_NAME = '<auto_part>';
const REPLACE_REGEX_PART_NAME_DETAILS = '<auto_part_details>';

const intentToStateRelationship = new Map();

intentToStateRelationship.set('GREETING', STATE_GREETING);
intentToStateRelationship.set('GOT_HELP_REQUEST', STATE_GOT_HELP_REQUEST);
intentToStateRelationship.set('GOT_ASK_FOR_PARTS_REQUEST', STATE_GOT_ASK_FOR_PARTS_REQUEST);
intentToStateRelationship.set('RECEIVING_PART_INFO', STATE_RECEIVING_PART_INFO);

module.exports = {
  processTextMessage: function (received_message, userSession) {
    let nlpResponse;
    if (!received_message.nlp.erros) {
      nlpResponse = this.parseIntent(received_message.nlp.entities, userSession);
    } else {
      nlpResponse = new NLPResponse();
    }
    
    return nlpResponse;
  },
  
  parseIntent: function(entities, userSession) {
    let response = new WallEResponse();
    let isAskingForParts = false;
    let partName;
    let intentType;
    
    const currentState = this.getCurrentState(entities, userSession);
    console.log("currentState:" + currentState);
    response = this.processCurrentState(entities, currentState, userSession);
    
    return response;
  },
  
  getCurrentState: function(entities, user) {
    let currentState = STATE_IDLE;
    
    // Identify whats the user intent
    if (entities.hasOwnProperty('auto_part')) {
      currentState = STATE_GOT_ASK_FOR_PARTS_REQUEST;
      user.partName = entities.auto_part[0].value;
    }
    else if (entities.hasOwnProperty('makes')) {
      currentState = STATE_RECEIVING_PART_INFO;
      user.makes = entities.makes[0].value;
    }
    else if (entities.hasOwnProperty('year')) {
      currentState = STATE_RECEIVING_PART_INFO;
      user.year = entities.year[0].value;
    }
    else if (entities.hasOwnProperty('model')) {
      currentState = STATE_RECEIVING_PART_INFO;
      user.model = entities.model[0].value;
    }
    else if (entities.hasOwnProperty('sub_model')) {
      currentState = STATE_RECEIVING_PART_INFO;
      user.subModel = entities.sub_model[0].value;
    }
    else {
      if (entities.hasOwnProperty('intent')) {
        let intentType = entities.intent[0].value;
        console.log("intentType:"+intentType);
        currentState = intentToStateRelationship.get(intentType);
      }
    }
    
    return currentState;
  },
  
  processCurrentState: async function(entities, currentState, user) {
    let response = new WallEResponse();
    
    switch(currentState){
      case STATE_GREETING:
        response.message = wallEResponses.GREETING_RESPONSE;
        user = new User(user.userId, STATE_GOT_HELP_REQUEST);
        //user.state = STATE_GOT_HELP_REQUEST;
        break;
      case STATE_GOT_HELP_REQUEST:
        response.message = wallEResponses.GOT_HELP_REQ_RESPONSE;
        user.state = STATE_GOT_ASK_FOR_PARTS_REQUEST;
        break;
      case STATE_GOT_ASK_FOR_PARTS_REQUEST:
        const partName = entities.auto_part[0].value;
        response.message = wallEResponses.GOT_ASK_FOR_PARTS_REQ_RESPONSE.replace(REPLACE_REGEX_PART_NAME, partName);
        user.state = STATE_RECEIVING_PART_INFO;
        user.partName = partName;
        break;
      case STATE_RECEIVING_PART_INFO:
        let message;
        let state = STATE_RECEIVING_DETAILED_PART_INFO;
        
        if (user.year == null) {
          message = wallEResponses.RECEIVING_PART_INFO_RESPONSE_MISSING_YEAR;
          state = STATE_RECEIVING_PART_INFO;
        }
        if (user.subModel == null) {
          message = wallEResponses.RECEIVING_PART_INFO_RESPONSE_MISSING_SUB_MODEL;
          state = STATE_RECEIVING_PART_INFO;
        }
        if (user.model == null) {
          message = wallEResponses.RECEIVING_PART_INFO_RESPONSE_MISSING_MODEL;
          state = STATE_RECEIVING_PART_INFO;
        }
        if (user.makes == null) {
          message = wallEResponses.RECEIVING_PART_INFO_RESPONSE_MISSING_MAKES;
          state = STATE_RECEIVING_PART_INFO;
        }
        
        if (user.isReadyToOrder()) {
          console.log("Calling parts api with part name =", user.partName);
          const part = await partsApiService.searchPart(user.year, user.makes, user.model, user.subModel, user.partName);
          console.log("Part from bosch;", part);
          message = wallEResponses.RECEIVING_PART_INFO_RESPONSE_COMPLETE.replace('<part_details>', part.partId + " " + part.partName + " " + part.vehicleName);
        }
      
        response.message = message;
        user.state = state;
        break;
      case STATE_RECEIVING_DETAILED_PART_INFO:
        response.message = wallEResponses.RECEIVING_DETAILED_PART_INFO_RESPONSE.replace(REPLACE_REGEX_PART_NAME, user.partName);
        user.state = STATE_WAITING_FOR_PURCHASE_CONFIRMATION;
        break;
    }
    return new NLPResponse(response, user);
  }
}