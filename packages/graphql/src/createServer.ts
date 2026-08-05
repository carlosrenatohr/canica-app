// Build a Yoga-ready GraphQL schema from SDL + resolvers.
import { createSchema } from "graphql-yoga";
import { resolvers } from "./resolvers";
import { typeDefs } from "./schema";

export function buildServerSchema() {
  return createSchema({
    typeDefs,
    resolvers,
  });
}
