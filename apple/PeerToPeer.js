const { P2PNode } = require("p2p-connect");
const channel = {
    SYNC_REQUEST: "SYNC_REQUEST",
    SYNC_BLOCK: "SYNC_BLOCK",
    SYNC_TRXN_REQUEST: "SYNC_TRXN_REQUEST",
    SYNC_TRXN: "SYNC_TRXN",
    CREATED_TRANSACTION: "CREATED_TRANSACTION",
    CREATED_BLOCK: "CREATED_BLOCK",
  };
let node;
const start = async () => {
  try {
    node = new P2PNode();
    await node.start();
    console.log("Node Started: ", node.node.peerInfo.id.toB58String());
    node.node.on("peer:connect", peer => {
      setTimeout(() => {
        syncBlockchain(node);
        syncTransaction(node);
      }, 2000);
    });
    node.subscribe(channel.SYNC_REQUEST, async buffer => {
      const data = JSON.parse(buffer.data.toString());
      const currentNodeId = node.node.peerInfo.id.toB58String();

      // Request Sync from Other Node
      if (data.nodeId != currentNodeId) {
        console.log("got SYNC_BLOCK from :" +data.nodeId);
        // const block = await bc.findNext(data.latestHash);
        // console.log(`Request block ${data.latestHash}`, block);

        // if (block) {
        //   node.publish(
        //     channel.SYNC_BLOCK,
        //     JSON.stringify({
        //       nodeId: data.nodeId,
        //       block: block,
        //     })
        //   );
        // }
      }
    });
  } catch (error) {
    console.log(error);
  }
};
const syncBlockchain = async (node) => {
  const nodeId = node.node.peerInfo.id.toB58String();

  node.publish(
    channel.SYNC_REQUEST,
    JSON.stringify({
      nodeId: nodeId,
      latestHash: "latestHash",
    })
  );
};

const syncTransaction = async (node) => {
  const nodeId = node.node.peerInfo.id.toB58String();
  node.publish(
    channel.SYNC_TRXN_REQUEST,
    JSON.stringify({
      nodeId: nodeId,
    })
  );
};
const getNode = () => {
  return node;
};
module.exports = {
  start,
  getNode,
};
