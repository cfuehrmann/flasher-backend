"use strict";

const { buildSchema } = require("graphql");

module.exports = buildSchema(`
    type Query {
      test(id: ID!): Test
      tests(substring: String!): [Test]
    },
    type Mutation {
      updateTest(id: ID!, prompt: String, solution: String, isMinor: Boolean): Test
    },
    type Test {
      id: ID!
      prompt: String!
      solution: String!
      state: String!
      changeTime: String!
      lastTicks: Int!
      nextTime: String!
    }
  `);
