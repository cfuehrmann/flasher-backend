import { ApolloServer } from "apollo-server";
import * as bcrypt from "bcrypt";
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

const secret = fs.readFileSync(__dirname + "/../mount/public.key");

// // To avoid sending the call stack to the client
// app.use(((
//   err,
//   req,
//   res,
//   next, // for this to work, the last arg is needed even if unused
// ) => res.status(err.status).send(err.message)) as express.ErrorRequestHandler);

const root = getRoot();

const server = new ApolloServer({
  typeDefs: schema,
  resolvers: {
    Query: {
      login: (_, args, context) =>
        root.login(args, (name: string, value: string, options: {}) =>
          context.res.cookie(name, value, options),
        ),
      readCard: (_, args, context) => root.readCard(args, context.user),
      cards: (_, args, context) => root.cards(args, context.user),
      findNextCard: (_, __, context) => root.findNextCard(context.user),
    },
    Mutation: {
      createCard: (_, args, context) => root.createCard(args, context.user),
      updateCard: (_, args, context) => root.updateCard(args, context.user),
      deleteCard: (_, args, context) => root.deleteCard(args, context.user),
      setOk: (_, args, context) => root.setOk(args, context.user),
      setFailed: (_, args, context) => root.setFailed(args, context.user),
      enable: (_, args, context) => root.enable(args, context.user),
      disable: (_, args, context) => root.disable(args, context.user),
    },
  },
  context: ({ req, res }) => {
    const cookie = req.headers.cookie;

    if (cookie !== undefined) {
      const token = cookie.split("=")[1];
      const decodedToken = jsonwebtoken.verify(token, secret, {
        algorithms: ["RS256"],
      });

      if (typeof decodedToken === "object") {
        return {
          res,
          user: (decodedToken as { sub: unknown }).sub,
        };
      }
    }

    return {
      res,
    };
  },
});

server
  .listen()
  .then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
  })
  .catch(() => undefined);

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
