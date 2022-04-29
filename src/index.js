const Web3 = require('web3');
const {
  default: Safe,
  Web3Adapter
} = require('@gnosis.pm/safe-core-sdk');

const nodeConfig = require('./node.json');
// 多签合约地址
const SAFE_ADDRESS = '0x71bBAAa468c0044Ddc3191cfC9B6f76143C3fF85';
const NFT_CONTRACT_ADDRESS = '0x0C288e3934E257CE2a637E878B8814625a0e2EE8';
const RPC_URL = '';
const ABI_JSON = require('./did-abi.json');

function getWeb3 (priKey) {
  const web3 = new Web3(RPC_URL);
  web3.eth.accounts.wallet.add(priKey);
  return web3;
}

function getAdapter (web3) {
  const { 0: { address } } = web3.eth.accounts.wallet;
  console.log(address);
  return new Web3Adapter({
    web3,
    signerAddress: address
  });
}

async function createNode (ethAdapter, safeAddress = SAFE_ADDRESS) {
  const sdk = await Safe.create({
    ethAdapter,
    safeAddress
  });
  return sdk;
}

async function main () {
  // 初始化签名节点
  const node_1 = await createNode(getAdapter(getWeb3(nodeConfig[0].privateKey)));
  const node_2 = await createNode(getAdapter(getWeb3(nodeConfig[1].privateKey)));
  const node_3 = await createNode(getAdapter(getWeb3(nodeConfig[2].privateKey)));
  const node_4 = await createNode(getAdapter(getWeb3(nodeConfig[3].privateKey)));
  const node_5 = await createNode(getAdapter(getWeb3(nodeConfig[4].privateKey)));

  // 构建交易
  const web3 = new Web3();
  const did = new web3.eth.Contract(ABI_JSON);
  const data = did.methods.mint('0xETH_Address', 'xxx.bit').encodeABI();
  const transactions = [{
    to: NFT_CONTRACT_ADDRESS,
    value: '0',
    data: data
  }];

  // 开始签名
  const safeTransaction = await node_1.createTransaction(...transactions);

  // 3/5 节点签名即可
  await node_1.signTransaction(safeTransaction);
  await node_2.signTransaction(safeTransaction);
  // await node_3.signTransaction(safeTransaction);
  await node_4.signTransaction(safeTransaction);
  // await node_5.signTransaction(safeTransaction);
  console.log(safeTransaction);

  // 发送交易，发送交易者可以不是Node成员，此账户用来支付GAS
  // 发送交易节点使用前请确保账户内有GAS
  const executeTxResponse = await node_1.executeTransaction(safeTransaction);
  console.log(executeTxResponse);
}

main();
