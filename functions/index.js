const functions = require('firebase-functions');
// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();
const express = require('express'),
  { json } = require('express'),
  bodyParser = require('body-parser'),
  morgan = require('morgan'),
  apiRouter = require('./routers'),
  { newUserToFirestore, onFindMatch } = require('./event_listenners'),
  cors = require('cors');

const app = express();

app.use(json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('combined'));
app.use(cors());

app.use('/', apiRouter);

exports.api = functions.https.onRequest(app);
exports.newUserToFirestore = newUserToFirestore;
exports.onFindMatch = onFindMatch;
