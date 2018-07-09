// todo: unit tests for root
// todo: make insert method for database; maybe to replace initialization with array.
"use strict";

const express = require("express");
const expressGraphQL = require("express-graphql");
const createArrayDb = require("./arraydb");
const schema = require("./schema");
const getGraphQLRoot = require("./graphqlroot");

const app = express();

app.use(
  "/graphql",
  expressGraphQL({
    schema: schema,
    rootValue: getRoot(),
    graphiql: true
  })
);

app.listen(4000, () =>
  console.log("Express GraphQL Server Now Running On localhost:4000/graphql")
);

function getRoot() {
  const testsData = [
    {
      id: "1",
      prompt: "prompt1",
      solution: "solution1",
      state: "failed",
      changeTime: "2018-01-01T18:25:24.000",
      lastTicks: 10000,
      nextTime: "2018-02-01T18:25:24.000"
    },
    {
      id: "2",
      prompt: "prompt2",
      solution: "solution2",
      state: "success",
      changeTime: "2018-03-01T18:25:24.000",
      lastTicks: 10001,
      nextTime: "2018-04-01T18:25:24.000"
    }
  ];
  const db = createArrayDb(testsData);
  return getGraphQLRoot(db);
}
