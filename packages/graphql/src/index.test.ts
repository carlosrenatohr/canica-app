import { describe, expect, it } from "vitest";
import { graphql } from "graphql";
import { buildServerSchema } from "../src/createServer";
import { defaultContext } from "../src/context";

// Smoke tests for the schema surface: introspection and a health query.
const schema = buildServerSchema();

describe("GraphQL schema", () => {
  it("parses the SDL", () => {
    expect(schema).toBeDefined();
  });

  it("exposes Query.health", async () => {
    const result = await graphql({
      schema,
      source: "{ health { ok service } }",
      contextValue: defaultContext,
    });
    expect(result.errors).toBeUndefined();
    expect(result.data?.health).toEqual({ ok: true, service: "canica-api" });
  });

  it("denies patients when unauthenticated", async () => {
    const result = await graphql({
      schema,
      source: "{ patients { id } }",
      contextValue: defaultContext,
    });
    expect(result.errors?.[0]?.message).toBe("Unauthorized");
  });
});
