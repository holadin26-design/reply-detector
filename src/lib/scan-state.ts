// Simple in-memory tracker for progress
// Note: In serverless environments like Vercel, this state is ephemeral 
// and only persists while the lambda instance is warm.
export const scanJobs: Record<string, {
  status: 'running' | 'completed' | 'error';
  fetched: number;
  analyzed: number;
  positives: number;
  error?: string;
}> = {};
