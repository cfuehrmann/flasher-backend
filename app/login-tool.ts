import { addMinutes } from "date-fns";

import { AutoSave, CredentialsRepository } from "./types";

export type Dependencies = {
  credentialsRepository: CredentialsRepository;
  readAutoSave: () => Promise<AutoSave | undefined>;
  hashComparer: (data: string, encrypted: string) => Promise<boolean>;
  jsonWebTokenSigner: (payload: {}) => string;
  getTimeAsDate: () => Date;
};

export type Credentials = { userName: string; password: string };

export const userNotFoundOrInvalidPassword = "userNotFoundOrInvalidPassword";

const tokenLifeTimeMinutes = 30;

export const create = ({
  credentialsRepository,
  readAutoSave,
  hashComparer,
  jsonWebTokenSigner,
  getTimeAsDate,
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
        path?: string;
      },
    ) => void,
  ) => {
    const passwordHash = credentialsRepository.getPasswordHash(userName);

    if (passwordHash !== undefined) {
      const success = await hashComparer(password, passwordHash);

      if (success) {
        const token = jsonWebTokenSigner({
          sub: userName,
          exp: Math.floor(
            addMinutes(getTimeAsDate(), tokenLifeTimeMinutes).getTime() / 1000,
          ),
        });

        cookieSetter("__Host-jwt", token, {
          maxAge: 1000 * 60 * tokenLifeTimeMinutes, // half an hour in milliseconds
          httpOnly: true,
          secure: true,
          sameSite: true,
          path: "/",
        });

        const autoSave = await readAutoSave();

        return { autoSave };
      }
    }

    throw new Error(userNotFoundOrInvalidPassword);
  },
});
