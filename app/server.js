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
  return getGraphQLRoot(db, () => new Date(), uuidv4);
}
