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
    parent: unknown,
    { userName, password }: Credentials,
    context: unknown,
    info: unknown,
  ) => {
    const passwordHash = credentialsRepository.getPasswordHash(userName);

    if (passwordHash !== undefined) {
      const success = await hashComparer(password, passwordHash);

      if (success) {
        return jsonWebTokenSigner({ sub: userName });
      }
    }

    throw new Error(userNotFoundOrInvalidPassword);
  },
});
