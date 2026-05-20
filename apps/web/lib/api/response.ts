import { NextResponse } from 'next/server';

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export const unauthorized = () => err('Unauthorized', 401);
export const notFound = () => err('Not found', 404);
