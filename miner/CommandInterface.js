"use strict";

const Mine = require("./mine");

const vorpal = require("vorpal")();

const Command = () => {
  vorpal
    .command("mine", "Initialize blockchain")
    .action(async (args, callback) => {
      await Mine();
      callback();
    });
  vorpal.delimiter("blockchain$").show();
};
module.exports = Command;
