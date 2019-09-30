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
    cookieSetter: (
      name: string,
      value: string,
      options: {
        maxAge?: number;
        httpOnly?: boolean;
        secure?: boolean;
        sameSite?: boolean;
      },
    ) => void,
  ) => {
    const passwordHash = credentialsRepository.getPasswordHash(userName);

    if (passwordHash !== undefined) {
      const success = await hashComparer(password, passwordHash);

      if (success) {
        const token = jsonWebTokenSigner({ sub: userName });

        cookieSetter("jwt", token, {
          maxAge: 1000 * 60 * 30, // half an hour in milliseconds
          httpOnly: true,
          secure: true,
          sameSite: true,
        });

        return true;
      }
    }

    throw new Error(userNotFoundOrInvalidPassword);
  },
});
