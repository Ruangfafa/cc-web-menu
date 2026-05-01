import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

/**
 * Prisma 单例
 *
 * 作用：
 * 1. 创建 PrismaClient，让项目可以操作 MySQL 数据库
 * 2. 在开发环境复用同一个 PrismaClient
 * 3. 避免 Next.js 热更新时反复创建数据库连接
 *
 * 对于 MySQL / MariaDB，Prisma 官方提供的是：
 *
 * @prisma/adapter-mariadb
 */
const globalForPrisma = globalThis as unknown as {
    prisma?: PrismaClient;
};

/**
 * 创建 PrismaClient
 *
 * PrismaMariaDb 的 constructor 接收：
 */
function createPrismaClient() {
    const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);

    return new PrismaClient({
        adapter,
    });
}

/**
 * 开发环境：
 * - 如果 globalThis 已经有 prisma，就直接复用
 * - 如果没有，就创建一个新的
 */
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

/**
 * 只在非生产环境缓存 PrismaClient。
 */
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}