import https from 'node:https';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type {
  CourseChapter,
  EducationalVideo,
  VideoRelevanceEvaluation,
} from '../types/index.ts';

export const NO_RELEVANT_VIDEOS_MESSAGE =
  'No relevant educational videos found for this chapter. Please try again later.';

export const DEFAULT_RELEVANCE_THRESHOLD = (() => {
  const parsed = Number(process.env.VIDEO_RELEVANCE_THRESHOLD);
  if (Number.isFinite(parsed) && parsed >= 50 && parsed <= 100) {
    return Math.round(parsed);
  }
  return 80;
})();

export interface RawYouTubeCandidate {
  id: string;
  title: string;
  description: string;
  channel: string;
  duration: string;
  durationMinutes: number;
  embedUrl: string;
  thumbnailUrl: string;
  isEmbeddable: boolean;
  tags?: string[];
  defaultAudioLanguage?: string;
  source: 'youtube_api' | 'youtube_search' | 'injected';
}

export interface ChapterVideoContext {
  courseTopic: string;
  category: string;
  chapterTitle: string;
  chapterDescription?: string;
  subtopics?: string[];
  importantConcepts?: string[];
  learningObjectives?: string[];
  difficulty?: string;
  language?: string;
  suggestedSearchQuery?: string;
  targetMinutes?: number;
  limit?: number;
  threshold?: number;
}

export interface ChapterVideoRecommendationResult {
  courseTopic: string;
  category: string;
  chapterTitle: string;
  searchQueries: string[];
  primaryVideo: EducationalVideo | null;
  alternativeVideos: EducationalVideo[];
  approvedVideos: EducationalVideo[];
  rejectedVideos: Array<{
    id: string;
    title: string;
    channel: string;
    relevanceScore: number;
    reason: string;
  }>;
  status: 'found' | 'no_relevant_videos' | 'api_error' | 'disabled';
  message: string;
  threshold: number;
  error?: string;
}

export class YouTubeSearchError extends Error {
  statusCode?: number;
  isRetryable: boolean;

  constructor(message: string, statusCode?: number, isRetryable = false) {
    super(message);
    this.name = 'YouTubeSearchError';
    this.statusCode = statusCode;
    this.isRetryable = isRetryable;
  }
}

export interface VideoServiceDependencies {
  ai?: GoogleGenAI | null;
  youtubeApiKey?: string;
  searchOverride?: (query: string) => Promise<RawYouTubeCandidate[]>;
  verifyEmbeddable?: boolean;
  threshold?: number;
}

const chapterRecommendationCache = new Map<
  string,
  { expiresAt: number; result: ChapterVideoRecommendationResult }
>();
const CACHE_TTL_MS = 15 * 60 * 1000;

export function clearVideoRecommendationCache(): void {
  chapterRecommendationCache.clear();
}

// ---------------------------------------------------------------------------
// Generic & Domain Taxonomies (for strict conflict detection & scoring)
// ---------------------------------------------------------------------------

const GENERIC_WORDS = new Set([
  'introduction',
  'intro',
  'basics',
  'basic',
  'fundamentals',
  'fundamental',
  'overview',
  'concepts',
  'concept',
  'chapter',
  'lecture',
  'lesson',
  'module',
  'unit',
  'day',
  'part',
  'course',
  'tutorial',
  'guide',
  'explained',
  'for',
  'beginners',
  'beginner',
  'intermediate',
  'advanced',
  'advance',
  'and',
  'the',
  'with',
  'using',
  'from',
  'into',
  'core',
  'getting',
  'started',
  'complete',
  'full',
  'mastery',
  'masterclass',
  'learn',
  'learning',
  'practical',
  'real',
  'world',
  'applied',
  'project',
  'capstone',
  'case',
  'study',
  'foundation',
  'foundations',
  'essential',
  'essentials',
  'modern',
  'hands',
  'on',
  'step',
  'by',
  'how',
  'to',
  'what',
  'is',
  'are',
  'in',
  'of',
  'on',
  'at',
]);

type DomainId =
  | 'digital_marketing'
  | 'python'
  | 'machine_learning'
  | 'web_development'
  | 'dsa'
  | 'c_programming'
  | 'cpp'
  | 'java'
  | 'sql_dbms'
  | 'computer_networks'
  | 'operating_systems'
  | 'fitness_health';

interface DomainDefinition {
  id: DomainId;
  label: string;
  patterns: RegExp[];
  compatibleWith?: DomainId[];
}

const DOMAIN_DEFINITIONS: DomainDefinition[] = [
  {
    id: 'digital_marketing',
    label: 'Digital Marketing',
    patterns: [
      /\bdigital marketing\b/i,
      /\bsearch engine optimization\b/i,
      /\bseo\b/i,
      /\bsem\b/i,
      /\bppc\b/i,
      /\bpay per click\b/i,
      /\bgoogle ads\b/i,
      /\bfacebook ads\b/i,
      /\bmeta ads\b/i,
      /\bsocial media marketing\b/i,
      /\bemail marketing\b/i,
      /\bcontent marketing\b/i,
      /\baffiliate marketing\b/i,
      /\bmarketing analytics\b/i,
      /\bgoogle analytics\b/i,
      /\bconversion rate\b/i,
      /\bcopywriting\b/i,
      /\bkeyword research\b/i,
      /\bbacklink/i,
      /\badvertising\b/i,
    ],
  },
  {
    id: 'python',
    label: 'Python Programming',
    patterns: [
      /\bpython\b/i,
      /\bdjango\b/i,
      /\bflask\b/i,
      /\bfastapi\b/i,
      /\bpandas\b/i,
      /\bnumpy\b/i,
      /\bpep ?8\b/i,
      /\bf-string/i,
      /\blist comprehension/i,
    ],
    compatibleWith: ['machine_learning', 'dsa', 'web_development'],
  },
  {
    id: 'machine_learning',
    label: 'Machine Learning',
    patterns: [
      /\bmachine learning\b/i,
      /\bdeep learning\b/i,
      /\bneural network/i,
      /\bsupervised learning\b/i,
      /\bunsupervised learning\b/i,
      /\breinforcement learning\b/i,
      /\bgradient descent\b/i,
      /\bbackpropagation\b/i,
      /\bscikit-learn\b/i,
      /\btensorflow\b/i,
      /\bpytorch\b/i,
      /\blinear regression\b/i,
      /\blogistic regression\b/i,
      /\brandom forest\b/i,
      /\bk-means\b/i,
      /\bclustering\b/i,
    ],
    compatibleWith: ['python'],
  },
  {
    id: 'web_development',
    label: 'Web Development',
    patterns: [
      /\bweb development\b/i,
      /\bfrontend\b/i,
      /\bfront-end\b/i,
      /\bbackend\b/i,
      /\bfull[- ]?stack\b/i,
      /\bhtml5?\b/i,
      /\bcss3?\b/i,
      /\bflexbox\b/i,
      /\bcss grid\b/i,
      /\bjavascript\b/i,
      /\btypescript\b/i,
      /\breact(?:\.js|js)?\b/i,
      /\bnext\.?js\b/i,
      /\bnode\.?js\b/i,
      /\bexpress\.?js\b/i,
      /\btailwind\b/i,
      /\bdom manipulation\b/i,
      /\brest api\b/i,
    ],
    compatibleWith: ['python'],
  },
  {
    id: 'dsa',
    label: 'Data Structures and Algorithms',
    patterns: [
      /\bdata structures?\b/i,
      /\bdsa\b/i,
      /\balgorithms?\b/i,
      /\blinked list/i,
      /\bbinary tree/i,
      /\bbinary search\b/i,
      /\bmerge sort\b/i,
      /\bquick sort\b/i,
      /\bsorting algorithm/i,
      /\bsearching algorithm/i,
      /\bhash table/i,
      /\bhash map/i,
      /\bgraph traversal\b/i,
      /\bdynamic programming\b/i,
      /\bbig[- ]o\b/i,
      /\bleetcode\b/i,
      /\bstack and queue/i,
    ],
    compatibleWith: ['python', 'cpp', 'java', 'c_programming'],
  },
  {
    id: 'c_programming',
    label: 'C Programming',
    patterns: [
      /\bc programming\b/i,
      /\bc language\b/i,
      /\bansi c\b/i,
      /\bprintf\b/i,
      /\bscanf\b/i,
      /\bpointer arithmetic\b/i,
      /\bmalloc\b/i,
      /\bstdio\.h\b/i,
      /\bin c\b/i,
    ],
    compatibleWith: ['dsa'],
  },
  {
    id: 'cpp',
    label: 'C++ Programming',
    patterns: [/\bc\+\+\b/i, /\bcpp\b/i, /\bstd::/i, /\bstandard template library\b/i],
    compatibleWith: ['dsa'],
  },
  {
    id: 'java',
    label: 'Java Programming',
    patterns: [
      /\bjava\b(?!script)/i,
      /\bjvm\b/i,
      /\bjdk\b/i,
      /\bspring boot\b/i,
      /\bpublic static void main\b/i,
    ],
    compatibleWith: ['dsa'],
  },
  {
    id: 'sql_dbms',
    label: 'SQL & DBMS',
    patterns: [
      /\bsql\b/i,
      /\bdbms\b/i,
      /\bdatabase management\b/i,
      /\brelational database/i,
      /\bnormalization\b/i,
      /\bbcnf\b/i,
      /\b1nf\b|\b2nf\b|\b3nf\b/i,
      /\ber diagram/i,
      /\bprimary key\b/i,
      /\bforeign key\b/i,
      /\bpostgresql\b|\bmysql\b|\bsqlite\b/i,
    ],
  },
  {
    id: 'computer_networks',
    label: 'Computer Networks',
    patterns: [
      /\bcomputer network/i,
      /\bosi model\b/i,
      /\btcp\/ip\b/i,
      /\bsubnet/i,
      /\bipv4\b|\bipv6\b/i,
      /\brouting protocol/i,
      /\bpacket switching\b/i,
      /\bccna\b/i,
    ],
  },
  {
    id: 'operating_systems',
    label: 'Operating Systems',
    patterns: [
      /\boperating system/i,
      /\bcpu scheduling\b/i,
      /\bdeadlock/i,
      /\bbanker'?s algorithm\b/i,
      /\bvirtual memory\b/i,
      /\bpaging\b/i,
      /\bsemaphore\b/i,
    ],
  },
  {
    id: 'fitness_health',
    label: 'Fitness & Health',
    patterns: [
      /\bhypertrophy\b/i,
      /\bexercise physiology\b/i,
      /\bbiomechanics\b/i,
      /\bworkout\b/i,
      /\bstrength training\b/i,
      /\bmacronutrient/i,
    ],
  },
];

export function detectDomains(text: string): DomainId[] {
  const normalized = (text || '').toLowerCase();
  const matched: DomainId[] = [];
  for (const def of DOMAIN_DEFINITIONS) {
    if (def.patterns.some((re) => re.test(normalized))) {
      matched.push(def.id);
    }
  }
  return matched;
}

export function hasSubjectConflict(
  courseText: string,
  videoText: string
): { hasConflict: boolean; reason?: string } {
  const courseDomains = detectDomains(courseText);
  const videoDomains = detectDomains(videoText);

  if (courseDomains.length === 0 || videoDomains.length === 0) {
    // Still check explicit Java vs JavaScript trap even when one side only says "Java"
    const cLower = courseText.toLowerCase();
    const vLower = videoText.toLowerCase();
    const courseIsJs = /\bjavascript\b|\bjs\b/.test(cLower) && !/\bjava\b(?!script)/.test(cLower);
    const videoIsJavaOnly = /\bjava\b(?!script)/.test(vLower) && !/\bjavascript\b/.test(vLower);
    if (courseIsJs && videoIsJavaOnly) {
      return {
        hasConflict: true,
        reason: 'Video teaches Java programming instead of JavaScript.',
      };
    }
    const courseIsJavaOnly = /\bjava\b(?!script)/.test(cLower) && !/\bjavascript\b/.test(cLower);
    const videoIsJsOnly = /\bjavascript\b/.test(vLower) && !/\bjava\b(?!script)/.test(vLower);
    if (courseIsJavaOnly && videoIsJsOnly) {
      return {
        hasConflict: true,
        reason: 'Video teaches JavaScript instead of Java.',
      };
    }
    return { hasConflict: false };
  }

  // If ANY domain matches directly, check whether video has an unrelated dominant incompatible domain
  const directOverlap = videoDomains.some((vd) => courseDomains.includes(vd));
  if (directOverlap) {
    return { hasConflict: false };
  }

  // Check compatibility matrix
  const isCompatible = videoDomains.some((vd) =>
    courseDomains.some((cd) => {
      const cDef = DOMAIN_DEFINITIONS.find((d) => d.id === cd);
      const vDef = DOMAIN_DEFINITIONS.find((d) => d.id === vd);
      return (
        cDef?.compatibleWith?.includes(vd) || vDef?.compatibleWith?.includes(cd)
      );
    })
  );

  if (isCompatible) {
    return { hasConflict: false };
  }

  const courseLabel =
    DOMAIN_DEFINITIONS.find((d) => d.id === courseDomains[0])?.label ||
    courseDomains[0];
  const videoLabel =
    DOMAIN_DEFINITIONS.find((d) => d.id === videoDomains[0])?.label ||
    videoDomains[0];

  return {
    hasConflict: true,
    reason: `Subject mismatch: video belongs to "${videoLabel}" rather than "${courseLabel}".`,
  };
}

// ---------------------------------------------------------------------------
// Utility Helpers
// ---------------------------------------------------------------------------

export function tokenizeMeaningful(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^[.-]+|[.-]+$/g, ''))
    .filter((w) => w.length >= 2 && !GENERIC_WORDS.has(w));
}

function cleanChapterHeading(title: string): string {
  return (title || '')
    .replace(/^(?:day|chapter|lecture|module|lesson|unit)\s*\d+\s*[:\-–.]?\s*/i, '')
    .trim();
}

export function parseDurationToMinutes(durationStr: string): {
  formatted: string;
  minutes: number;
} {
  if (!durationStr) return { formatted: '0:00', minutes: 0 };

  // ISO 8601 (PT1H15M30S)
  if (durationStr.startsWith('PT')) {
    const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return { formatted: '0:00', minutes: 0 };
    const hours = parseInt(match[1] || '0', 10);
    const mins = parseInt(match[2] || '0', 10);
    const secs = parseInt(match[3] || '0', 10);
    const totalMins = hours * 60 + mins + secs / 60;
    const formatted =
      hours > 0
        ? `${hours}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`
        : `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    return { formatted, minutes: totalMins };
  }

  // Colon format (HH:MM:SS or MM:SS)
  if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(durationStr.trim())) {
    const parts = durationStr.trim().split(':').map((n) => parseInt(n, 10));
    if (parts.length === 3) {
      return {
        formatted: durationStr.trim(),
        minutes: parts[0] * 60 + parts[1] + parts[2] / 60,
      };
    }
    return {
      formatted: durationStr.trim(),
      minutes: parts[0] + parts[1] / 60,
    };
  }

  return { formatted: durationStr, minutes: 0 };
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface SimpleHttpResponse {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
  json: () => Promise<any>;
}

function httpsGetFreshSocket(
  urlStr: string,
  headers: Record<string, string>,
  timeoutMs: number,
  redirectsLeft = 3
): Promise<SimpleHttpResponse> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      urlStr,
      {
        agent: false,
        timeout: timeoutMs,
        headers: {
          ...headers,
          Connection: 'close',
        },
      },
      (res) => {
        const status = res.statusCode || 0;
        const location = res.headers.location;
        if (
          status >= 300 &&
          status < 400 &&
          location &&
          redirectsLeft > 0
        ) {
          res.resume();
          const nextUrl = new URL(location, urlStr).toString();
          httpsGetFreshSocket(nextUrl, headers, timeoutMs, redirectsLeft - 1)
            .then(resolve)
            .catch(reject);
          return;
        }

        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          resolve({
            ok: status >= 200 && status < 300,
            status,
            text: async () => body,
            json: async () => JSON.parse(body),
          });
        });
      }
    );

    req.on('timeout', () => {
      const timeoutErr = new Error(`Request timed out after ${timeoutMs}ms`);
      timeoutErr.name = 'AbortError';
      req.destroy(timeoutErr);
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}

async function fetchWithTimeoutAndRetry(
  url: string,
  options: RequestInit = {},
  timeoutMs = 12000,
  maxRetries = 2
): Promise<SimpleHttpResponse> {
  let lastError: unknown = null;
  const headerObj: Record<string, string> = {};
  if (options.headers && typeof options.headers === 'object' && !Array.isArray(options.headers)) {
    for (const [k, v] of Object.entries(options.headers as Record<string, string>)) {
      if (typeof v === 'string') headerObj[k] = v;
    }
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = url.startsWith('https://')
        ? await httpsGetFreshSocket(url, headerObj, timeoutMs)
        : await fetch(url, options);

      if (response.ok) {
        return response;
      }

      // Retry transient 429 or 5xx responses
      if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
        await sleep(700 * Math.pow(2, attempt));
        continue;
      }

      return response;
    } catch (err: any) {
      lastError = err;
      const isAbort = err?.name === 'AbortError';
      if (attempt < maxRetries) {
        await sleep(700 * Math.pow(2, attempt));
        continue;
      }
      throw new YouTubeSearchError(
        isAbort
          ? `Request timed out after ${timeoutMs}ms`
          : err?.message || 'Network request failed',
        undefined,
        false
      );
    }
  }

  throw new YouTubeSearchError(
    (lastError as Error)?.message || 'Request failed after retries',
    undefined,
    false
  );
}

// ---------------------------------------------------------------------------
// Stage 1: Intelligent Chapter-Specific Search Query Generation
// ---------------------------------------------------------------------------

export function generateChapterSearchQueries(context: ChapterVideoContext): string[] {
  const cleanTopic = (context.courseTopic || '')
    .replace(/^(?:introduction to|learn|basics of|fundamentals of|complete course on|course on)\s+/i, '')
    .trim();

  const cleanChapter = cleanChapterHeading(context.chapterTitle || '');
  const chapterTokens = tokenizeMeaningful(cleanChapter);
  const topicTokens = tokenizeMeaningful(cleanTopic);

  const queries: string[] = [];

  // 1. Use suggestedSearchQuery only if it actually references distinct chapter terms (not generic)
  if (context.suggestedSearchQuery && context.suggestedSearchQuery.trim().length > 6) {
    const sq = context.suggestedSearchQuery.trim();
    const sqLower = sq.toLowerCase();
    const hasChapterSpecificity =
      chapterTokens.length === 0 ||
      chapterTokens.some((t) => sqLower.includes(t));
    if (hasChapterSpecificity) {
      queries.push(sq);
    }
  }

  // 2. Primary focused query combining Course Topic + Specific Chapter
  const chapterLower = cleanChapter.toLowerCase();
  const chapterAlreadyContainsTopic =
    topicTokens.length > 0 &&
    (topicTokens.every((t) => chapterLower.includes(t)) ||
      (topicTokens.length === 2 &&
        topicTokens[1] === 'programming' &&
        chapterTokens.includes(topicTokens[0])));

  const primaryCore = chapterAlreadyContainsTopic
    ? cleanChapter
    : `${cleanTopic} ${cleanChapter}`.trim();

  if (primaryCore) {
    const primaryQuery = `${primaryCore} tutorial`.replace(/\s+/g, ' ').trim();
    if (!queries.some((q) => q.toLowerCase() === primaryQuery.toLowerCase())) {
      queries.push(primaryQuery);
    }
  }

  // 3. Secondary specific query using concepts/subtopics or alternative educational phrasing
  const topConcepts = (context.importantConcepts || context.subtopics || [])
    .map((c) => cleanChapterHeading(c))
    .filter((c) => c.length > 2)
    .slice(0, 2);

  if (topConcepts.length > 0) {
    const conceptQuery = `${cleanTopic} ${topConcepts[0]} explained`.replace(/\s+/g, ' ').trim();
    if (!queries.some((q) => q.toLowerCase() === conceptQuery.toLowerCase())) {
      queries.push(conceptQuery);
    }
  } else if (cleanChapter) {
    const secondaryQuery = `${cleanChapter} ${cleanTopic} lecture explained`.replace(/\s+/g, ' ').trim();
    if (!queries.some((q) => q.toLowerCase() === secondaryQuery.toLowerCase())) {
      queries.push(secondaryQuery);
    }
  }

  return queries.slice(0, 2);
}

// ---------------------------------------------------------------------------
// Stage 2: YouTube Search Integration & Metadata Validation
// ---------------------------------------------------------------------------

function isValidYouTubeApiKey(key?: string): boolean {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  return (
    trimmed.length > 15 &&
    !trimmed.includes('MY_') &&
    !trimmed.includes('your_') &&
    !trimmed.includes('placeholder')
  );
}

async function verifyYouTubeEmbeddableViaOEmbed(
  videoId: string
): Promise<{ embeddable: boolean; title?: string; author?: string }> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      `https://www.youtube.com/watch?v=${videoId}`
    )}&format=json`;
    const res = await fetchWithTimeoutAndRetry(oembedUrl, {}, 5000, 1);
    if (!res.ok) {
      return { embeddable: false };
    }
    const data = await res.json();
    return {
      embeddable: true,
      title: data?.title,
      author: data?.author_name,
    };
  } catch {
    // Do not reject on transient oEmbed timeout; only reject explicit 401/403/404 from YouTube
    return { embeddable: true };
  }
}

async function searchViaYouTubeDataApi(
  query: string,
  apiKey: string
): Promise<RawYouTubeCandidate[]> {
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&type=video&videoEmbeddable=true&relevanceLanguage=en&q=${encodeURIComponent(
    query
  )}&key=${encodeURIComponent(apiKey)}`;

  const searchRes = await fetchWithTimeoutAndRetry(searchUrl, {}, 10000, 2);
  if (!searchRes.ok) {
    let errDetail = `YouTube Data API search failed (${searchRes.status})`;
    try {
      const errJson = await searchRes.json();
      if (errJson?.error?.message) {
        errDetail = errJson.error.message;
      }
    } catch {
      // ignore parse failure
    }
    throw new YouTubeSearchError(errDetail, searchRes.status, false);
  }

  const searchData = await searchRes.json();
  const items = Array.isArray(searchData?.items) ? searchData.items : [];
  const videoIds = items
    .map((i: any) => i?.id?.videoId)
    .filter((id: any) => typeof id === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(id));

  if (videoIds.length === 0) {
    return [];
  }

  const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status&id=${encodeURIComponent(
    videoIds.join(',')
  )}&key=${encodeURIComponent(apiKey)}`;

  const detailsRes = await fetchWithTimeoutAndRetry(detailsUrl, {}, 10000, 2);
  if (!detailsRes.ok) {
    throw new YouTubeSearchError(
      `YouTube Data API video details failed (${detailsRes.status})`,
      detailsRes.status,
      false
    );
  }

  const detailsData = await detailsRes.json();
  const detailsItems = Array.isArray(detailsData?.items) ? detailsData.items : [];

  return detailsItems.map((v: any): RawYouTubeCandidate => {
    const dur = parseDurationToMinutes(v?.contentDetails?.duration || '');
    return {
      id: String(v.id || ''),
      title: String(v?.snippet?.title || ''),
      description: String(v?.snippet?.description || ''),
      channel: String(v?.snippet?.channelTitle || ''),
      duration: dur.formatted,
      durationMinutes: dur.minutes,
      embedUrl: `https://www.youtube.com/embed/${v.id}`,
      thumbnailUrl:
        v?.snippet?.thumbnails?.medium?.url ||
        v?.snippet?.thumbnails?.high?.url ||
        `https://img.youtube.com/vi/${v.id}/mqdefault.jpg`,
      isEmbeddable:
        v?.status?.embeddable !== false &&
        v?.status?.privacyStatus !== 'private',
      tags: Array.isArray(v?.snippet?.tags) ? v.snippet.tags : [],
      defaultAudioLanguage: v?.snippet?.defaultAudioLanguage || v?.snippet?.defaultLanguage,
      source: 'youtube_api',
    };
  });
}

async function searchViaYouTubePublicSearch(
  query: string
): Promise<RawYouTubeCandidate[]> {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    query
  )}&hl=en&gl=US`;

  const res = await fetchWithTimeoutAndRetry(
    url,
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    },
    12000,
    2
  );

  if (!res.ok) {
    throw new YouTubeSearchError(
      `YouTube search returned HTTP ${res.status}`,
      res.status,
      false
    );
  }

  const html = await res.text();
  const match = html.match(/var ytInitialData = (\{.*?\});<\/script>/);
  if (!match || !match[1]) {
    throw new YouTubeSearchError(
      'Unable to extract structured YouTube video metadata from search response.',
      502,
      false
    );
  }

  let data: any;
  try {
    data = JSON.parse(match[1]);
  } catch {
    throw new YouTubeSearchError(
      'Invalid JSON in YouTube search response.',
      502,
      false
    );
  }

  const contents =
    data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
      ?.sectionListRenderer?.contents || [];

  const extracted: RawYouTubeCandidate[] = [];
  const seen = new Set<string>();

  for (const sec of contents) {
    const secItems = sec?.itemSectionRenderer?.contents || [];
    for (const item of secItems) {
      const vr = item?.videoRenderer;
      const vid = vr?.videoId;
      if (!vid || typeof vid !== 'string' || !/^[a-zA-Z0-9_-]{11}$/.test(vid) || seen.has(vid)) {
        continue;
      }
      seen.add(vid);

      const title = Array.isArray(vr?.title?.runs)
        ? vr.title.runs.map((r: any) => r.text || '').join('').trim()
        : '';
      const channel =
        vr?.ownerText?.runs?.[0]?.text ||
        vr?.longBylineText?.runs?.[0]?.text ||
        '';
      const durationText = vr?.lengthText?.simpleText || '';
      const dur = parseDurationToMinutes(durationText);
      const descRuns =
        vr?.detailedMetadataSnippets?.[0]?.snippetText?.runs ||
        vr?.descriptionSnippet?.runs ||
        [];
      const description = Array.isArray(descRuns)
        ? descRuns.map((r: any) => r.text || '').join('').trim()
        : '';

      extracted.push({
        id: vid,
        title,
        description,
        channel: String(channel).trim(),
        duration: dur.formatted || durationText,
        durationMinutes: dur.minutes,
        embedUrl: `https://www.youtube.com/embed/${vid}`,
        thumbnailUrl: `https://img.youtube.com/vi/${vid}/mqdefault.jpg`,
        isEmbeddable: true,
        source: 'youtube_search',
      });

      if (extracted.length >= 10) break;
    }
    if (extracted.length >= 10) break;
  }

  return extracted;
}

export async function searchYouTubeCandidates(
  query: string,
  deps: VideoServiceDependencies = {}
): Promise<RawYouTubeCandidate[]> {
  if (deps.searchOverride) {
    return deps.searchOverride(query);
  }

  const key = deps.youtubeApiKey ?? process.env.YOUTUBE_API_KEY;
  if (isValidYouTubeApiKey(key)) {
    return searchViaYouTubeDataApi(query, key!.trim());
  }

  return searchViaYouTubePublicSearch(query);
}

// ---------------------------------------------------------------------------
// Metadata Sufficiency & Hygiene Gate
// ---------------------------------------------------------------------------

const NOISE_PATTERNS = [
  /\bofficial music video\b/i,
  /\bofficial audio\b/i,
  /\blyric video\b/i,
  /\b#shorts\b/i,
  /\byoutube shorts\b/i,
  /\btiktok\b/i,
  /\bprank\b/i,
  /\bgameplay\b/i,
  /\blet'?s play\b/i,
  /\basmr\b/i,
  /\bmovie trailer\b/i,
  /\bmeme compilation\b/i,
];

const NON_ENGLISH_PATTERNS = [
  /\bin hindi\b/i,
  /\bhindi tutorial\b/i,
  /\bin urdu\b/i,
  /\bin tamil\b/i,
  /\bin telugu\b/i,
  /\bin kannada\b/i,
  /\bin malayalam\b/i,
  /\bin bengali\b/i,
  /\bin marathi\b/i,
  /[\u0900-\u097F\u0C00-\u0C7F\u0B80-\u0BFF\u0C80-\u0CFF\u0600-\u06FF]/,
];

export function validateVideoMetadata(
  candidate: RawYouTubeCandidate,
  targetLanguage = 'English'
): { valid: boolean; reason?: string } {
  if (!candidate || typeof candidate !== 'object') {
    return { valid: false, reason: 'Missing video metadata object.' };
  }

  if (!candidate.id || !/^[a-zA-Z0-9_-]{11}$/.test(candidate.id.trim())) {
    return { valid: false, reason: 'Invalid or missing YouTube video ID.' };
  }

  const title = (candidate.title || '').trim();
  const channel = (candidate.channel || '').trim();
  const desc = (candidate.description || '').trim();

  if (title.length < 6) {
    return { valid: false, reason: 'Insufficient video title metadata for verification.' };
  }

  if (channel.length < 2) {
    return { valid: false, reason: 'Insufficient channel metadata for verification.' };
  }

  // Reject videos with insufficient combined metadata (e.g., cryptic short title and no description)
  if (title.split(/\s+/).length < 2 && desc.length < 15) {
    return { valid: false, reason: 'Insufficient video title/description metadata for reliable verification.' };
  }

  if (candidate.isEmbeddable === false) {
    return { valid: false, reason: 'Video is not embeddable or is restricted.' };
  }

  if (candidate.durationMinutes > 0 && candidate.durationMinutes < 1.5) {
    return { valid: false, reason: 'Video is too short (< 90s) for a structured educational lesson.' };
  }

  const combined = `${title} ${desc}`;
  if (NOISE_PATTERNS.some((re) => re.test(combined))) {
    return { valid: false, reason: 'Video appears to be non-educational entertainment/shorts content.' };
  }

  if (targetLanguage.toLowerCase() === 'english') {
    if (NON_ENGLISH_PATTERNS.some((re) => re.test(combined))) {
      return { valid: false, reason: 'Video does not match the requested English course language.' };
    }
    if (
      candidate.defaultAudioLanguage &&
      !candidate.defaultAudioLanguage.toLowerCase().startsWith('en')
    ) {
      return {
        valid: false,
        reason: `Audio language (${candidate.defaultAudioLanguage}) is not English.`,
      };
    }
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// Stage 3: Deterministic + AI-Powered Relevance Evaluation
// ---------------------------------------------------------------------------

function stemToken(t: string): string {
  if (t.length <= 3) return t;
  return t.replace(/(ing|tion|s|es|ed)$/i, '');
}

function tokenMatchesText(token: string, textLower: string): boolean {
  if (!token) return false;
  if (textLower.includes(token)) return true;
  const stem = stemToken(token);
  return stem.length >= 3 && textLower.includes(stem);
}

export function evaluateVideoRelevanceDeterministic(
  candidate: RawYouTubeCandidate,
  context: ChapterVideoContext,
  threshold = DEFAULT_RELEVANCE_THRESHOLD
): VideoRelevanceEvaluation & { hasConflict: boolean; ceilingScore: number } {
  const titleLower = (candidate.title || '').toLowerCase();
  const descLower = (candidate.description || '').toLowerCase();
  const channelLower = (candidate.channel || '').toLowerCase();
  const combinedVideoText = `${titleLower} ${descLower} ${channelLower}`;

  const cleanChapter = cleanChapterHeading(context.chapterTitle);
  const courseContextText = `${context.courseTopic} ${context.category} ${cleanChapter}`;

  // 1. Hard Cross-Subject Conflict Guard
  const conflict = hasSubjectConflict(courseContextText, `${candidate.title} ${candidate.description}`);
  if (conflict.hasConflict) {
    return {
      isRelevant: false,
      courseTopic: context.courseTopic,
      chapter: context.chapterTitle,
      videoTitle: candidate.title,
      relevanceScore: 15,
      reason: conflict.reason || 'Video discusses an unrelated subject.',
      hasConflict: true,
      ceilingScore: 20,
    };
  }

  // 2. Topic & Chapter Token Matching
  const topicTokens = Array.from(new Set(tokenizeMeaningful(context.courseTopic)));
  const chapterTokens = Array.from(
    new Set(
      tokenizeMeaningful(
        `${cleanChapter} ${(context.importantConcepts || []).join(' ')}`
      )
    )
  );

  const topicHits = topicTokens.filter((t) => tokenMatchesText(t, combinedVideoText));
  const chapterTitleHits = chapterTokens.filter((t) => tokenMatchesText(t, titleLower));
  const chapterAnyHits = chapterTokens.filter((t) => tokenMatchesText(t, combinedVideoText));

  const topicRatio = topicTokens.length > 0 ? topicHits.length / topicTokens.length : 1;
  const chapterRatio =
    chapterTokens.length > 0 ? chapterAnyHits.length / chapterTokens.length : topicRatio;

  // Reject if neither topic nor specific chapter tokens appear
  if (topicHits.length === 0 && chapterAnyHits.length === 0) {
    return {
      isRelevant: false,
      courseTopic: context.courseTopic,
      chapter: context.chapterTitle,
      videoTitle: candidate.title,
      relevanceScore: 20,
      reason: `Video title and description do not mention "${context.courseTopic}" or "${cleanChapter}".`,
      hasConflict: false,
      ceilingScore: 30,
    };
  }

  // If the chapter has specific non-generic terms (e.g. "SEO", "Email Marketing", "Neural Networks"),
  // require at least one specific chapter concept to appear!
  const specificChapterTokens = chapterTokens.filter((t) => !topicTokens.includes(t));
  let specificTitleMatchesCount = 0;
  if (specificChapterTokens.length > 0) {
    const specificMatches = specificChapterTokens.filter((t) =>
      tokenMatchesText(t, combinedVideoText)
    );
    specificTitleMatchesCount = specificChapterTokens.filter((t) =>
      tokenMatchesText(t, titleLower)
    ).length;
    if (specificMatches.length === 0) {
      return {
        isRelevant: false,
        courseTopic: context.courseTopic,
        chapter: context.chapterTitle,
        videoTitle: candidate.title,
        relevanceScore: 52,
        reason: `Video discusses "${context.courseTopic}" generally but does not cover the specific chapter "${cleanChapter}".`,
        hasConflict: false,
        ceilingScore: 60,
      };
    }
  } else {
    specificTitleMatchesCount = chapterTitleHits.length;
  }

  // 3. Weighted Score Breakdown (0 - 100)
  let score = 0;

  // Main Topic Alignment (up to 35 pts)
  // Note: If chapter-specific match is very strong in a sub-topic (e.g. "SEO" under "Digital Marketing"),
  // give domain-aligned credit when topic is implied by confirmed domain match.
  const courseDomains = detectDomains(courseContextText);
  const videoDomains = detectDomains(`${candidate.title} ${candidate.description}`);
  const domainMatches =
    courseDomains.length > 0 && videoDomains.some((d) => courseDomains.includes(d));

  const effectiveTopicRatio = domainMatches
    ? Math.max(topicRatio, chapterTitleHits.length >= 1 ? 0.9 : 0.78)
    : topicRatio;
  score += Math.round(effectiveTopicRatio * 35);

  // Chapter Alignment (up to 40 pts: title hits weighted higher than description-only hits)
  if (chapterTokens.length > 0) {
    const rawTitleWeight = chapterTitleHits.length / chapterTokens.length;
    const rawCombinedWeight = chapterAnyHits.length / chapterTokens.length;

    // Normalize compound chapter titles (e.g. "Google Ads and PPC Advertising", "Search Engine Optimization (SEO)")
    // when >= 2 meaningful tokens AND >= 1 specific chapter concept appear in the video title.
    const canNormalizeCompound =
      chapterTokens.length >= 3 &&
      chapterTitleHits.length >= 2 &&
      specificTitleMatchesCount >= 1;

    const titleWeight = canNormalizeCompound
      ? Math.max(rawTitleWeight, Math.min(0.95, chapterTitleHits.length / 2.2))
      : rawTitleWeight;
    const combinedWeight = canNormalizeCompound
      ? Math.max(rawCombinedWeight, Math.min(0.95, chapterAnyHits.length / 2.3))
      : rawCombinedWeight;

    const blendedChapterRatio = Math.min(1, titleWeight * 0.65 + combinedWeight * 0.45);
    score += Math.round(blendedChapterRatio * 40);
  } else {
    score += Math.round(effectiveTopicRatio * 36);
  }

  // Educational Quality Signals (up to 15 pts)
  const eduSignals = [
    'tutorial',
    'course',
    'explained',
    'lecture',
    'guide',
    'learn',
    'masterclass',
    'crash course',
    'for beginners',
    'how to',
    'walkthrough',
    'lesson',
    'fundamentals',
    'programming',
    'step by step',
    'training',
  ];
  const eduMatches = eduSignals.filter((s) => combinedVideoText.includes(s)).length;
  score += eduMatches >= 2 ? 15 : eduMatches === 1 ? 11 : 5;

  // Duration & Metadata Completeness (up to 10 pts)
  if (candidate.durationMinutes >= 5 && candidate.durationMinutes <= 90) {
    score += 10;
  } else if (candidate.durationMinutes > 90 && candidate.durationMinutes <= 180) {
    score += 7;
  } else if (candidate.durationMinutes >= 2) {
    score += 6;
  } else {
    // Duration unknown (e.g. partial metadata)
    score += candidate.description.length >= 20 ? 7 : 4;
  }

  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const isRelevant = clampedScore >= threshold;

  const reason = isRelevant
    ? `Directly covers "${cleanChapter}" in ${context.courseTopic} (${chapterAnyHits.slice(0, 3).join(', ') || topicHits.slice(0, 3).join(', ')}) with clear educational framing.`
    : `Insufficient alignment with chapter "${cleanChapter}" in ${context.courseTopic} (score ${clampedScore}/${threshold} required).`;

  return {
    isRelevant,
    courseTopic: context.courseTopic,
    chapter: context.chapterTitle,
    videoTitle: candidate.title,
    relevanceScore: clampedScore,
    reason,
    hasConflict: false,
    ceilingScore: 100,
  };
}

// ---------------------------------------------------------------------------
// AI-Powered Structured Verification using Google Gemini (@google/genai)
// ---------------------------------------------------------------------------

const geminiModelCooldownUntil = new Map<string, number>();
const geminiCooldownLogged = new Set<string>();

export function clearGeminiQuotaCooldown(): void {
  geminiModelCooldownUntil.clear();
  geminiCooldownLogged.clear();
}

export function isGeminiQuotaError(err: unknown): boolean {
  const msg = String((err as any)?.message || err || '').toLowerCase();
  const status = (err as any)?.status || (err as any)?.code;
  return (
    status === 429 ||
    msg.includes('resource_exhausted') ||
    msg.includes('exceeded your current quota') ||
    msg.includes('generaterequestsperday') ||
    msg.includes('"code":429')
  );
}

export function isGeminiModelOnCooldown(model = 'gemini-4-hydrogen'): boolean {
  const until = geminiModelCooldownUntil.get(model) || 0;
  if (until > Date.now()) {
    return true;
  }
  if (until > 0) {
    geminiModelCooldownUntil.delete(model);
    geminiCooldownLogged.delete(model);
  }
  return false;
}

export function markGeminiModelCooldown(model: string, err?: unknown): void {
  // Default 30-minute cooldown so free-tier quota errors are not retried on every request
  let cooldownMs = 30 * 60 * 1000;
  const msg = String((err as any)?.message || '');
  const retryMatch = msg.match(/"retryDelay"\s*:\s*"(\d+)s"/);
  if (retryMatch) {
    const parsedSec = parseInt(retryMatch[1], 10);
    if (Number.isFinite(parsedSec) && parsedSec > 0) {
      cooldownMs = Math.min(6 * 60 * 60 * 1000, Math.max(60 * 1000, parsedSec * 1000));
    }
  }
  geminiModelCooldownUntil.set(model, Date.now() + cooldownMs);
  if (!geminiCooldownLogged.has(model)) {
    geminiCooldownLogged.add(model);
    console.info(
      `[Gemini Quota Notice] Model "${model}" quota reached; using local verification engine cleanly.`
    );
  }
}

export async function evaluateVideosWithGemini(
  ai: GoogleGenAI,
  candidates: RawYouTubeCandidate[],
  context: ChapterVideoContext,
  timeoutMs = 15000
): Promise<Map<string, VideoRelevanceEvaluation>> {
  const results = new Map<string, VideoRelevanceEvaluation>();
  if (candidates.length === 0) return results;

  const model = 'gemini-3.1-flash-lite';
  if (isGeminiModelOnCooldown(model)) {
    return results;
  }

  const candidatePayload = candidates.map((c) => ({
    videoId: c.id,
    title: c.title,
    channel: c.channel,
    duration: c.duration || 'Unknown',
    description: (c.description || '').slice(0, 400),
  }));

  const prompt = `You are a strict academic curriculum auditor evaluating YouTube video candidates for an online course.

Course Topic: "${context.courseTopic}"
Course Category: "${context.category}"
Target Chapter: "${context.chapterTitle}"
${context.chapterDescription ? `Chapter Description: "${context.chapterDescription}"` : ''}
${context.difficulty ? `Target Difficulty: "${context.difficulty}"` : ''}

STRICT EVALUATION CRITERIA (DO NOT BE LENIENT):
1. Main topic relevance: Must genuinely teach "${context.courseTopic}", not a different field.
2. Chapter relevance: Must directly teach "${context.chapterTitle}", not just an unrelated subtopic.
3. Title & description relevance: Reject clickbait, vague titles, or videos with insufficient metadata.
4. Keyword-overlap trap: REJECT videos that share a generic word (like "Algorithms", "Analytics", "Introduction", "Design", "Java", "Search") while teaching a completely unrelated subject (e.g., reject C Programming for Digital Marketing, reject JavaScript for Java, reject Computer Networks for Neural Networks).
5. Educational value: Prefer structured tutorials, lectures, and practical walkthroughs over vlogs, shorts, promos, or entertainment.
6. Scoring calibration:
   - 90-100: Exceptional direct match for both "${context.courseTopic}" and "${context.chapterTitle}".
   - 80-89: Strong educational tutorial covering "${context.chapterTitle}" in "${context.courseTopic}".
   - 50-79: Partially related or too generic / wrong chapter (set isRelevant: false).
   - 0-49: Unrelated subject or keyword trap (MUST set isRelevant: false).

Evaluate each candidate video below and return a JSON array with one entry per candidate:
${JSON.stringify(candidatePayload, null, 2)}`;

  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await Promise.race([
        ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction:
              'You are a strict educational content evaluator. Reject unrelated subjects and shallow keyword matches. Output valid JSON matching the schema.',
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  videoId: { type: Type.STRING },
                  isRelevant: { type: Type.BOOLEAN },
                  courseTopic: { type: Type.STRING },
                  chapter: { type: Type.STRING },
                  videoTitle: { type: Type.STRING },
                  relevanceScore: { type: Type.INTEGER },
                  reason: { type: Type.STRING },
                },
                required: [
                  'videoId',
                  'isRelevant',
                  'courseTopic',
                  'chapter',
                  'videoTitle',
                  'relevanceScore',
                  'reason',
                ],
              },
            },
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini relevance verification timeout')), timeoutMs)
        ),
      ]);

      const rawText = (response.text || '[]').trim();
      const parsed = JSON.parse(rawText);
      if (!Array.isArray(parsed)) {
        throw new Error('Gemini returned non-array evaluation payload');
      }

      for (const item of parsed) {
        if (!item || typeof item.videoId !== 'string') continue;
        const score =
          typeof item.relevanceScore === 'number' && Number.isFinite(item.relevanceScore)
            ? Math.max(0, Math.min(100, Math.round(item.relevanceScore)))
            : 0;
        results.set(item.videoId, {
          isRelevant: Boolean(item.isRelevant),
          courseTopic: String(item.courseTopic || context.courseTopic),
          chapter: String(item.chapter || context.chapterTitle),
          videoTitle: String(item.videoTitle || ''),
          relevanceScore: score,
          reason: String(item.reason || 'Evaluated by Gemini AI relevance engine.'),
        });
      }

      return results;
    } catch (err: any) {
      lastErr = err;
      if (isGeminiQuotaError(err)) {
        // Daily/RPM quota exhausted: trip circuit breaker immediately and do NOT retry
        markGeminiModelCooldown(model, err);
        return results;
      }
      const msg = String(err?.message || '').toLowerCase();
      const isRetryable =
        msg.includes('timeout') || msg.includes('503') || msg.includes('500');
      if (attempt === 0 && isRetryable) {
        await sleep(500);
        continue;
      }
      break;
    }
  }

  console.info(
    '[Gemini Video Relevance Notice]:',
    (lastErr as Error)?.message?.slice(0, 180) ||
      'Gemini verification unavailable; using strict deterministic verifier.'
  );
  return results;
}

// ---------------------------------------------------------------------------
// Stage 4: Complete Chapter Recommendation Pipeline
// ---------------------------------------------------------------------------

export async function recommendVideosForChapter(
  context: ChapterVideoContext,
  usedVideoIds: Set<string> = new Set(),
  deps: VideoServiceDependencies = {}
): Promise<ChapterVideoRecommendationResult> {
  const threshold =
    typeof context.threshold === 'number'
      ? context.threshold
      : typeof deps.threshold === 'number'
      ? deps.threshold
      : DEFAULT_RELEVANCE_THRESHOLD;

  const limit = Math.max(1, Math.min(10, context.limit || 4));
  const searchQueries = generateChapterSearchQueries(context);

  const cacheKey = `${context.courseTopic}::${context.category}::${context.chapterTitle}::${threshold}::${searchQueries[0] || ''}`;

  // Use cache only when no external searchOverride is provided and no conflicting usedVideoIds
  if (!deps.searchOverride) {
    const cached = chapterRecommendationCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      const filteredApproved = cached.result.approvedVideos.filter(
        (v) => !usedVideoIds.has(v.id)
      );
      if (filteredApproved.length > 0) {
        const primary = filteredApproved[0];
        usedVideoIds.add(primary.id);
        return {
          ...cached.result,
          primaryVideo: primary,
          alternativeVideos: filteredApproved.slice(1, limit),
          approvedVideos: filteredApproved.slice(0, limit),
        };
      }
      if (cached.result.status !== 'found') {
        return cached.result;
      }
    }
  }

  // Retrieve candidates from YouTube across chapter-specific queries
  const candidateMap = new Map<string, RawYouTubeCandidate>();
  let apiErrorEncountered: string | null = null;

  for (const query of searchQueries) {
    try {
      const rawResults = await searchYouTubeCandidates(query, deps);
      for (const item of rawResults) {
        if (!item?.id || candidateMap.has(item.id) || usedVideoIds.has(item.id)) {
          continue;
        }
        candidateMap.set(item.id, item);
      }
      if (candidateMap.size >= 8) break;
    } catch (err: any) {
      apiErrorEncountered = err?.message || 'YouTube search error';
      console.warn(`[Video Search Error] Query "${query}":`, apiErrorEncountered);
    }
  }

  // If all queries failed with an API error and zero candidates were fetched, fail safely
  if (candidateMap.size === 0 && apiErrorEncountered) {
    return {
      courseTopic: context.courseTopic,
      category: context.category,
      chapterTitle: context.chapterTitle,
      searchQueries,
      primaryVideo: null,
      alternativeVideos: [],
      approvedVideos: [],
      rejectedVideos: [],
      status: 'api_error',
      message: NO_RELEVANT_VIDEOS_MESSAGE,
      threshold,
      error: apiErrorEncountered,
    };
  }

  const allCandidates = Array.from(candidateMap.values());
  const validCandidates: RawYouTubeCandidate[] = [];
  const rejectedVideos: ChapterVideoRecommendationResult['rejectedVideos'] = [];

  for (const candidate of allCandidates) {
    const metaCheck = validateVideoMetadata(candidate, context.language || 'English');
    if (!metaCheck.valid) {
      rejectedVideos.push({
        id: candidate.id || 'unknown',
        title: candidate.title || 'Unknown Title',
        channel: candidate.channel || 'Unknown Channel',
        relevanceScore: 0,
        reason: metaCheck.reason || 'Invalid or insufficient video metadata.',
      });
      continue;
    }
    validCandidates.push(candidate);
  }

  if (validCandidates.length === 0) {
    const emptyResult: ChapterVideoRecommendationResult = {
      courseTopic: context.courseTopic,
      category: context.category,
      chapterTitle: context.chapterTitle,
      searchQueries,
      primaryVideo: null,
      alternativeVideos: [],
      approvedVideos: [],
      rejectedVideos,
      status: 'no_relevant_videos',
      message: NO_RELEVANT_VIDEOS_MESSAGE,
      threshold,
    };
    return emptyResult;
  }

  // Pre-compute deterministic evaluations so obvious subject conflicts/irrelevant items
  // don't waste Gemini API quota.
  const detEvalById = new Map<
    string,
    ReturnType<typeof evaluateVideoRelevanceDeterministic>
  >();
  for (const candidate of validCandidates) {
    detEvalById.set(
      candidate.id,
      evaluateVideoRelevanceDeterministic(candidate, context, threshold)
    );
  }

  const aiCandidates = validCandidates
    .filter((c) => {
      const det = detEvalById.get(c.id)!;
      return !det.hasConflict && det.ceilingScore >= threshold;
    })
    .slice(0, 6);

  // Evaluate shortlisted candidates via Gemini AI (if configured & not on quota cooldown)
  const geminiEvaluations =
    deps.ai && aiCandidates.length > 0
      ? await evaluateVideosWithGemini(deps.ai, aiCandidates, context)
      : new Map<string, VideoRelevanceEvaluation>();

  const approvedVideos: EducationalVideo[] = [];

  for (const candidate of validCandidates) {
    const detEval = detEvalById.get(candidate.id)!;
    const aiEval = geminiEvaluations.get(candidate.id);

    let finalScore: number;
    let finalRelevant: boolean;
    let finalReason: string;

    if (aiEval) {
      // Combine AI evaluation with strict deterministic conflict & ceiling checks
      finalScore = detEval.hasConflict
        ? Math.min(aiEval.relevanceScore, detEval.ceilingScore)
        : aiEval.relevanceScore;
      // Also prevent Gemini from approving a video with 0 topic/chapter keyword overlap
      if (detEval.ceilingScore < threshold) {
        finalScore = Math.min(finalScore, detEval.ceilingScore);
      }
      finalRelevant =
        aiEval.isRelevant &&
        !detEval.hasConflict &&
        finalScore >= threshold;
      finalReason = detEval.hasConflict ? detEval.reason : aiEval.reason;
    } else {
      finalScore = detEval.relevanceScore;
      finalRelevant = detEval.isRelevant && !detEval.hasConflict && finalScore >= threshold;
      finalReason = detEval.reason;
    }

    if (!finalRelevant || finalScore < threshold) {
      rejectedVideos.push({
        id: candidate.id,
        title: candidate.title,
        channel: candidate.channel,
        relevanceScore: finalScore,
        reason: finalReason,
      });
      continue;
    }

    const matchCategory: 'excellent' | 'good' | 'fair' =
      finalScore >= 90 ? 'excellent' : finalScore >= 80 ? 'good' : 'fair';

    approvedVideos.push({
      id: candidate.id,
      title: candidate.title,
      channel: candidate.channel,
      duration: candidate.duration || undefined,
      topic: context.chapterTitle,
      relevanceScore: finalScore,
      matchReason: finalReason,
      matchCategory,
      embedUrl: candidate.embedUrl || `https://www.youtube.com/embed/${candidate.id}`,
      thumbnailUrl:
        candidate.thumbnailUrl || `https://img.youtube.com/vi/${candidate.id}/mqdefault.jpg`,
      isEmbeddable: true,
    });
  }

  // Sort approved videos by relevance descending and deduplicate
  approvedVideos.sort((a, b) => b.relevanceScore - a.relevanceScore);

  const uniqueApproved: EducationalVideo[] = [];
  const seenApproved = new Set<string>();
  for (const v of approvedVideos) {
    if (!seenApproved.has(v.id) && !usedVideoIds.has(v.id)) {
      seenApproved.add(v.id);
      uniqueApproved.push(v);
    }
  }

  // Verify embeddability only on top approved candidates (saves ~80% outbound YouTube requests)
  let verifiedApproved = uniqueApproved;
  if (!deps.searchOverride && deps.verifyEmbeddable !== false && uniqueApproved.length > 0) {
    const candidatesToVerify = uniqueApproved.slice(0, limit + 1);
    const kept: EducationalVideo[] = [];
    for (const vid of candidatesToVerify) {
      const check = await verifyYouTubeEmbeddableViaOEmbed(vid.id);
      if (check.embeddable) {
        kept.push(vid);
      } else {
        rejectedVideos.push({
          id: vid.id,
          title: vid.title,
          channel: vid.channel,
          relevanceScore: vid.relevanceScore,
          reason: 'Video is not embeddable or restricted by owner.',
        });
      }
    }
    verifiedApproved = kept;
  }

  if (verifiedApproved.length === 0) {
    const noMatchResult: ChapterVideoRecommendationResult = {
      courseTopic: context.courseTopic,
      category: context.category,
      chapterTitle: context.chapterTitle,
      searchQueries,
      primaryVideo: null,
      alternativeVideos: [],
      approvedVideos: [],
      rejectedVideos,
      status: 'no_relevant_videos',
      message: NO_RELEVANT_VIDEOS_MESSAGE,
      threshold,
    };
    if (!deps.searchOverride) {
      chapterRecommendationCache.set(cacheKey, {
        expiresAt: Date.now() + 2 * 60 * 1000,
        result: noMatchResult,
      });
    }
    return noMatchResult;
  }

  const primaryVideo = verifiedApproved[0];
  usedVideoIds.add(primaryVideo.id);

  const alternativeVideos = verifiedApproved.slice(1, limit);

  const result: ChapterVideoRecommendationResult = {
    courseTopic: context.courseTopic,
    category: context.category,
    chapterTitle: context.chapterTitle,
    searchQueries,
    primaryVideo,
    alternativeVideos,
    approvedVideos: verifiedApproved.slice(0, limit),
    rejectedVideos,
    status: 'found',
    message: `Found ${verifiedApproved.length} verified relevant educational video(s).`,
    threshold,
  };

  if (!deps.searchOverride) {
    chapterRecommendationCache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      result,
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Course-to-Chapter Mapping Pipeline
// ---------------------------------------------------------------------------

export async function recommendVideosForCourseChapters(
  params: {
    courseTopic: string;
    category: string;
    difficulty?: string;
    language?: string;
    includeVideo: boolean;
    targetMinutes?: number;
    chapters: Array<{
      title: string;
      description?: string;
      subtopics?: string[];
      importantConcepts?: string[];
      learningObjectives?: string[];
      videoSearchQuery?: string;
    }>;
  },
  deps: VideoServiceDependencies = {}
): Promise<ChapterVideoRecommendationResult[]> {
  if (!params.includeVideo) {
    return params.chapters.map((ch) => ({
      courseTopic: params.courseTopic,
      category: params.category,
      chapterTitle: ch.title,
      searchQueries: [],
      primaryVideo: null,
      alternativeVideos: [],
      approvedVideos: [],
      rejectedVideos: [],
      status: 'disabled',
      message: 'Video recommendations disabled for this course.',
      threshold: deps.threshold ?? DEFAULT_RELEVANCE_THRESHOLD,
    }));
  }

  // Course-scoped deduplication set: never mix or repeat videos across chapters
  const usedVideoIds = new Set<string>();
  const results: ChapterVideoRecommendationResult[] = [];

  for (let i = 0; i < params.chapters.length; i++) {
    const ch = params.chapters[i];
    if (i > 0 && !deps.searchOverride) {
      await sleep(150);
    }
    const rec = await recommendVideosForChapter(
      {
        courseTopic: params.courseTopic,
        category: params.category,
        chapterTitle: ch.title,
        chapterDescription: ch.description,
        subtopics: ch.subtopics,
        importantConcepts: ch.importantConcepts,
        learningObjectives: ch.learningObjectives,
        difficulty: params.difficulty,
        language: params.language,
        suggestedSearchQuery: ch.videoSearchQuery,
        targetMinutes: params.targetMinutes,
        limit: 4,
      },
      usedVideoIds,
      deps
    );
    results.push(rec);
  }

  // Ensure alternativeVideos on each chapter never contain a primaryVideo assigned to another chapter
  const allPrimaryIds = new Set(
    results.map((r) => r.primaryVideo?.id).filter(Boolean) as string[]
  );
  for (const res of results) {
    res.alternativeVideos = res.alternativeVideos.filter(
      (alt) => alt.id !== res.primaryVideo?.id && !allPrimaryIds.has(alt.id)
    );
  }

  return results;
}

export function applyVideoRecommendationToChapter(
  chapter: CourseChapter,
  rec: ChapterVideoRecommendationResult,
  includeVideo = true
): CourseChapter {
  if (!includeVideo) {
    return {
      ...chapter,
      videoId: undefined,
      videoTitle: undefined,
      videoChannel: undefined,
      relevanceScore: undefined,
      videoMatchReason: undefined,
      videoSearchQuery: undefined,
      videoStatus: 'disabled',
      videoMessage: undefined,
      alternativeVideos: [],
    };
  }

  if (rec.primaryVideo) {
    return {
      ...chapter,
      videoId: rec.primaryVideo.id,
      videoTitle: rec.primaryVideo.title,
      videoChannel: rec.primaryVideo.channel,
      relevanceScore: rec.primaryVideo.relevanceScore,
      videoMatchReason: rec.primaryVideo.matchReason,
      videoSearchQuery: rec.searchQueries[0],
      videoStatus: 'found',
      videoMessage: undefined,
      alternativeVideos: rec.alternativeVideos,
    };
  }

  return {
    ...chapter,
    videoId: undefined,
    videoTitle: undefined,
    videoChannel: undefined,
    relevanceScore: undefined,
    videoMatchReason: undefined,
    videoSearchQuery: rec.searchQueries[0],
    videoStatus: rec.status === 'api_error' ? 'api_error' : 'no_relevant_videos',
    videoMessage: rec.message || NO_RELEVANT_VIDEOS_MESSAGE,
    alternativeVideos: [],
  };
}
