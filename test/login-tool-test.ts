import * as assert from "assert";

import * as loginTool from "../app/login-tool";

const dependencies: loginTool.Dependencies = {
  credentialsRepository: {
    getPasswordHash: userName => {
      throw new Error();
    },
  },
  readAutoSave: () => {
    throw new Error();
  },
  hashComparer: (data, encrypted) => {
    throw new Error();
  },
  jsonWebTokenSigner: payload => {
    throw new Error();
  },
  getTimeAsDate: () => {
    throw new Error();
  },
};

const credentials: loginTool.Credentials = {
  userName: "Joe",
  password: "123456",
};

describe("loginTool", () => {
  it("create should not crash", () => {
    loginTool.create(dependencies);
  });

  describe("login", () => {
    it("should reject when the user is not found", async () => {
      const tool = loginTool.create({
        ...dependencies,
        credentialsRepository: {
          getPasswordHash: userName => undefined,
        },
      });

      await assert.rejects(tool.login(credentials, () => undefined), {
        name: "Error",
        message: loginTool.userNotFoundOrInvalidPassword,
      });
    });

    it("should reject when the password is invalid", async () => {
      const tool = loginTool.create({
        ...dependencies,
        credentialsRepository: {
          getPasswordHash: userName => "Joe",
        },
        hashComparer: async (data, encrypted) => false,
      });

      await assert.rejects(tool.login(credentials, () => undefined), {
        name: "Error",
        message: loginTool.userNotFoundOrInvalidPassword,
      });
    });

    it("should set a cookie when the the password is valid", async () => {
      const getTimeAsDate = () => new Date(2020, 6, 1);

      const tool = loginTool.create({
        credentialsRepository: {
          getPasswordHash: userName => "Joe",
        },
        readAutoSave: async () => undefined,
        hashComparer: async (data, encrypted) => true,
        jsonWebTokenSigner: payload => JSON.stringify(payload),
        getTimeAsDate,
      });

      await tool.login(credentials, (name, value, options) => {
        assert.strictEqual(name, "__Host-jwt");
        const valueObject = JSON.parse(value);
        assert.strictEqual(valueObject.sub, "Joe");
        assert.strictEqual(typeof valueObject.exp, "number");
        assert.ok(valueObject.exp > getTimeAsDate().getTime() / 1000);
        assert.strictEqual(options.httpOnly, true);
        assert.strictEqual(options.secure, true);
        assert.strictEqual(options.sameSite, true);
        assert.ok(
          options.maxAge !== undefined && Number.isInteger(options.maxAge),
        );
        assert.ok(options.maxAge !== undefined && options.maxAge > 0);
        assert.ok(options.path !== undefined && options.path.startsWith("/"));
      });
    });

    it("should return auto save", async () => {
      const getTimeAsDate = () => new Date(2020, 6, 1);
      const autoSave = { id: "id", prompt: "prompt", solution: "solution" };

      const tool = loginTool.create({
        credentialsRepository: {
          getPasswordHash: userName => "Joe",
        },
        readAutoSave: async () => autoSave,
        hashComparer: async (data, encrypted) => true,
        jsonWebTokenSigner: payload => JSON.stringify(payload),
        getTimeAsDate,
      });

      const result = await tool.login(credentials, () => undefined);

      assert.deepStrictEqual(result, { autoSave });
    });
  });
});
