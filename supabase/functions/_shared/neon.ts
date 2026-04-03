import postgres from "npm:postgres@3.4.7";

let sqlClient: postgres.Sql | null = null;

function normalizeDatabaseUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);

    // postgres.js in Deno can fail with Neon URLs that include channel_binding.
    parsed.searchParams.delete("channel_binding");

    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

export function getNeonSql() {
  if (sqlClient) {
    return sqlClient;
  }

  const databaseUrl = Deno.env.get("NEON_DATABASE_URL") ?? Deno.env.get("DATABASE_URL");

  if (!databaseUrl) {
    throw new Error("Missing Neon database configuration (NEON_DATABASE_URL or DATABASE_URL)");
  }

  sqlClient = postgres(normalizeDatabaseUrl(databaseUrl), {
    ssl: "require",
    max: 3,
    prepare: false,
  });

  return sqlClient;
}