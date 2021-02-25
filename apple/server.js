const strapi = require("strapi");
const { P2PNode } = require("p2p-connect");
const { start } = require("./PeerToPeer");
start();
strapi({ dir: "./", autoReload: true }).start();
