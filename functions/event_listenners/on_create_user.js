const functions = require('firebase-functions');
const admin = require('firebase-admin');

const newUserToFirestore = functions.auth.user().onCreate((user) => {
  var current = new Date().toString();
  var email = user.email;
  var nameIndex = email.indexOf('@');
  var nameUser = email.substring(0, nameIndex);
  console.log(user.uid + ',' + nameIndex + ',' + nameUser);

  return admin
    .firestore()
    .collection('Users')
    .doc(user.uid) // <= See that we use admin here
    .set({
      email: user.email,
      name: nameUser,
      creationDate: current,
    });
});

module.exports = newUserToFirestore;
