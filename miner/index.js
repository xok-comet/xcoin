"use strict";

const Command = require("./CommandInterface");

const { P2PNode } = require("p2p-connect");

const start = async () => {
  try {
    const node = new P2PNode();
    await node.start();
    console.log("Node Started: ", node.node.peerInfo.id.toB58String());
    Command();
  } catch (error) {
    console.log(error);
  }
};

start();
