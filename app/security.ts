export type Dependencies = {
  tokenDecoder: (token: string) => { sub?: string };
};

export const create = ({ tokenDecoder }: Dependencies) => ({
  getUser(cookieString?: string): { user?: string } {
    let user: string | undefined;

    if (cookieString === undefined) {
      return {};
    }

    const assignments = cookieString.split("; ");
    let found = false;

    for (const assignment of assignments) {
      const [name, value] = assignment.split("=");

      if (value === undefined) {
        return {};
      }

      if (name === "jwt") {
        if (found) {
          return {};
        }

        found = true;

        try {
          const decodedToken = tokenDecoder(value);
          user = decodedToken.sub;
        } catch (e) {
          return {};
        }
      }
    }

    return user !== undefined
      ? {
          user,
        }
      : {};
  },
});
