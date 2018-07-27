"use strict";

const express = require("express");
const expressGraphQL = require("express-graphql");
const {
  db: { connect: connectToDb }
} = require("./productionconfig");
const schema = require("./schema");
const getGraphQLRoot = require("./graphqlroot");
const uuidv4 = require("uuid/v4");

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
  const db = connectToDb();

  db.createTest({
    id: "1",
    prompt: "prompt1",
    solution: "solution1",
    state: "failed",
    changeTime: new Date("2018-01-01T18:25:24.000"),
    lastTicks: 10000,
    nextTime: new Date("2018-02-01T18:25:24.000")
  });

  db.createTest({
    id: "2",
    prompt: "prompt2",
    solution: "solution2",
    state: "success",
    changeTime: new Date("2018-03-01T18:25:24.000"),
    lastTicks: 10001,
    nextTime: new Date("2018-04-01T18:25:24.000")
  });

  return getGraphQLRoot(db, () => new Date(), uuidv4);
}
