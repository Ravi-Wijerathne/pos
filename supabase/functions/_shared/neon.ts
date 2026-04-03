import postgres from "npm:postgres@3.4.7";

let sqlClient: postgres.Sql | null = null;

export function getNeonSql() {
  if (sqlClient) {
    return sqlClient;
  }

  const databaseUrl = Deno.env.get("NEON_DATABASE_URL") ?? Deno.env.get("DATABASE_URL");

  if (!databaseUrl) {
    throw new Error("Missing Neon database configuration (NEON_DATABASE_URL or DATABASE_URL)");
  }

  sqlClient = postgres(databaseUrl, {
    ssl: "require",
    max: 3,
    prepare: false,
  });

  return sqlClient;
}