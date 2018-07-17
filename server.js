// todo: add creatdb to graphql root

"use strict";

const express = require("express");
const expressGraphQL = require("express-graphql");
const createDb = require("./arraydb");
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
  const db = createDb();

  db.createTest({
    id: "1",
    prompt: "prompt1",
    solution: "solution1",
    state: "failed",
    changeTime: "2018-01-01T18:25:24.000",
    lastTicks: 10000,
    nextTime: "2018-02-01T18:25:24.000"
  });

  db.createTest({
    id: "2",
    prompt: "prompt2",
    solution: "solution2",
    state: "success",
    changeTime: "2018-03-01T18:25:24.000",
    lastTicks: 10001,
    nextTime: "2018-04-01T18:25:24.000"
  });

  return getGraphQLRoot(db, () => new Date());
}
