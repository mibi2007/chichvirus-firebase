import { generate } from '@genkit-ai/ai';
import { configureGenkit } from '@genkit-ai/core';
import { firebase } from '@genkit-ai/firebase';
import { firebaseAuth } from '@genkit-ai/firebase/auth';
import { onFlow } from '@genkit-ai/firebase/functions';
import { geminiPro, googleAI } from '@genkit-ai/googleai';
import * as functions from 'firebase-functions';
import * as z from 'zod';
// The Firebase Admin SDK to access the Firebase Realtime Database.
import bodyParser from 'body-parser';
import cors from 'cors';
import express, { json } from 'express';
import admin from 'firebase-admin';
import newUserToFirestore from './event_listenners/on_create_user';
import onFindMatch from './event_listenners/on_find_match';
import { router } from './routers';

configureGenkit({
  plugins: [
    firebase(),
    googleAI(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

export const menuSuggestionFlow = onFlow(
  {
    name: 'menuSuggestionFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
    authPolicy: firebaseAuth((user) => {
      if (!user.email_verified) {
        throw new Error('Verified email required to run flow');
      }
    }),
  },
  async (subject) => {
    const prompt =
      `Suggest an item for the menu of a ${subject} themed restaurant`;

    const llmResponse = await generate({
      model: geminiPro,
      prompt: prompt,
      config: {
        temperature: 1,
      },
    });

    return llmResponse.text();
  }
);


admin.initializeApp();

const app = express();

app.use(json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use('/', router);

exports.api = functions.https.onRequest(app);
exports.newUserToFirestore = newUserToFirestore;
exports.onFindMatch = onFindMatch;
