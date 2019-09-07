import * as bcrypt from "bcrypt";
import * as bodyParser from "body-parser";
import * as express from "express";
import * as expressGraphQL from "express-graphql";
import * as jwt from "express-jwt";
import * as fs from "fs";
import * as jsonwebtoken from "jsonwebtoken";
import * as uuid from "uuid";

import * as domainLogic from "./domain-logic";
import * as loginTool from "./login-tool";
import {
  credentialsRepositoryTools,
  repositoryTools,
} from "./production-config";
import { schema } from "./schema";

const app = express();

app.use("/graphql", bodyParser.json());

const secret = fs.readFileSync(__dirname + "/../mount/public.key");

// Enable the code below to enforce authentication
// app.use(
//   jwt({ secret, algorithms: ["RS256"] }).unless(req =>
//     req.body.query.startsWith("query login"),
//   ),
// );

// To avoid sending the call stack to the client
app.use(((
  err,
  req,
  res,
  next, // for this to work, the last arg is needed even if unused
) => res.status(err.status).send(err.message)) as express.ErrorRequestHandler);

app.use(
  "/graphql",
  expressGraphQL({
    schema,
    rootValue: getRoot(),
    graphiql: true,
  }),
);

app.listen(4000, () => {
  console.log("Express GraphQL Server Now Running On localhost:4000/graphql");
});

function getRoot() {
  const credentialsRepository = credentialsRepositoryTools.connect();
  const repository = repositoryTools.connect();

  const privateKey = fs.readFileSync(__dirname + "/../mount/private.key");
  const hashComparer = bcrypt.compare;
  const jsonWebTokenSigner = (payload: {}) =>
    jsonwebtoken.sign(payload, privateKey, { algorithm: "RS256" });

  const getTime = () => new Date();
  const createUuid = uuid.v4;

  return {
    ...loginTool.create({
      credentialsRepository,
      hashComparer,
      jsonWebTokenSigner,
    }),
    ...domainLogic.create({ repository, getTime, createUuid }),
  };
}
