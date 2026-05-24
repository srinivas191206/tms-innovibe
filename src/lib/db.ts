import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  const { getCloudflareContext } = require('@opennextjs/cloudflare');
  const { env } = getCloudflareContext();
  const connectionString = env.DATABASE_URL || process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  const globalForPrisma = global as unknown as { prisma: PrismaClient };
  prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
      log: ['query'],
    });
  globalForPrisma.prisma = prisma;
}

export { prisma };
export default prisma;
