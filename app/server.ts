import { ApolloServer, gql } from "apollo-server";
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
  typeDefs: gql`
    type Query {
      login(userName: String!, password: String!): String
      readCard(id: ID!): Card
      cards(substring: String!): [Card]
      findNextCard: Card
    }
    type Mutation {
      createCard(prompt: String!, solution: String!): Boolean
      updateCard(
        id: ID!
        prompt: String
        solution: String
        isMinor: Boolean
      ): Card
      deleteCard(id: ID!): Boolean
      setOk(id: ID!): Boolean
      setFailed(id: ID!): Boolean
      enable(id: ID!): Boolean
      disable(id: ID!): Boolean
    }
    type Card {
      id: ID!
      prompt: String!
      solution: String
      state: String!
      changeTime: String!
      nextTime: String!
      disabled: Boolean!
    }
  `,
  resolvers: {
    Query: {
      login: (parent, args, context, info) => root.login(args, context),
      readCard: (parent, args, context, info) => root.readCard(args),
      cards: (parent, args, context, info) => root.cards(args),
      findNextCard: (parent, args, context, info) => root.findNextCard(context),
    },
    Mutation: {
      createCard: root.createCard,
      updateCard: root.updateCard,
      deleteCard: root.deleteCard,
      setOk: root.setOk,
      setFailed: root.setFailed,
      enable: root.enable,
      disable: root.disable,
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
