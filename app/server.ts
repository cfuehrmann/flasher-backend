import * as express from "express";
import * as expressGraphQL from "express-graphql";
import { v4 as uuidv4 } from "uuid";
import { domainLogic } from "./domainlogic";
import { db } from "./productionconfig";
import { schema } from "./schema";

const app = express();

app.use(
  "/graphql",
  expressGraphQL({
    schema,
    rootValue: getRoot(),
    graphiql: true
  })
);

app.listen(4000, () =>
  console.log("Express GraphQL Server Now Running On localhost:4000/graphql")
);

function getRoot() {
  const d = db.connect();
  return domainLogic(d, () => new Date(), uuidv4);
}
