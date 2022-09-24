const functions = require('firebase-functions');
const admin = require('firebase-admin');
const blockchain = require('../utils/blockchain.js');
const { v4: uuidv4 } = require('uuid');
const { getRandomInt } = require('../utils/utils.js');

const onFindMatch = functions.database.ref('/finding/{userId}').onCreate(async (snapshot, context) => {
  const original = snapshot.val();
  // const total = await snapshot.ref.parent.get();
  functions.logger.log('Find', context.params.userId, original);
  const childrenData = (await snapshot.ref.parent.get()).val();
  const findings = Object.values(childrenData).filter((value) => value == '');
  if (findings.length == 2) {
    const matchId = uuidv4();
    for (const [userId, match] of Object.entries(childrenData)) {
      console.log(`${userId}: ${match}`);
      if (match == '') {
        admin.database().ref(`/finding/${userId}`).set(matchId);
      }
    }

    const player1Uid = Object.keys(childrenData)[0];
    const player2Uid = Object.keys(childrenData)[1];
    const player1Doc = admin.firestore().collection('Users').doc(player1Uid);
    const player1Snap = await player1Doc.get();
    const player1 = player1Snap.data();
    // console.log(player1);
    const player2Doc = admin.firestore().collection('Users').doc(player2Uid);
    const player2Snap = await player2Doc.get();
    const players = [player1Snap.data().accountId, player2Snap.data().accountId];
    console.log(players);

    const mapId = getRandomInt(2);

    const mapDoc = await admin.firestore().collection('Maps').doc(mapId.toString());

    const mapSnap = await mapDoc.get();
    const start = new Date().getTime() * 1000;
    const matchRef = admin.database().ref(`/matches/${matchId}`);
    const uids = Object.keys(childrenData);
    // await matchRef.child(`/${uids[0]}/${start}`).set('aaaaaaaa');
    // await matchRef.child(uids[1]).child(start).set(true);
    await matchRef.set({
      uids: uids,
      players: players,
      start_ts: start,
      map: { sprite: mapSnap.data().sprite, viruses: mapSnap.data().viruses },
      progress: [
        {
          time: start,
          player: uids[0],
          solution: '',
        },
        {
          time: start,
          player: uids[1],
          solution: '',
        },
      ],
    });
    await admin.firestore().collection('MatchSolution').doc(matchId).set(mapSnap.data().solution);
    // near call $CONTRACT_ID create_game_match '{"match_id": "match_1", "players": ["user_1", "user_2"], "balance": 100, "start_ts": 1663619726000000}' --accountId $ACCOUNT_ID --deposit 1
    await blockchain.call(
      'chichvirus-contract.mibi.testnet',
      'create_game_match',
      {
        match_id: matchId,
        players: players,
        balance: 100,
        start_ts: start,
      },
      0,
      30000000000000
    );
  }
  return;
});

module.exports = onFindMatch;
