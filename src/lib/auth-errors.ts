import { NextResponse } from 'next/server';

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Reusable helper to handle expected authorization and authentication errors.
 * Returns a NextResponse if the error was handled, or null if it's an unexpected server error.
 */
export function handleApiAuthError(error: unknown): NextResponse | null {
  if (error instanceof Error) {
    if (error.name === 'AuthenticationError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.name === 'AuthorizationError') {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }
  }
  return null;
}
