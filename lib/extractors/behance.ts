import * as cheerio from 'cheerio';
import { Extractor, MediaItem } from './types';

const READER_BASE_URL = 'https://r.jina.ai/';

function getBehanceProjectId(url: string): string | null {
    try {
        const parsed = new URL(url);
        const parts = parsed.pathname.split('/').filter(Boolean);
        const galleryIndex = parts.findIndex((part) => part === 'gallery');
        const id = galleryIndex >= 0 ? parts[galleryIndex + 1] : null;
        return id && /^\d+$/.test(id) ? id : null;
    } catch {
        return null;
    }
}

function cleanAssetUrl(url: string) {
    return url
        .replace(/&amp;/g, '&')
        .replace(/[)\],.]+$/g, '')
        .split('?')[0];
}

function getOriginalProjectModuleUrl(url: string) {
    return cleanAssetUrl(url).replace(/\/project_modules\/[^/]+\//i, '/project_modules/source/');
}

function getExtensionFromUrl(url: string) {
    const ext = cleanAssetUrl(url).split('.').pop()?.toLowerCase();
    if (!ext) return 'jpg';
    return ext.length <= 5 ? ext : 'jpg';
}

function titleFromAlt(alt: string | undefined, fallback: string) {
    if (!alt) return fallback;
    return alt
        .replace(/^Image\s*\d+\s*:\s*/i, '')
        .replace(/\s+/g, ' ')
        .trim() || fallback;
}

export class BehanceExtractor implements Extractor {
    platform = 'Behance';

    canHandle(url: string): boolean {
        try {
            const parsedUrl = new URL(url);
            return parsedUrl.hostname.toLowerCase().includes('behance.net');
        } catch {
            return false;
        }
    }

    private async extractFromReader(url: string): Promise<MediaItem[]> {
        const projectId = getBehanceProjectId(url);
        const readerUrl = `${READER_BASE_URL}${url}`;

        const response = await fetch(readerUrl, {
            headers: {
                'Accept': 'text/plain',
                'User-Agent': 'Mozilla/5.0 (compatible; BeDownloader/1.0; +https://bedownloader.vercel.app/)'
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`Reader fallback failed with status code ${response.status}`);
        }

        const markdown = await response.text();
        const projectSection = markdown.split(/\nJoin Behance\b/i)[0] || markdown;
        const seen = new Set<string>();
        const results: MediaItem[] = [];

        const addUrl = (rawUrl: string, alt?: string) => {
            const thumbUrl = cleanAssetUrl(rawUrl);
            const downloadUrl = getOriginalProjectModuleUrl(thumbUrl);

            if (projectId && !downloadUrl.includes(projectId)) return;
            if (!/\/project_modules\//i.test(downloadUrl)) return;
            if (seen.has(downloadUrl)) return;

            seen.add(downloadUrl);
            const ext = getExtensionFromUrl(downloadUrl);
            const isGif = ext === 'gif' || downloadUrl.toLowerCase().includes('.gif');

            results.push({
                id: `be-reader-${results.length + 1}`,
                title: titleFromAlt(alt, isGif ? `Animation ${results.length + 1}` : `Image ${results.length + 1}`),
                type: isGif ? 'animation' : 'image',
                ext,
                thumbUrl,
                downloadUrl,
                variants: thumbUrl !== downloadUrl ? [
                    { resolution: 'Original', downloadUrl },
                    { resolution: 'Preview', downloadUrl: thumbUrl }
                ] : undefined
            });
        };

        const markdownImageRegex = /!\[([^\]]*)\]\((https:\/\/mir-s3-cdn-cf\.behance\.net\/project_modules\/[^\s)]+)\)/g;
        let imageMatch: RegExpExecArray | null;
        while ((imageMatch = markdownImageRegex.exec(projectSection)) !== null) {
            addUrl(imageMatch[2], imageMatch[1]);
        }

        const urlRegex = /https:\/\/mir-s3-cdn-cf\.behance\.net\/project_modules\/[^\s)"'<]+/g;
        let urlMatch: RegExpExecArray | null;
        while ((urlMatch = urlRegex.exec(projectSection)) !== null) {
            addUrl(urlMatch[0]);
        }

        return results;
    }

    async extract(url: string): Promise<MediaItem[]> {
        const userAgents = [
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1'
        ];

        let lastError: any = null;

        for (let i = 0; i < userAgents.length; i++) {
            try {
                const ua = userAgents[i];
                console.log(`--- Behance Extraction Attempt ${i + 1} (UA: ${ua.substring(0, 30)}...) ---`);

                const response = await fetch(url, {
                    headers: {
                        'User-Agent': ua,
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache',
                        'Sec-Ch-Ua': ua.includes('Windows') ? '"Chromium";v="125", "Google Chrome";v="125", "Not-A.Brand";v="99"' : '',
                        'Sec-Ch-Ua-Mobile': ua.includes('Mobile') ? '?1' : '?0',
                        'Sec-Ch-Ua-Platform': ua.includes('Macintosh') ? '"macOS"' : (ua.includes('Windows') ? '"Windows"' : '"Linux"'),
                        'Sec-Fetch-Dest': 'document',
                        'Sec-Fetch-Mode': 'navigate',
                        'Sec-Fetch-Site': 'none',
                        'Sec-Fetch-User': '?1',
                        'Upgrade-Insecure-Requests': '1',
                        'Referer': 'https://www.google.com/'
                    },
                    next: { revalidate: 0 }
                });

                if (response.status === 403) {
                    console.warn(`Attempt ${i + 1} failed with 403`);
                    lastError = new Error('Behance blocked this request (403).');
                    continue; // Try next UA
                }

                if (!response.ok) {
                    throw new Error(`Request failed with status code ${response.status}`);
                }

                const html = await response.text();
                const $ = cheerio.load(html);
                
                // Look for the project data script
                const scriptId = 'beconfig-store_state';
                let scriptContent = $(`#${scriptId}`).html();
                
                let projectData: any = null;

                if (scriptContent) {
                    try {
                        const jsonMatch = scriptContent.match(/\{.*\}/s);
                        if (jsonMatch) {
                            projectData = JSON.parse(jsonMatch[0]);
                        }
                    } catch (e) { }
                }

                // Fallback: search all scripts for the project JSON
                if (!projectData) {
                    $('script').each((_, script) => {
                        const content = $(script).html() || '';
                        if (content.includes('"project":') && content.includes('"modules":')) {
                            const startIdx = content.indexOf('{"project":');
                            if (startIdx !== -1) {
                                try {
                                    const endIdx = content.lastIndexOf('}');
                                    if (endIdx > startIdx) {
                                        projectData = JSON.parse(content.substring(startIdx, endIdx + 1));
                                        return false; // Break loop
                                    }
                                } catch (e) { }
                            }
                        }
                    });
                }

                if (!projectData) {
                    // If we got the page but no data, maybe it's a different layout or we're still being soft-blocked
                    console.warn(`Attempt ${i + 1} succeeded but no project data found. Page title: ${$('title').text()}`);
                    if ($('title').text().includes('Robot') || $('title').text().includes('Access Denied')) {
                        lastError = new Error('Behance detected bot behavior (soft block).');
                        continue;
                    }
                    const fallbackItems = await this.extractFromReader(url);
                    if (fallbackItems.length > 0) return fallbackItems;
                    return [];
                }

                // Extract project and modules
                const project = projectData.project?.project || projectData.project || {};
                const modules = project.allModules || project.modules || [];
                const results: MediaItem[] = [];
                const seen = new Set();

                const getBestUrl = (imageSizes: any) => {
                    if (!imageSizes) return null;
                    const all = imageSizes.allAvailable || [];
                    const preferredTypes = ['fs_webp', 'original_webp', 'max_3840_webp', 'max_1920_webp'];

                    if (all.length > 0) {
                        for (const type of preferredTypes) {
                            const match = all.find((s: any) => s.type === type || s.key === type);
                            if (match && match.url) return match.url;
                        }
                        const source = all.find((s: any) => s.type === 'source' || s.type === 'original');
                        if (source && source.url) return source.url;
                        const sorted = [...all].sort((a: any, b: any) => (parseInt(b.width) || 0) - (parseInt(a.width) || 0));
                        if (sorted[0] && sorted[0].url) return sorted[0].url;
                    }

                    const priority = ['fs_webp', 'source', 'max_3840', 'size_2560', 'size_2000', 'size_1400', 'size_1200'];
                    for (const key of priority) {
                        if (imageSizes[key]) {
                            const item = imageSizes[key];
                            return typeof item === 'string' ? item : (item.url || item.src);
                        }
                    }
                    return null;
                };

                const addAsset = (asset: any) => {
                    if (!asset.downloadUrl || seen.has(asset.downloadUrl)) return;
                    seen.add(asset.downloadUrl);

                    const lowerUrl = asset.downloadUrl.toLowerCase();
                    if (lowerUrl.includes('.gif')) {
                        asset.type = 'animation';
                        asset.ext = 'gif';
                    }

                    results.push(asset);
                };

                modules.forEach((mod: any, index: number) => {
                    const type = mod.__typename || mod.type;

                    if (type === 'ImageModule' || type === 'image') {
                        const url = getBestUrl(mod.imageSizes || {});
                        if (url) {
                            addAsset({
                                id: `be-${mod.id || index}`,
                                title: mod.caption || mod.altText || `Image ${index + 1}`,
                                type: 'image',
                                ext: url.split('.').pop()?.split('?')[0] || 'jpg',
                                thumbUrl: url,
                                downloadUrl: url
                            });
                        }
                    } else if (type === 'MediaCollectionModule' || type === 'image_set' || type === 'media_collection') {
                        const components = mod.components || mod.images || [];
                        components.forEach((comp: any, cIdx: number) => {
                            const url = getBestUrl(comp.imageSizes || comp.sizes || {});
                            if (url) {
                                addAsset({
                                    id: `be-${mod.id || index}-${cIdx}`,
                                    title: comp.caption || `Asset ${index + 1}-${cIdx + 1}`,
                                    type: 'image',
                                    ext: url.split('.').pop()?.split('?')[0] || 'jpg',
                                    thumbUrl: url,
                                    downloadUrl: url
                                });
                            }
                        });
                    } else if (type === 'EmbedModule' || type === 'video' || type === 'VideoModule' || type === 'ExternalVideoModule') {
                        const embedHtml = (mod.originalEmbed || mod.fluidEmbed || mod.embed || mod.html || '').replace(/&amp;/g, '&');
                        const srcMatch = embedHtml.match(/src="([^"]+)"/i);
                        const src = srcMatch ? srcMatch[1] : null;

                        if (src) {
                            if (src.includes('.gif')) {
                                addAsset({
                                    id: `be-gif-${mod.id || index}`,
                                    title: mod.caption || `Animation ${index + 1}`,
                                    type: 'animation',
                                    ext: 'gif',
                                    thumbUrl: src,
                                    downloadUrl: src
                                });
                                return;
                            }

                            // Vimeo
                            const vimeoMatch = src.match(/vimeo\.com\/video\/(\d+)/i);
                            if (vimeoMatch) {
                                addAsset({
                                    id: `be-v-1-${mod.id || index}`,
                                    title: mod.caption || `Vimeo Video`,
                                    type: 'video',
                                    ext: 'mp4',
                                    thumbUrl: `https://vumbnail.com/${vimeoMatch[1]}.jpg`,
                                    downloadUrl: `https://vimeo.com/${vimeoMatch[1]}`
                                });
                                return;
                            }

                            // YouTube
                            const ytMatch = src.match(/(?:youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/watch\?v=)([^"?&]+)/i);
                            if (ytMatch) {
                                addAsset({
                                    id: `be-y-1-${mod.id || index}`,
                                    title: mod.caption || `YouTube Video`,
                                    type: 'video',
                                    ext: 'mp4',
                                    thumbUrl: `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`,
                                    downloadUrl: `https://youtube.com/watch?v=${ytMatch[1]}`
                                });
                                return;
                            }

                            // Generic Embed
                            addAsset({
                                id: `be-emb-${mod.id || index}`,
                                title: mod.caption || `Embedded Media`,
                                type: 'video',
                                ext: 'mp4',
                                thumbUrl: '',
                                downloadUrl: src
                            });
                        }
                    }
                });

                if (results.length > 0) return results;

                const fallbackItems = await this.extractFromReader(url);
                if (fallbackItems.length > 0) return fallbackItems;

                return results;

            } catch (error: any) {
                console.error(`Attempt ${i + 1} failed:`, error.message);
                lastError = error;
                // Continue to next attempt if it's a 403 or network error
            }
        }

        try {
            const fallbackItems = await this.extractFromReader(url);
            if (fallbackItems.length > 0) return fallbackItems;
        } catch (fallbackError: any) {
            console.error('Reader fallback failed:', fallbackError?.message || fallbackError);
        }

        throw lastError || new Error('All extraction attempts failed.');
    }
}
