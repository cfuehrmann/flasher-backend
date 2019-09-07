import * as assert from "assert";

import * as loginTool from "../app/login-tool";

const dependencies: loginTool.Dependencies = {
  credentialsRepository: {
    getPasswordHash: userName => {
      throw new Error();
    },
  },
  hashComparer: (data, encrypted) => {
    throw new Error();
  },
  jsonWebTokenSigner: payload => {
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

      await assert.rejects(tool.login(credentials), {
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

      await assert.rejects(tool.login(credentials), {
        name: "Error",
        message: loginTool.userNotFoundOrInvalidPassword,
      });
    });

    it("should return a token when the the password is valid", async () => {
      const tool = loginTool.create({
        credentialsRepository: {
          getPasswordHash: userName => "Joe",
        },
        hashComparer: async (data, encrypted) => true,
        jsonWebTokenSigner: payload => JSON.stringify(payload),
      });

      const result = await tool.login(credentials);

      assert.strictEqual(result, '{"sub":"Joe"}');
    });
  });
});
