import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

// One shared client across hot reloads / serverless invocations.
// Aiven free tier allows only 20 connections and has no pooler on its side —
// so we deliberately keep OUR pool tiny (max 4) and reuse it everywhere.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({
  connectionString: (() => {
    const url = process.env.DATABASE_URL ?? "";
    // connection_limit=?pg is Prisma-only syntax; the pg driver uses `max`.
    // Strip it from the URL we hand to the driver.
    return url.replace(/[?&]connection_limit=\d+/g, "");
  })(),
  max: 4,
});

const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export { prisma };