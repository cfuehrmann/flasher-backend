import { ApolloServer, AuthenticationError } from "apollo-server";
import * as bcrypt from "bcrypt";
import * as fs from "fs";
import * as jsonwebtoken from "jsonwebtoken";
import * as uuid from "uuid";

import * as domainLogic from "./domain-logic";
import * as loginTool from "./login-tool";
import {
  autoSaveRepositoryTools,
  credentialsRepositoryTools,
  repositoryTools,
} from "./production-config";
import { schema } from "./schema";
import * as securityFactory from "./security";

const root = getRoot();

const security = securityFactory.create({
  tokenDecoder: getTokenDecoder(
    fs.readFileSync(__dirname + "/../mount/public.key"),
  ),
});

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
      writeAutoSave: apollify(root.writeAutoSave),
      deleteAutoSave: apollify(root.deleteAutoSave),
    },
  },
  context: ({ req, res }) => ({
    res,
    ...security.getUser(req.headers.cookie),
  }),
});

server
  .listen()
  .then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
  })
  .catch(() => undefined);

function getRoot() {
  const credentialsRepository = credentialsRepositoryTools.connect();
  const autoSaveRepository = autoSaveRepositoryTools.connect();
  const readAutoSave = () => autoSaveRepository.read();
  const repository = repositoryTools.connect();

  const hashComparer = bcrypt.compare;

  const privateKey = fs.readFileSync(__dirname + "/../mount/private.key");

  const jsonWebTokenSigner = (payload: {}) =>
    jsonwebtoken.sign(payload, privateKey, { algorithm: "RS256" });

  const getTimeAsDate = () => new Date();
  const createUuid = uuid.v4;

  return {
    ...loginTool.create({
      credentialsRepository,
      readAutoSave,
      hashComparer,
      jsonWebTokenSigner,
      getTimeAsDate,
    }),
    ...domainLogic.create({
      repository,
      autoSaveWriter: autoSaveRepository,
      getTimeAsDate,
      createUuid,
    }),
  };
}

function getTokenDecoder(secret: Buffer) {
  return (token: string) => {
    const result = jsonwebtoken.verify(token, secret, {
      algorithms: ["RS256"],
    });

    if (typeof result === "string") {
      throw new AuthenticationError("invalidToken");
    }

    return result;
  };
}

function apollify<T, A, C extends { user: string | undefined }, R>(
  resolver: (args: A, user: string) => R,
) {
  return (_: T, args: A, context: C) => {
    const user = context.user;

    if (user === undefined) {
      throw new AuthenticationError("unauthenticated");
    }

    return resolver(args, user);
  };
}
