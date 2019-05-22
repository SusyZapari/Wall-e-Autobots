const User = require('./User');
const firebase = require('firebase');
const firebaseApp = firebase.initializeApp({
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "wall-e-5f126.firebaseapp.com",
  databaseURL: "https://wall-e-5f126.firebaseio.com",
  projectId: "wall-e-5f126",
  storageBucket: "wall-e-5f126.appspot.com",
  messagingSenderId: "790070752021"
});
const db = firebase.firestore();

module.exports = {
  getUserSession: async function(userId) {
      let user;
      const userRef = db.collection('users').doc(userId);

      await userRef.get().then(
        async userInFirebase => {
          if (!userInFirebase.exists) {
            console.log('User not in firebase creating a new one');

            user = new User(userId);
            let newUser = await this.saveUserSession(user);
            console.log('Adding to firebase completed');
            
          } else {
            user = new User(
              userInFirebase.data().userId,
              userInFirebase.data().state,
              userInFirebase.data().partName,
              userInFirebase.data().makes, 
              userInFirebase.data().year,
              userInFirebase.data().model,
              userInFirebase.data().subModel
            );
            console.log('User from firebase data:', user);   
          }
        }
      );
    
    return user;
  },
  
  saveUserSession: async function(user) {
    let newUser = await db.collection('users').doc(user.userId).set({
      userId: user.userId,
      state: user.state,
      partName: user.partName,
      makes: user.makes,
      year: user.year,
      model: user.model,
      subModel: user.subModel
    }/*, {merge: true}*/);
    
    console.log("saved user:", user);
    return newUser;
  }
    
}