import * as express from "express";
import * as expressGraphQL from "express-graphql";
import { v4 as uuidV4 } from "uuid";

import { domainLogic } from "./domain-logic";
import { repositoryTools } from "./production-config";
import { schema } from "./schema";

const app = express();

app.use(
  "/graphql",
  expressGraphQL({
    schema: schema,
    rootValue: getRoot(),
    graphiql: true,
  }),
);

app.listen(4000, () => {
  console.log("Express GraphQL Server Now Running On localhost:4000/graphql");
});

function getRoot() {
  const repository = repositoryTools.connect();
  return domainLogic(repository, () => new Date(), uuidV4);
}
