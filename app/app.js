/*
 * Starter Project for Messenger Platform Quick Start Tutorial
 *
 * Remix this as the starting point for following the Messenger Platform
 * quick start tutorial.
 *
 * https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start/
 *
 */

'use strict';

// Imports dependencies and set up http server
const 
  request = require('request'),
  express = require('express'),
  body_parser = require('body-parser'),
  app = express().use(body_parser.json()); // creates express http server

const imageClassifierService = require('./image-classifier-service');
const messengerService = require('./messenger-service');
const nlpService = require('./nlp-service');
const firebaseService = require('./firebase-service');

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {  

  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Get the webhook event. entry.messaging is an array, but 
      // will only ever contain one event, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);
      
      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('Sender PSID: ' + sender_psid);
      
      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);        
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
    });

    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {
  
  /** UPDATE YOUR VERIFY TOKEN **/
  const VERIFY_TOKEN = "myVerifyToken";
  
  // Parse params from the webhook verification request
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Check if a token and mode were sent
  if (mode && token) {
  
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});


// Handles messages events
async function handleMessage(sender_psid, received_message) {
  let response;
  
  console.log("NLP: ", JSON.stringify(received_message.nlp, null, 2));
  
  let userSession = await firebaseService.getUserSession(sender_psid);
  
  //console.log("user:", userSession);
     
  // Check if the message contains text
  if (received_message.text) {
    let nlpResponse = await nlpService.processTextMessage(received_message, userSession);
    // Create the payload for a basic text message
    response = {
      "text": nlpResponse.wallEResponse.message
    }

    userSession = nlpResponse.user;
  } else if (received_message.attachments) {
    // Gets the URL of the message attachment
    let image_url = received_message.attachments[0].payload.url;
    const result = await imageClassifierService.imageRecognition(image_url);
    //const recognizedCategory = result[0].className;
    const recognizedCategories = result.map(result => result.className);
    console.log("recognizedCategories", recognizedCategories);
    
    let categoryToDisplay = null;
    
    // look if 
    for (let i = 0; i <recognizedCategories.length; i++) {
      const currentCategory = recognizedCategories[i];
      if (global.category_translations.get(currentCategory)) {
        categoryToDisplay = global.category_translations.get(currentCategory);
        break;
      }
    }
    
    let message = '';
    
    //console.log("recognizedCategory=",recognizedCategory)
    console.log("categoryToDisplay=", categoryToDisplay);
    
    if (typeof categoryToDisplay !== 'undefined' && categoryToDisplay) {
      message = `👀Veo que quieres comprar un(a) ${categoryToDisplay}, con gusto te lo consigo 🦸‍♀️`
    } else {
      message = '🤷‍♀️ No reconozco la imagen que me mandas, no te preocupes aún te puedo ayudar 🕵️‍♀️. Por favor ingresa el nombre de la parte 🔧manualmente'
    }
    
    response = {
      "text": message
    }
  }
  
  // Sends the response message
  messengerService.callSendAPI(sender_psid, response);
  
  // update user
  firebaseService.saveUserSession(userSession);
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {

}

