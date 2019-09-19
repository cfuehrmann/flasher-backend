import { ApolloServer, gql } from "apollo-server";
import * as bcrypt from "bcrypt";
import * as bodyParser from "body-parser";
// import express from "express";
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

// const app = express();

// app.use("/graphql", bodyParser.json());
// app.use(bodyParser.json());

const secret = fs.readFileSync(__dirname + "/../mount/public.key");

// Enable the code below to enforce authentication
// app.use(
//   jwt({ secret, algorithms: ["RS256"] }).unless(req =>
//     req.body.query.startsWith("query login"),
//   ),
// );

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
      login: (parent, args, context, info) =>
        root.login(parent, args, context, info),
      readCard: root.readCard,
      cards: root.cards,
      findNextCard: root.findNextCard,
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
  context: ({ req, res }: any) => ({
    res,
  }),
  formatResponse: (a: any, b: any) => {
    if (a.data.login) {
      b.context.res.cookie("cookieName", a.data.login, {
        maxAge: 900000,
        //, httpOnly: true
      });
    }
  },
});

// app.use(function(req, res, next) {
//   // no: set a new cookie
//   res.cookie("cookieName", "foo", { maxAge: 900000, httpOnly: true });
//   console.log("cookie created successfully");
//   next(); // <-- important!
// });

// server.applyMiddleware({ app, path: "/graphql" });

// app.listen(4000, () => {
//   console.log(`Express GraphQL Server Now Running On localhost:4000${server.graphqlPath}`);
// });

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
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
