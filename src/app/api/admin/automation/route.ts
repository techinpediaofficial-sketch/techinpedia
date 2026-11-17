import { NextResponse } from 'next/server';
import { GET as getWorkflows, POST as createWorkflow } from '@/app/api/automation/workflows/route';

export async function GET(request: Request) {
  return getWorkflows(request);
}

export async function POST(request: Request) {
  return createWorkflow(request);
}
