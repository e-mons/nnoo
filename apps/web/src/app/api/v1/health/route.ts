import { NextResponse } from 'next/server';

/**
 * Public Liveness Health Check Endpoint.
 * Exposed for uptime monitors, load balancers, and container orchestrators.
 *
 * SECURITY: Returns strictly minimal status (0 database hostnames, 0 service keys, 0 secrets).
 */
export async function GET() {
  const payload = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'nnoo-web-api',
  };

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
