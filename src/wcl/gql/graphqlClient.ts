import { GraphQLClient } from "graphql-request";
import { getWCLAuthentication } from "../util/auth";

const API_URL = "https://www.warcraftlogs.com/api/v2/user";

export const createGraphQLClient = async () => {
  const accessToken = await getWCLAuthentication();

  return new GraphQLClient(API_URL, {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });
};
