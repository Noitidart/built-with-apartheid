import type { Report } from '@prisma/client';

export type TReport = Report & { reportType: string };
