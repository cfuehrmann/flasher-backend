"use strict";

const assert = require("assert");
const getGraphQLRoot = require("../graphqlroot");

describe("getGraphQLRoot", () => {
  it("should return an object", () => {
    const root = getGraphQLRoot({});

    assert.strictEqual(typeof root, "object");
    assert.strictEqual(typeof root.test, "function");
    assert.strictEqual(typeof root.tests, "function");
    assert.strictEqual(typeof root.updateTest, "function");
  });

  it("should return frozen object", () => {
    const root = getGraphQLRoot({});

    // @ts-ignore
    assert.throws(() => (root.test = "whatever"));
  });

  describe("test", () => {
    it("should return database result when found", () => {
      const test = { id: "42" };

      const root = getGraphQLRoot({
        getTest: id => (id === "42" ? test : undefined)
      });

      const result = root.test({ id: "42" });

      assert.strictEqual(result, test);
    });

    it("should return undefined when not found", () => {
      const root = getGraphQLRoot({
        getTest: () => undefined
      });

      const result = root.test({ id: "42" });

      assert.strictEqual(result, undefined);
    });
  });

  describe("tests", () => {
    it("should return database result when found", () => {
      const test = {};

      const root = getGraphQLRoot({
        findTests: substring => (substring === "ohn smit" ? test : undefined)
      });

      const result = root.tests({ substring: "ohn smit" });

      assert.strictEqual(result, test);
    });
  });

  describe("tests", () => {
    it("should return undefined when not found", () => {
      const root = getGraphQLRoot({
        findTests: () => undefined
      });

      const result = root.tests({ substring: "ohn smit" });

      assert.strictEqual(result, undefined);
    });
  });
});
