const strapi = require("strapi");
const { P2PNode } = require("p2p-connect");
const { start } = require("./PeerToPeer");
strapi({ dir: "./", autoReload: true }).start().then(e => start());
