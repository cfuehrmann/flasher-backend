"use strict";

const createFileDb = require("./filedb");

module.exports = {
  // Configuration of the database to avoid the "constrained construction" antipattern
  db: createFileDb(__dirname + "/productiondb.json")
};
