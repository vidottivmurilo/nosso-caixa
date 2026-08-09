import type { PrismaClient } from '@prisma/client';
import { mockDeep, type DeepMockProxy } from 'vitest-mock-extended';

export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;
