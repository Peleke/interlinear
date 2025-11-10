/**
 * Latin Services Health Check API
 *
 * GET /api/latin/health
 * Returns health status of Latin analysis services
 */

import { NextResponse } from 'next/server';
import { getLatinAnalysisService } from '@/services/LatinAnalysisService';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const service = getLatinAnalysisService();

    // Check CLTK microservice health
    const cltkHealthy = await service.isServiceHealthy();

    // Check dictionary service (always available - in-memory)
    let dictionaryHealthy = false;
    try {
      await service.initialize();
      dictionaryHealthy = true;
    } catch (error) {
      console.error('Dictionary initialization error:', error);
    }

    // Get cache stats
    const cacheStats = service.getCacheStats();

    const isHealthy = dictionaryHealthy; // Core service works even without CLTK
    const status = isHealthy ? 'healthy' : 'degraded';

    return NextResponse.json({
      status,
      services: {
        dictionary: {
          status: dictionaryHealthy ? 'healthy' : 'unavailable',
          type: 'Lewis & Short (in-memory)',
        },
        morphology: {
          status: cltkHealthy ? 'healthy' : 'unavailable',
          type: 'CLTK microservice',
          url: process.env.NEXT_PUBLIC_CLTK_SERVICE_URL || 'http://localhost:8000',
        },
      },
      cache: {
        enabled: true,
        entries: cacheStats.size,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
