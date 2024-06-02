import * as admin from 'firebase-admin';
import { auth } from 'firebase-functions';

const newUserToFirestore = auth.user().onCreate((user) => {
  const current = new Date().toString();
  const email = user.email ?? '';
  const nameIndex = email.indexOf('@');
  const nameUser = email.substring(0, nameIndex);
  console.log(user.uid + ',' + nameIndex + ',' + nameUser);

  return admin.firestore()
    .collection('Users')
    .doc(user.uid) // <= See that we use admin here
    .set({
      email: user.email,
      name: nameUser,
      creationDate: current,
    });
});

export default newUserToFirestore;
