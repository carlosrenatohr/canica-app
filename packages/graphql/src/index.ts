// GraphQL package entrypoint: schema, context, resolvers, and Yoga factory.
export { typeDefs } from "./schema";
export { resolvers } from "./resolvers";
export { defaultContext, requireAuth, requireRole } from "./context";
export type { GraphQLContext } from "./context";

// Convenience: build a Yoga GraphQL schema from this package's types+resolvers.
export { buildServerSchema } from "./createServer";
