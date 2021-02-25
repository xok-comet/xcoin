"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require("strapi-utils");
const sha1 = require("hash.js/lib/hash/sha/1");
const crypto = require("crypto");
module.exports = {
  async create(ctx) {
    let entity;
    const { from, to, amount, secret } = ctx.request.body;
    let hash = sha1().update(from + to + amount).digest("hex");
    let data = {
      hash: hash,
      from: from,
      to: to,
      amount: amount,
      script: secret,
    };
    console.log(data);
    if (ctx.is("multipart")) {
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.services.transaction.create(data, { files });
    } else {
      entity = await strapi.services.transaction.create(data);
    }
    return sanitizeEntity(entity, { model: strapi.models.transaction });
  },
};
