import * as assert from "assert";

import * as securityFactory from "../app/security";

const dependencies: securityFactory.Dependencies = {
  tokenDecoder: token => ({ sub: "user" }),
};

const tokenValue = "tokenValue";

describe("security", () => {
  it("create should not crash", () => {
    securityFactory.create(dependencies);
  });

  describe("getUser", () => {
    it("should return user when one assignment has right name", () => {
      const user = "user";
      const security = securityFactory.create({
        tokenDecoder: token => (token === tokenValue ? { sub: user } : {}),
      });

      const result = security.getUser(
        `cookie1=value1; jwt=${tokenValue}; cookie3=value3`,
      );

      assert.deepStrictEqual(result, { user });
    });

    it("should return no user on undefined", () => {
      const security = securityFactory.create(dependencies);

      const result = security.getUser();

      assert.deepStrictEqual(result, {});
    });

    it("should return no user on empty string", () => {
      const security = securityFactory.create(dependencies);

      const result = security.getUser(``);

      assert.deepStrictEqual(result, {});
    });

    it("should return no user on cookie with wrong name", () => {
      const security = securityFactory.create(dependencies);

      const result = security.getUser(`cookieName=value`);

      assert.deepStrictEqual(result, {});
    });

    it("should return no user on multiple jwt cookies", () => {
      const security = securityFactory.create(dependencies);

      const result = security.getUser(`jwt=a; jwt=b`);

      assert.deepStrictEqual(result, {});
    });

    it("should return no when decoder crashes", () => {
      const security = securityFactory.create({
        tokenDecoder: token => {
          throw new Error();
        },
      });

      const result = security.getUser(`jwt=a`);

      assert.deepStrictEqual(result, {});
    });

    it("should return no user on malformed single assignment", () => {
      const security = securityFactory.create(dependencies);

      const result = security.getUser(`jwt`);

      assert.deepStrictEqual(result, {});
    });

    it("should return no user on malformed assignment", () => {
      const security = securityFactory.create(dependencies);

      const result = security.getUser(`jwt=a; xxx`);

      assert.deepStrictEqual(result, {});
    });
  });
});
