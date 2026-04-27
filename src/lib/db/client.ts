// Database client placeholder.
// Replace with your preferred ORM/driver (e.g. Prisma, Drizzle, pg).

let _client: unknown = null;

export function getDbClient() {
  if (!_client) {
    // TODO: initialise your DB connection here
    // e.g. new PrismaClient(), drizzle(connectionString), etc.
    throw new Error("Database client is not yet configured");
  }
  return _client;
}
