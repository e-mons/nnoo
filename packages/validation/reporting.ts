import { z } from 'zod';

export const dashboardParamsSchema = z.object({
  business_id: z.string().uuid(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
});

export type DashboardParams = z.infer<typeof dashboardParamsSchema>;
