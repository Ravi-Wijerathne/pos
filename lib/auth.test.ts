import { beforeEach, describe, expect, it, vi } from "vitest";

const { compareMock, findUniqueMock } = vi.hoisted(() => ({
  compareMock: vi.fn(),
  findUniqueMock: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  compare: compareMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: findUniqueMock,
    },
  },
}));

import { authorizeCredentials, authOptions } from "./auth";

describe("authOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when credentials are missing", async () => {
    await expect(authorizeCredentials({})).resolves.toBeNull();
  });

  it("returns a mapped user when credentials are valid", async () => {
    findUniqueMock.mockResolvedValue({
      id: 7,
      email: "admin@pos.com",
      name: "Admin User",
      role: "ADMIN",
      password: "hashed-password",
    });
    compareMock.mockResolvedValue(true);

    const user = await authorizeCredentials({
      email: "admin@pos.com",
      password: "secret",
    });

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { email: "admin@pos.com" },
    });
    expect(compareMock).toHaveBeenCalledWith("secret", "hashed-password");
    expect(user).toEqual({
      id: "7",
      email: "admin@pos.com",
      name: "Admin User",
      role: "ADMIN",
    });
  });

  it("preserves role and id in jwt and session callbacks", async () => {
    const token = await authOptions.callbacks?.jwt?.({
      token: {},
      user: { id: "7", role: "MANAGER" } as never,
      account: null,
      profile: undefined,
      trigger: undefined,
      isNewUser: false,
      session: undefined,
    });

    expect(token).toMatchObject({ id: "7", role: "MANAGER" });

    const session = await authOptions.callbacks?.session?.({
      session: { user: { name: "Admin" } } as never,
      token: { id: "7", role: "MANAGER" } as never,
      user: undefined,
      trigger: undefined,
      newSession: undefined,
    });

    expect(session?.user).toMatchObject({ id: "7", role: "MANAGER" });
  });
});