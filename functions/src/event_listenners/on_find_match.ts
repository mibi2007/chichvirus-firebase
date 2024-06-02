import { database as _database, firestore } from 'firebase-admin';
import { database, logger } from 'firebase-functions';
import { v4 as uuidv4 } from 'uuid';
import { getRandomInt } from '../utils/utils.js';

const onFindMatch = database.ref('/finding/{userId}').onCreate(async (snapshot, context) => {
  const original = snapshot.val();
  // const total = await snapshot.ref.parent.get();
  logger.log('Find', context.params.userId, original);
  if (snapshot.ref.parent == null) return;
  const childrenData = (await snapshot.ref.parent.get()).val();
  const findings = Object.values(childrenData).filter((value) => value == '');
  if (findings.length == 2) {
    const matchId = uuidv4();
    for (const [userId, match] of Object.entries(childrenData)) {
      console.log(`${userId}: ${match}`);
      if (match == '') {
        _database().ref(`/finding/${userId}`).set(matchId);
      }
    }

    const player1Uid = Object.keys(childrenData)[0];
    const player2Uid = Object.keys(childrenData)[1];
    const player1Doc = firestore().collection('Users').doc(player1Uid);
    const player1Snap = await player1Doc.get();
    const player2Doc = firestore().collection('Users').doc(player2Uid);
    const player2Snap = await player2Doc.get();
    const player1Data = player1Snap.data();
    const player2Data = player2Snap.data();
    if (player1Data == undefined || player2Data == undefined) return;
    const players = [player1Data.accountId, player2Data.accountId];
    console.log(players);

    const mapId = getRandomInt(2);

    const mapDoc = firestore().collection('Maps').doc(mapId.toString());

    const mapSnap = await mapDoc.get();
    const start = new Date().getTime() * 1000;
    const matchRef = _database().ref(`/matches/${matchId}`);
    const uids = Object.keys(childrenData);
    // await matchRef.child(`/${uids[0]}/${start}`).set('aaaaaaaa');
    // await matchRef.child(uids[1]).child(start).set(true);
    const mapData = mapSnap.data();
    if (mapData == undefined) return;
    await matchRef.set({
      uids: uids,
      players: players,
      start_ts: start,
      map: { sprite: mapData.sprite, viruses: mapData.viruses },
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
    await firestore().collection('MatchSolution').doc(matchId).set(mapData.solution);
  }
  return;
});

export default onFindMatch;
