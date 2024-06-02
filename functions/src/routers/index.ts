/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express';
import { auth, database, firestore } from 'firebase-admin';
import { getRandomInt } from '../utils/utils.js';


const api = express();

api.get('/maps/:id', async (req, res) => {
  const id = req.params.id;
  const mapDoc = firestore().collection('Maps').doc(id);

  const mapSnap = await mapDoc.get();
  res.json({
    data: mapSnap.data(),
  });
});

api.get('/lastest_map/:userId', async (req, res) => {
  const userId = req.params.userId;
  const lastMap = firestore()
    .collection('Users')
    .doc(userId)
    .collection('PlayedMaps')
    .orderBy('solvedAt', 'desc')
    .limit(1);
  const mapQuery = await lastMap.get();

  const mapId = mapQuery.docs[0] != undefined ? (parseInt(mapQuery.docs[0].id) + 1).toString() : '0';
  const mapDoc = firestore().collection('Maps').doc(mapId);

  const mapSnap = await mapDoc.get();
  res.json({
    data: {
      mapId: mapId,
      map: mapSnap.data(),
    },
  });
});

api.get('/find_match', async (req, res) => {
  const userIdToken = req.body.userToken;
  const decodedToken = await auth().verifyIdToken(userIdToken);
  const userId = decodedToken.uid;
  database().ref(`/finding${userId}`).push('');
  res.json({
    data: '',
  });
});

api.get('/random_map', async (req, res) => {
  const mapId = getRandomInt(2);

  const mapDoc = firestore().collection('Maps').doc(mapId.toString());

  const mapSnap = await mapDoc.get();
  res.json({
    data: mapSnap.data(),
  });
});

api.get('/get_match/:id', async (req, res) => {
  const matchId = req.params.id;

  const matchSnapshot = await database().ref(`/matches/${matchId}`).get();
  const matchData = matchSnapshot.val();

  res.json({
    firebase: matchData,
  });
});

api.post('/check_match', async (req, res) => {
  const matchId = req.body.matchId;
  const userId = req.body.userId;
  const progressRef = await database().ref(`/matches/${matchId}/progress`).get();
  const progress = progressRef.val();
  const playerProgress: any[] = Array.from(progress)
    .filter((e: any) => e.player == userId)
    .sort((a: any, b: any) => b.time - a.time);

  const solutionRef = firestore().collection('MatchSolution').doc(matchId);
  const sourceSolution = (await solutionRef.get()).data();

  if (JSON.stringify(Object(sourceSolution)) == playerProgress[0].solution) {
    const end = new Date().getTime() * 1000;
    const matchRef = database().ref(`/matches/${matchId}`);
    matchRef.child('end_ts').set(end);
    matchRef.child('winner').set(userId);
    const uids = (await matchRef.child('uids').get()).val();
    uids.forEach((uid: string) => {
      database().ref(`/finding/${uid}`).remove();
    });
    res.json({
      data: 'CORRECT',
    });
  } else {
    res.json({
      data: 'WRONG',
    });
  }
});

api.post('/check_solution', async (req, res) => {
  const userId = req.body.userId;
  const mapId = req.body.mapId;
  const solution = req.body.solution;
  const map = (await firestore().collection('Maps').doc(mapId).get()).data();
  if (map == undefined) {
    res.json({
      data: 'WRONG',
    });
    return;
  }
  if (solution == JSON.stringify(map.solution)) {
    // console.log(map);
    firestore().collection('Users').doc(userId).collection('PlayedMaps').doc(mapId).set({
      solvedAt: new Date().getTime(),
    });
    res.json({
      data: 'CORRECT',
    });
  } else {
    res.json({
      data: 'WRONG',
    });
  }
});

api.get('/exportAllMaps', async (req, res) => {
  const maps = await firestore().collection('Maps').get();
  const data: any[] = [];
  maps.forEach((map) => {
    data.push(map.data());
  });
  res.json({
    data: data,
  });
});

api.get('/importAllMaps', async (req, res) => {
  const data = req.body.data;
  await firestore().collection('Maps').add(data);
  res.json({
    data: 'OK',
  });
});

export const router = api;
