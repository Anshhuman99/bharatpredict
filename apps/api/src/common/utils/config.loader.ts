import { z } from 'zod';

export const environmentSchema = z.object({
  PORT: z.coerce.number().default(4050),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
});

export type Environment = z.infer<typeof environmentSchema>;

export function loadEnvironment() {
  const result = environmentSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment configuration:');
    console.error(JSON.stringify(result.error.format(), null, 2));
    throw new Error('Invalid environment configuration');
  }

  return result.data;
}
