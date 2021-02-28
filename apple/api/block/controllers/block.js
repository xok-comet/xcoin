"use strict";
const { toDecimal } = require("bb26");
const { sanitizeEntity } = require("strapi-utils");
const sha1 = require("hash.js/lib/hash/sha/256");
const { getNode } = require("../../../PeerToPeer");

module.exports = {
  async checkAmount(ctx) {
    let listBlock;
    const { address } = ctx.params;
    listBlock = await strapi.services.block.find(ctx.query);
    let plusAmount = 0;
    let minusAmount = 0;
    listBlock.map(e => {
      console.log(e.transactions);
      e.transactions.map(e => {
        if (e.to == address) {
          console.log("add :" + e.amount);
          plusAmount += e.amount;
        } else if (e.from == address) {
          console.log("delete :" + e.amount);
          minusAmount += e.amount;
        }
      });
    });
    console.log(plusAmount);
    console.log(minusAmount);
    return plusAmount - minusAmount;
  },
  async findLastBlock(ctx) {
    let lastBlock = await strapi.services.block.findLast(ctx.query);
    return lastBlock;
  },
  async findBlockByVersion(ctx) {
    const { version } = ctx.params;
    let lastBlock = await strapi.services.block.findOne({ version: version });
    return lastBlock;
  },
  async create(ctx) {
    let entity;

    const node = getNode();
    const { proof, transaction, txid } = ctx.request.body;
    let lastBlock = await strapi.services.block.findLast(ctx.query);
    if (lastBlock == null) {
      //there are no last block so this is generic block
      let data = {
        version: 1,
        hash: "001",
        transactions: [txid],
      };
      console.log(data);
      if (ctx.is("multipart")) {
        const { data, files } = parseMultipartData(ctx);
        entity = await strapi.services.block.create(data, { files });
      } else {
        entity = await strapi.services.block.create(data);
      }
      const currentNodeId = node.node.peerInfo.id.toB58String();
      node.publish(
        "SYNC_REQUEST",
        JSON.stringify({
          nodeId: currentNodeId,
          lastBlockNumber: 1,
        })
      );
      return sanitizeEntity(entity, { model: strapi.models.block });
    } else {
      let prevHash = lastBlock.hash;
      //sum of sha1 of proof sha1 need to be greater than sum of sha1 of all transaction
      var transactionHash = sha1().update(transaction).digest("hex");
      var arrayCharTxHash = Array.from(transactionHash.toUpperCase());
      var intTxHash = arrayCharTxHash.filter(e => {
        if (parseInt(e) == e) {
          return e;
        }
      });
      var sumOfTxHash = intTxHash.reduce(
        (a, b) => parseInt(a) + parseInt(b),
        0
      );

      var proofHash = sha1().update(proof).digest("hex");
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
      let difficulty = 1.3;

      if (sumOfProofHash < sumOfTxHash / difficulty) {
        // let hash = sha1().update(ctx.request.body.transaction.hash).digest("hex");
        let lastBlock = await strapi.services.block.findLast(ctx.query);

        let data = {
          hash: proofHash,
          prevhash: prevHash,
          txhash: transactionHash,
          txString: transaction,
          proof: proof,
          version: lastBlock.version + 1,
          transactions: [txid],
        };
        console.log(data);
        if (ctx.is("multipart")) {
          const { data, files } = parseMultipartData(ctx);
          entity = await strapi.services.block.create(data, { files });
        } else {
          entity = await strapi.services.block.create(data);
        }

        const currentNodeId = node.node.peerInfo.id.toB58String();
        node.publish(
          "SYNC_REQUEST",
          JSON.stringify({
            nodeId: currentNodeId,
            lastBlockNumber: lastBlock.version + 1,
          })
        );
        return sanitizeEntity(entity, { model: strapi.models.block });
      } else {
        return "error your proof hash is not correct";
      }
    }
  },
};
