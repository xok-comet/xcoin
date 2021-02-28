"use strict";

const Command = require("./CommandInterface");
const axios = require("axios");
const { P2PNode } = require("p2p-connect");
const Mine = require("./mine");
const channel = {
  SYNC_REQUEST: "SYNC_REQUEST",
  SYNC_BLOCK: "SYNC_BLOCK",
  SYNC: "SYNC",
  SYNC_TRXN_REQUEST: "SYNC_TRXN_REQUEST",
  SYNC_TRXN: "SYNC_TRXN",
  NEW_TX: "NEW_TX",
  CREATED_TRANSACTION: "CREATED_TRANSACTION",
  CREATED_BLOCK: "CREATED_BLOCK",
  GET_BLOCK_DETAIL: "GET_BLOCK_DETAIL",
  GOT_BLOCK_DETAIL: "GOT_BLOCK_DETAIL",
};
const BASE_URL = "http://localhost:1341";
const GetMethod = async endpoint => {
  try {
    let data = await axios.get(BASE_URL + endpoint, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return data;
  } catch (e) {
    throw e;
  }
};
const PostMethod = async (endpoint, body) => {
  try {
    console.log(body);
    let data = await axios.post(BASE_URL + endpoint, body, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log(data);
    return data;
  } catch (e) {
    throw e;
  }
};
const start = async () => {
  try {
    const node = new P2PNode();
    await node.start();
    console.log("Node Started: ", node.node.peerInfo.id.toB58String());
    Command(node);

    node.node.on("peer:connect", peer => {
      setTimeout(() => {
        syncBlockchain(node);
        syncTransaction(node);
      }, 2000);
    });

    node.subscribe(channel.SYNC, async buffer => {
      const data = JSON.parse(buffer.data.toString());
      const currentNodeId = node.node.peerInfo.id.toB58String();
      if (data.nodeId != currentNodeId) {
        syncBlockchain(node);
      }
    });
    node.subscribe(channel.SYNC_REQUEST, async buffer => {
      const data = JSON.parse(buffer.data.toString());
      const currentNodeId = node.node.peerInfo.id.toB58String();

      // Request Sync from Other Node
      if (data.nodeId != currentNodeId) {
        try {
          let lastBlock = await GetMethod("/blocks/findLastBlock");
          let currentBlockNumber = lastBlock.data.version;
          console.log(data);
          if (data.lastBlockNumber > currentBlockNumber) {
            console.log(
              "there is block and asking for blockdetail from " + data.nodeId
            );

            const currentNodeId = node.node.peerInfo.id.toB58String();
            node.publish(
              channel.GET_BLOCK_DETAIL,
              JSON.stringify({
                nodeId: currentNodeId,
                version: currentBlockNumber + 1,
                destination: data.nodeId,
              })
            );
          }
        } catch (error) {
          console.log(error);
          let currentBlockNumber = 0;
          console.log(data);
          if (data.lastBlockNumber > currentBlockNumber) {
            console.log(
              "there is no block and asking for blockdetail from " + data.nodeId
            );

            const currentNodeId = node.node.peerInfo.id.toB58String();
            console.log(currentNodeId);
            node.publish(
              channel.GET_BLOCK_DETAIL,
              JSON.stringify({
                nodeId: currentNodeId,
                version: 1,
                destination: data.nodeId,
              })
            );
          }
        }
      }
    });

    node.subscribe(channel.GOT_BLOCK_DETAIL, async buffer => {
      const data = JSON.parse(buffer.data.toString());
      const currentNodeId = node.node.peerInfo.id.toB58String();
      console.log(node.node.peerInfo);

      // Request Sync from Other Node
      if (data.nodeId != currentNodeId && data.destination == currentNodeId) {
        console.log("GET_BLOCK_DETAIL from :" + data.nodeId);
        const myLastBlock = 0;
        //save tx to your database
        let txbody = {
          hash: data.hash,
          from: data.from,
          to: data.to,
          amount: data.amount,
          secret: data.script,
          status: data.status,
        };
        let tx = await PostMethod("/transactions", txbody);
        //save block to your database
        let body = {
          proof: data.proof,
          transaction: data.tx,
          txid: tx.data.id,
        };
        console.log("waiting to save data");
        try {
          let block = await PostMethod("/blocks", body);

          if (block) {
            console.log("do sync");
            // syncBlockchain(node);
            node.publish(
              channel.SYNC,
              JSON.stringify({
                nodeId: currentNodeId,
              })
            );
          }
        } catch (error) {
          // console.log(error);
        }
      }
    });
    node.subscribe(channel.GET_BLOCK_DETAIL, async buffer => {
      const data = JSON.parse(buffer.data.toString());
      const currentNodeId = node.node.peerInfo.id.toB58String();
      console.log("got signal asking for block detail");
      console.log(data.nodeId);
      if (data.nodeId != currentNodeId && data.destination == currentNodeId) {
        console.log(
          "got signal asking for block detail version: " + data.version
        );
        getBlockDetail(node, data.version, data.nodeId);
      }
    });
    node.subscribe(channel.NEW_TX, async buffer => {
      const data = JSON.parse(buffer.data.toString());
      const currentNodeId = node.node.peerInfo.id.toB58String();
      if (data.nodeId != currentNodeId) {
        console.log("got signal of new transaction: ");
        let body = {
          hash: data.hash,
          from: data.from,
          to: data.to,
          amount: data.amount,
          script: data.script,
          status: "pending",
        };
        let tx = await PostMethod("/transactions", body);
        let txData = tx.data;
        if (tx) {
          Mine(txData.hash, node, txData.id);
        }
      }
    });
  } catch (error) {
    console.log(error);
  }
};
const syncBlockchain = async node => {
  console.log("fetching block");
  try {
    let lastBlock = await GetMethod("/blocks/findLastBlock");
    console.log("last block is" + lastBlock.data.version);
    const nodeId = node.node.peerInfo.id.toB58String();
    node.publish(
      channel.SYNC_REQUEST,
      JSON.stringify({
        nodeId: nodeId,
        lastBlockNumber: lastBlock.data.version,
      })
    );
  } catch (error) {
    //there is no lastblock so get the first block
    const nodeId = node.node.peerInfo.id.toB58String();
    node.publish(
      channel.SYNC_REQUEST,
      JSON.stringify({
        nodeId: nodeId,
        lastBlockNumber: 0,
      })
    );
  }
};
const getBlockDetail = async (node, blockVersion, destination) => {
  const nodeId = node.node.peerInfo.id.toB58String();
  let lastBlockData = await GetMethod(
    "/blocks/findBlockByVersion/" + blockVersion
  );
  let lastBlock = lastBlockData.data;
  console.log("lastblock detail is");
  console.log(lastBlock.transactions[0]);
  let txData = lastBlock.transactions[0];
  // let txData = await GetMethod("/transactions/" + lastBlock.transactions[0].id);
  node.publish(
    channel.GOT_BLOCK_DETAIL,
    JSON.stringify({
      nodeId: nodeId,
      from: txData.from,
      to: txData.to,
      amount: txData.amount,
      script: txData.script,
      hash: txData.hash,
      destination: destination,
      status: txData.status,
      proof: lastBlock.proof,
      transaction: lastBlock.txString,
      destination: destination,
      txid: lastBlock.transactions[0].id,
    })
  );
};
const syncTransaction = async node => {
  const nodeId = node.node.peerInfo.id.toB58String();
  node.publish(
    channel.SYNC_TRXN_REQUEST,
    JSON.stringify({
      nodeId: nodeId,
    })
  );
};
start();
