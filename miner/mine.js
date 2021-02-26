const sha256 = require("hash.js/lib/hash/sha/256");
const { P2PNode } = require("p2p-connect");

const BASE_URL = "http://localhost:1341";
const axios = require("axios");
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
const Mine = async (transaction, node) => {
  while (true) {
    var proof = Math.random().toString(36).substring(2);
    // var transaction =
    //   "e1a9d421c985612fb3930b4d8b40f000afc66b5e996ed4b33391c5a400a5355207418eecdbf553ad";
    var proofHash = sha256().update(proof).digest("hex");
    var transactionHash = sha256().update(transaction).digest("hex");
    var arrayCharTxHash = Array.from(transactionHash.toUpperCase());
    var intTxHash = arrayCharTxHash.filter(e => {
      if (parseInt(e) == e) {
        return e;
      }
    });
    var sumOfTxHash = intTxHash.reduce((a, b) => parseInt(a) + parseInt(b), 0);

    var arrayCharProofHash = Array.from(proofHash.toUpperCase());
    var intProofHash = arrayCharProofHash.filter(e => {
      if (parseInt(e) == e) {
        return e;
      }
    });
    var sumOfProofHash = intProofHash.reduce(
      (a, b) => parseInt(a) + parseInt(b),
      0
    );
    console.log("tx" + sumOfTxHash);
    console.log("proof" + sumOfProofHash);
    let difficulty = 1.3;
    if (sumOfProofHash < sumOfTxHash / difficulty) {
      console.log("found block");
      console.log("proof is " + proof);
      console.log(sumOfProofHash);
      console.log(sumOfTxHash / difficulty);
      let body = {
        proof: proof,
        transaction: transaction,
      };
      let block = await PostMethod("/blocks", body);

      const nodeId = node.node.peerInfo.id.toB58String();
      node.publish(
        "SYNC_REQUEST",
        JSON.stringify({
          nodeId: nodeId,
          lastBlockNumber: block.data.version,
        })
      );
      return true;
    }
  }
};
module.exports = Mine;
