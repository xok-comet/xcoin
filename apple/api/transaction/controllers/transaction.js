"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require("strapi-utils");
const sha1 = require("hash.js/lib/hash/sha/1");
const crypto = require("crypto");
const { getNode } = require("../../../PeerToPeer");
module.exports = {
  async create(ctx) {
    const node = getNode();
    let entity;
    const { from, to, amount, secret, status } = ctx.request.body;
    let hash = sha1().update(from + to + amount).digest("hex");
    let data = {
      hash: hash,
      from: from,
      to: to,
      amount: amount,
      script: secret,
      status: status,
    };
    if (ctx.is("multipart")) {
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.services.transaction.create(data, { files });
    } else {
      entity = await strapi.services.transaction.create(data);
    }
    try {
      console.log(node.node.peerInfo.id.toB58String());
      if (status == "pending") {
        node.publish(
          "NEW_TX",
          JSON.stringify({
            hash: hash,
            from: entity.from,
            to: entity.to,
            script: entity.script,
            amount: entity.amount,
          })
        );
      }
    } catch (error) {
      console.log(error);
    }
    return sanitizeEntity(entity, { model: strapi.models.transaction });
  },
};
