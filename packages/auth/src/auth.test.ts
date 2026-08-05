import { describe, expect, it } from "vitest";
import { actorFromSession } from "./auth";

describe("actorFromSession", () => {
  it("returns null without a user", () => {
    expect(actorFromSession(null)).toBeNull();
  });

  it("returns null when organizationId is missing", () => {
    const session = {
      user: { id: "u1", email: "a@b.c", name: "A" },
    } as any;
    expect(actorFromSession(session)).toBeNull();
  });

  it("maps a session user to an actor", () => {
    const session = {
      user: {
        id: "u1",
        email: "a@b.c",
        name: "A",
        organizationId: "org1",
        role: "doctor",
      },
    } as any;
    expect(actorFromSession(session)).toEqual({
      userId: "u1",
      email: "a@b.c",
      name: "A",
      organizationId: "org1",
      role: "doctor",
    });
  });

  it("defaults role to doctor when absent", () => {
    const session = {
      user: { id: "u1", email: "a@b.c", name: "A", organizationId: "org1" },
    } as any;
    expect(actorFromSession(session)?.role).toBe("doctor");
  });
});
