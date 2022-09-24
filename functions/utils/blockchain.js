const { connect, keyStores, providers, transactions, utils } = require('near-api-js');
const config = require('../configs');

async function getAccountConnected(params) {
  let network = 'testnet';
  let networkConfig = config.getConfig(network);

  // Tao keyPair và keyStore
  const keyPair = utils.KeyPair.fromString(networkConfig.account.privateKey);
  const keyStore = new keyStores.InMemoryKeyStore();

  keyStore.setKey(network, networkConfig.account.accountId, keyPair);

  // Connect account
  const near = await connect({
    keyStore,
    headers: {},
    ...networkConfig,
  });

  return await near.account(networkConfig.account.accountId);
}

// near view $CONTRACT_ID get_match '{"match_id": "match_1"}'
async function view(contractId, method, params) {
  let account = await getAccountConnected();
  return await account.viewFunction(contractId, method, params);
}

// near call $CONTRACT_ID create_game_match '{"match_id": "match_1", "players": ["user_1", "user_2"], "balance": 100, "start_ts": 1663619726000000}' --accountId $ACCOUNT_ID --deposit 1
async function call(contractId, method, params, attacted_deposit, attacted_gas) {
  let account = await getAccountConnected();

  return await account.functionCall({
    contractId: contractId,
    methodName: method,
    args: params,
    gas: attacted_gas,
    attachedDeposit: attacted_deposit,
  });
}

// async function getSignUrl(account_id, method, params, deposit, gas, receiver_id, meta, callback_url, network) {
//   if (!network) network = 'testnet';
//   console.log('Params: ', params);
//   const deposit_value = typeof deposit == 'string' ? deposit : utils.format.parseNearAmount('' + deposit);
//   const actions = [
//     method === '!transfer'
//       ? transactions.transfer(deposit_value)
//       : transactions.functionCall(method, Buffer.from(JSON.stringify(params)), gas, deposit_value),
//   ];
//   const keypair = utils.KeyPair.fromRandom('ed25519');
//   const provider = new providers.JsonRpcProvider({ url: 'https://rpc.' + network + '.near.org' });
//   const block = await provider.block({ finality: 'final' });
//   const txs = [
//     transactions.createTransaction(
//       account_id,
//       keypair.publicKey,
//       receiver_id,
//       1,
//       actions,
//       utils.serialize.base_decode(block.header.hash)
//     ),
//   ];
//   const newUrl = new URL('sign', 'https://wallet.' + network + '.near.org/');
//   newUrl.searchParams.set(
//     'transactions',
//     txs
//       .map((transaction) => utils.serialize.serialize(transactions.SCHEMA, transaction))
//       .map((serialized) => Buffer.from(serialized).toString('base64'))
//       .join(',')
//   );
//   newUrl.searchParams.set('callbackUrl', callback_url);
//   if (meta) newUrl.searchParams.set('meta', meta);
//   return newUrl.href;
// }
// function parseNearAmount(amount) {
//   return utils.format.parseNearAmount('' + amount);
// }

module.exports = {
  // getSignUrl,
  view,
  call,
  // parseNearAmount,
};
