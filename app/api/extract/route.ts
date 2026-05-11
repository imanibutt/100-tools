import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { getExtractor } from '@/lib/extractors';
import { extractionCache as cache } from '@/lib/cache';

// Removed local cache definition in favor of shared singleton


// Rate limiting map (simple in-memory)
const rateLimitMap = new Map<string, number>();
const MIN_REQUEST_INTERVAL_MS = 100; // Loosened for development/double-mounting

export async function GET(req: NextRequest) {
    const start = Date.now();
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    // 1. Validation
    if (!url) {
        return NextResponse.json({ error: { code: 'MISSING_URL', message: 'URL parameter is required' } }, { status: 400 });
    }

    // 2. Security Check
    // Extraction URLs are validated by the selected extractor, but still block local targets.
    try {
        const parsed = new URL(url);
        if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
            return NextResponse.json({ error: { code: 'INVALID_URL', message: 'Localhost not allowed' } }, { status: 400 });
        }
    } catch (e) {
        return NextResponse.json({ error: { code: 'INVALID_URL', message: 'Invalid URL' } }, { status: 400 });
    }


    // 3. Rate Limiting
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const lastRequest = rateLimitMap.get(ip);
    if (lastRequest && Date.now() - lastRequest < MIN_REQUEST_INTERVAL_MS) {
        return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Too many requests, please slow down' } }, { status: 429 });
    }
    rateLimitMap.set(ip, Date.now());

    // 4. Cache Check
    const cached = cache.get(url);
    if (cached) {
        return NextResponse.json({
            items: cached.items,
            meta: {
                ...cached.meta,
                cached: true,
                elapsedMs: Date.now() - start
            }
        });
    }

    try {
        // 5. Extraction
        const extractor = getExtractor(url);
        if (!extractor) {
            return NextResponse.json({ error: { code: 'UNSUPPORTED', message: 'No extractor found for this URL' } }, { status: 400 });
        }

        const items = await extractor.extract(url);

        // 6. Standard Response
        const responseData = {
            items,
            meta: {
                sourceUrl: url,
                assetCount: items.length,
                platform: extractor.platform,
                extractedAt: new Date().toISOString(),
                cached: false,
                elapsedMs: Date.now() - start
            }
        };

        if (items.length > 0) {
            cache.set(url, responseData);
        }

        return NextResponse.json(responseData);

    } catch (error: any) {
        console.error('Extraction error:', error);

        const msg = error?.message || 'Failed to extract assets';
        const isClientError = typeof msg === 'string' && (
            msg.includes('blocked this request') ||
            msg.includes('WAF challenge') ||
            msg.includes('Invalid') ||
            msg.includes('No extractor')
        );

        return NextResponse.json({
            error: {
                code: isClientError ? 'UNSUPPORTED' : 'EXTRACTION_FAILED',
                message: msg
            }
        }, { status: isClientError ? 400 : 500 });
    }
}
