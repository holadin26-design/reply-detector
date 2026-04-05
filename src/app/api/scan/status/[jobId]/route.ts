import { NextResponse } from 'next/server';
import { scanJobs } from '@/lib/scan-state';

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  const jobId = params.jobId;
  const job = scanJobs[jobId];

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json(job);
}
