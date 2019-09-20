import { CredentialsRepository } from "./types";

export type Dependencies = {
  credentialsRepository: CredentialsRepository;
  hashComparer: (data: string, encrypted: string) => Promise<boolean>;
  jsonWebTokenSigner: (payload: {}) => string;
};

export type Credentials = { userName: string; password: string };

export const userNotFoundOrInvalidPassword = "userNotFoundOrInvalidPassword";

export const create = ({
  credentialsRepository,
  hashComparer,
  jsonWebTokenSigner,
}: Dependencies) => ({
  login: async (
    { userName, password }: Credentials,
    context: { res: { cookie: (x: string, y: string, z: {}) => unknown } },
  ) => {
    const passwordHash = credentialsRepository.getPasswordHash(userName);

    if (passwordHash !== undefined) {
      const success = await hashComparer(password, passwordHash);

      if (success) {
        const token = jsonWebTokenSigner({ sub: userName });
        context.res.cookie("jwt", token, {
          maxAge: 900000,
          httpOnly: true,
        });

        return token;
      }
    }

    throw new Error(userNotFoundOrInvalidPassword);
  },
});
