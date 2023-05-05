const Router = require('express');
const router = new Router();
const admin = require('firebase-admin');
const { getRandomInt } = require('../utils/utils.js');

const blockchain = require('../utils/blockchain.js');
const configs = require('../configs');

router.get('/maps/:id', async (req, res) => {
  const id = req.params.id;
  const mapDoc = admin.firestore().collection('Maps').doc(id);

  const mapSnap = await mapDoc.get();
  res.json({
    data: mapSnap.data(),
  });
});

router.get('/lastest_map/:userId', async (req, res) => {
  const userId = req.params.userId;
  const lastMap = admin
    .firestore()
    .collection('Users')
    .doc(userId)
    .collection('PlayedMaps')
    .orderBy('solvedAt', 'desc')
    .limit(1);
  const mapQuery = await lastMap.get();

  const mapId = mapQuery.docs[0].id ?? 0;
  const mapDoc = admin.firestore().collection('Maps').doc(mapId);

  const mapSnap = await mapDoc.get();
  res.json({
    data: {
      mapId: mapId,
      map: mapSnap.data(),
    },
  });
});

router.get('/find_match', async (req, res) => {
  const userIdToken = req.body.userToken;
  const decodedToken = await admin.auth().verifyIdToken(userIdToken);
  const userId = decodedToken.uid;
  admin.database().ref(`/finding${userId}`).push('');
  res.json({
    data: '',
  });
});

router.get('/random_map', async (req, res) => {
  const mapId = getRandomInt(2);

  const mapDoc = admin.firestore().collection('Maps').doc(mapId.toString());

  const mapSnap = await mapDoc.get();
  res.json({
    data: mapSnap.data(),
  });
});

router.get('/get_match/:id', async (req, res) => {
  const matchId = req.params.id;

  const matchSnapshot = await admin.database().ref(`/matches/${matchId}`).get();
  const matchData = matchSnapshot.val();

  const networkConfig = configs.getConfig('testnet');
  // near view $CONTRACT_ID get_match '{"match_id": "match_1"}'
  const matchDetail = await blockchain.view(networkConfig.paymentContract, 'get_match', {
    match_id: matchId,
  });
  res.json({
    firebase: matchData,
    blockchain: matchDetail,
  });
});

router.post('/check_match', async (req, res) => {
  const matchId = req.body.matchId;
  const userId = req.body.userId;
  const progressRef = await admin.database().ref(`/matches/${matchId}/progress`).get();
  const progress = progressRef.val();
  const playerProgress = Array.from(progress)
    .filter((e) => e.player == userId)
    .sort((a, b) => b.time - a.time);

  const solutionRef = admin.firestore().collection('MatchSolution').doc(matchId);
  const sourceSolution = (await solutionRef.get()).data();

  if (JSON.stringify(Object(sourceSolution)) == playerProgress[0].solution) {
    console.log('CORRECT');
    const userRef = admin.firestore().collection('Users').doc(userId);
    const userAccountSnap = await userRef.get();
    const userAccount = userAccountSnap.data().accountId;
    const end = new Date().getTime() * 1000;
    // near call $CONTRACT_ID save_match_result '{"match_id": "c2743acb-019f-48ee-b9f5-fbb57865e97f", "winner": "chichvirus-player2.mibi.testnet", "end_ts": 1663933375317001}' --accountId $ACCOUNT_ID
    await blockchain.call(
      'chichvirus-contract.mibi.testnet',
      'save_match_result',
      {
        match_id: matchId,
        winner: userAccount,
        end_ts: end,
      },
      0,
      30000000000000
    );
    const matchRef = admin.database().ref(`/matches/${matchId}`);
    matchRef.child('end_ts').set(end);
    matchRef.child('winner').set(userId);
    const uids = (await matchRef.child('uids').get()).val();
    uids.forEach((uid) => {
      admin.database().ref(`/finding/${uid}`).remove();
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

router.post('/check_solution', async (req, res) => {
  const userId = req.body.userId;
  const mapId = req.body.mapId;
  const solution = req.body.solution;
  const map = (await admin.firestore().collection('Maps').doc(mapId).get()).data();
  if (solution == JSON.stringify(map.solution)) {
    // console.log(map);
    admin.firestore().collection('Users').doc(userId).collection('PlayedMaps').doc(mapId).set({
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

module.exports = router;
