import { ApolloServer, AuthenticationError } from "apollo-server";
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

const root = getRoot();
const secret = fs.readFileSync(__dirname + "/../mount/public.key");

const server = new ApolloServer({
  typeDefs: schema,
  resolvers: {
    Query: {
      login: (_, args, context) =>
        root.login(args, (name: string, value: string, options: {}) =>
          context.res.cookie(name, value, options),
        ),
      readCard: apollify(root.readCard),
      cards: apollify(root.cards),
      findNextCard: apollify(root.findNextCard),
    },
    Mutation: {
      createCard: apollify(root.createCard),
      updateCard: apollify(root.updateCard),
      deleteCard: apollify(root.deleteCard),
      setOk: apollify(root.setOk),
      setFailed: apollify(root.setFailed),
      enable: apollify(root.enable),
      disable: apollify(root.disable),
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

function apollify<T, A, C extends { user: string | undefined }, R>(
  resolver: (args: A, user: string) => R,
) {
  return (_: T, args: A, context: C) => {
    const user = context.user;

    if (user === undefined) {
      // todo: change the lines below to check for authentication
      return resolver(args, "dummyUser");
      // throw new AuthenticationError("unauthenticated");
    }

    return resolver(args, user);
  };
}
