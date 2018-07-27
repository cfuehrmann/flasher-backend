"use strict";

const createFileDb = require("../app/filedb");

module.exports = {
  // Configuration of the database to avoid the "constrained construction" antipattern
  db: createFileDb("testdb.json")
};
