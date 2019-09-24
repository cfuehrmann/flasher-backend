export type Dependencies = {
  tokenDecoder: (token: string) => { sub?: string };
};

export const create = ({ tokenDecoder }: Dependencies) => ({
  getUser(cookie?: string): { user?: string } {
    if (cookie !== undefined) {
      const token = cookie.split("=")[1];
      const decodedToken = tokenDecoder(token);
      const user = decodedToken.sub;
      console.log(user);

      return {
        user,
      };
    }

    return {};
  },
});
