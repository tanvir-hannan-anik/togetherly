import { authClient } from "./auth-client";

export const getTokenFromClient = async () => {
  // Skip the token endpoint when logged out; it answers 401, which browsers log as a console error.
  const { data: session } = await authClient.getSession();
  if (!session) return undefined;
  const { data } = await authClient.token();
  return data?.token;
};
