// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient(); // ไม่มี log config = no query logs
export default prisma;
