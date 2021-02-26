"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/services.html#core-services)
 * to customize this service
 */

module.exports = {
  findLast(params, populate) {
    return strapi
      .query("block")
      .findOne({ _limit: 1, _sort: "createdAt:desc" });
  },
};
