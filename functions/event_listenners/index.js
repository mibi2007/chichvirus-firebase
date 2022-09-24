// const functions = require('firebase-functions'),
//   admin = require('firebase-admin');

// const addMessage = functions.https.onRequest(async (req, res) => {
//   // [END addMessageTrigger]
//   // Grab the text parameter.
//   const original = req.query.text;
//   // [START adminSdkPush]
//   // Push the new message into the Realtime Database using the Firebase Admin SDK.
//   const snapshot = await admin.database().ref('/messages').push({ original: original });
//   // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
//   res.redirect(303, snapshot.ref.toString());
//   // [END adminSdkPush]
// });
// [END addMessage]

// [START makeUppercase]
// Listens for new messages added to /messages/:pushId/original and creates an
// uppercase version of the message to /messages/:pushId/uppercase
// const makeUppercase = functions.database.ref('/messages/{pushId}/original').onCreate((snapshot, context) => {
//   // Grab the current value of what was written to the Realtime Database.
//   const original = snapshot.val();
//   functions.logger.log('Uppercasing', context.params.pushId, original);
//   const uppercase = original.toUpperCase();
//   // You must return a Promise when performing asynchronous tasks inside a Functions such as
//   // writing to the Firebase Realtime Database.
//   // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
//   return snapshot.ref.parent.child('uppercase').set(uppercase);
// });

const newUserToFirestore = require('./on_create_user');
const onFindMatch = require('./on_find_match');

module.exports = { newUserToFirestore, onFindMatch };
