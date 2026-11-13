import assert from 'node:assert/strict';
import {
  applyVideoRecommendationToChapter,
  clearGeminiQuotaCooldown,
  clearVideoRecommendationCache,
  DEFAULT_RELEVANCE_THRESHOLD,
  evaluateVideoRelevanceDeterministic,
  generateChapterSearchQueries,
  NO_RELEVANT_VIDEOS_MESSAGE,
  recommendVideosForChapter,
  recommendVideosForCourseChapters,
  validateVideoMetadata,
  YouTubeSearchError,
  type RawYouTubeCandidate,
} from '../src/server/videoRecommendationService.ts';
import type { CourseChapter } from '../src/types/index.ts';

function makeCandidate(
  overrides: Partial<RawYouTubeCandidate> & { id: string; title: string }
): RawYouTubeCandidate {
  return {
    channel: 'Educational Academy',
    description: 'Comprehensive structured educational tutorial for learners.',
    duration: '18:30',
    durationMinutes: 18.5,
    embedUrl: `https://www.youtube.com/embed/${overrides.id}`,
    thumbnailUrl: `https://img.youtube.com/vi/${overrides.id}/mqdefault.jpg`,
    isEmbeddable: true,
    source: 'injected',
    ...overrides,
  };
}

async function runUnitTests() {
  console.log('=== 1. Running Deterministic & Edge-Case Unit Tests ===');
  clearVideoRecommendationCache();

  // 1A. Distinct chapter search queries
  const dmQueries = [
    generateChapterSearchQueries({
      courseTopic: 'Digital Marketing',
      category: 'Business',
      chapterTitle: 'Introduction to Digital Marketing',
    })[0],
    generateChapterSearchQueries({
      courseTopic: 'Digital Marketing',
      category: 'Business',
      chapterTitle: 'Search Engine Optimization (SEO)',
    })[0],
    generateChapterSearchQueries({
      courseTopic: 'Digital Marketing',
      category: 'Business',
      chapterTitle: 'Social Media Marketing',
    })[0],
    generateChapterSearchQueries({
      courseTopic: 'Digital Marketing',
      category: 'Business',
      chapterTitle: 'Google Ads and PPC Advertising',
    })[0],
    generateChapterSearchQueries({
      courseTopic: 'Digital Marketing',
      category: 'Business',
      chapterTitle: 'Email Marketing',
    })[0],
  ];
  assert.equal(
    new Set(dmQueries.map((q) => q.toLowerCase())).size,
    dmQueries.length,
    'Every chapter must produce a unique search query'
  );

  // 1B. Metadata validation rejections
  assert.equal(
    validateVideoMetadata(
      makeCandidate({ id: 'bad', title: 'Valid Title Enough' })
    ).valid,
    false,
    'Invalid YouTube video ID must be rejected'
  );
  assert.equal(
    validateVideoMetadata(
      makeCandidate({ id: 'abcdefghijk', title: 'SEO', description: '' })
    ).valid,
    false,
    'Too-short title with insufficient metadata must be rejected'
  );
  assert.equal(
    validateVideoMetadata(
      makeCandidate({
        id: 'abcdefghijk',
        title: 'SEO Tutorial #shorts',
        duration: '0:45',
        durationMinutes: 0.75,
      })
    ).valid,
    false,
    'Shorts / <90s clips must be rejected'
  );
  assert.equal(
    validateVideoMetadata(
      makeCandidate({
        id: 'abcdefghijk',
        title: 'Digital Marketing Full Course in Hindi',
      }),
      'English'
    ).valid,
    false,
    'Non-English video must be rejected when English is requested'
  );
  assert.equal(
    validateVideoMetadata(
      makeCandidate({
        id: 'abcdefghijk',
        title: 'Private SEO Lecture',
        isEmbeddable: false,
      })
    ).valid,
    false,
    'Non-embeddable videos must be rejected'
  );

  // 1C. Strict cross-subject conflict rejections
  const cProgTrap = makeCandidate({
    id: 'CProgAlgo01',
    title: 'C Programming – Algorithms Full Tutorial for Beginners',
    description:
      'Learn C programming language, pointers, malloc, and sorting algorithms in C.',
    channel: 'CS Lectures',
  });
  const dmSeoEval = evaluateVideoRelevanceDeterministic(cProgTrap, {
    courseTopic: 'Digital Marketing',
    category: 'Business',
    chapterTitle: 'Search Engine Optimization (SEO)',
  });
  assert.equal(dmSeoEval.isRelevant, false);
  assert.ok(dmSeoEval.relevanceScore < 30, 'C Programming must score < 30 for Digital Marketing');

  const javaTrap = makeCandidate({
    id: 'JavaOop0001',
    title: 'Java Tutorial for Beginners - Object Oriented Programming',
    description: 'Complete Java JVM and Spring Boot fundamentals.',
    channel: 'Java Mastery',
  });
  const jsEval = evaluateVideoRelevanceDeterministic(javaTrap, {
    courseTopic: 'Web Development',
    category: 'Programming',
    chapterTitle: 'JavaScript DOM Manipulation',
  });
  assert.equal(jsEval.isRelevant, false, 'Java video must be rejected for JavaScript chapter');

  const netTrap = makeCandidate({
    id: 'CompNet0001',
    title: 'Computer Networks OSI Model and TCP/IP Explained',
    description: 'Networking layers, packet switching, and IPv4 subnetting.',
    channel: 'Gate CS',
  });
  const mlEval = evaluateVideoRelevanceDeterministic(netTrap, {
    courseTopic: 'Machine Learning',
    category: 'Artificial Intelligence',
    chapterTitle: 'Neural Networks and Backpropagation',
  });
  assert.equal(
    mlEval.isRelevant,
    false,
    'Computer Networks must be rejected for Neural Networks chapter'
  );

  // 1D. Wrong-chapter rejection within same topic
  const genericDmVideo = makeCandidate({
    id: 'GenDmVid001',
    title: 'Digital Marketing Basics - What is Digital Marketing?',
    description: 'High level overview of online branding and customer journeys.',
    channel: 'Marketing Hub',
  });
  const emailChapterEval = evaluateVideoRelevanceDeterministic(genericDmVideo, {
    courseTopic: 'Digital Marketing',
    category: 'Business',
    chapterTitle: 'Email Marketing Automation',
  });
  assert.equal(
    emailChapterEval.isRelevant,
    false,
    'Generic Digital Marketing video without Email Marketing coverage must be rejected for Email Marketing chapter'
  );
  assert.ok(emailChapterEval.relevanceScore < DEFAULT_RELEVANCE_THRESHOLD);

  // 1E. Calibration test for compound chapter title ("Google Ads and PPC Advertising")
  const googleAdsVideo = makeCandidate({
    id: 'GAdsVid0001',
    title: 'Google Ads Tutorial 2026 - How To Run Google Ads for Beginners',
    description:
      'Step-by-step Google Ads PPC advertising tutorial covering search campaigns and bidding.',
    channel: 'Marketing Lab',
  });
  const googleAdsEval = evaluateVideoRelevanceDeterministic(googleAdsVideo, {
    courseTopic: 'Digital Marketing',
    category: 'Business',
    chapterTitle: 'Google Ads and PPC Advertising',
  });
  assert.equal(googleAdsEval.isRelevant, true);
  assert.ok(
    googleAdsEval.relevanceScore >= 80,
    `Expected >= 80 for Google Ads tutorial, got ${googleAdsEval.relevanceScore}`
  );

  // 1F. Empty / no relevant match returns no video + exact fallback message (NO random fallback video)
  const noMatchRec = await recommendVideosForChapter(
    {
      courseTopic: 'Digital Marketing',
      category: 'Business',
      chapterTitle: 'Email Marketing',
    },
    new Set(),
    {
      searchOverride: async () => [cProgTrap, javaTrap],
    }
  );
  assert.equal(noMatchRec.status, 'no_relevant_videos');
  assert.equal(noMatchRec.primaryVideo, null);
  assert.equal(noMatchRec.approvedVideos.length, 0);
  assert.equal(noMatchRec.message, NO_RELEVANT_VIDEOS_MESSAGE);

  // 1G. YouTube API failure returns api_error + no fallback video
  const apiErrorRec = await recommendVideosForChapter(
    {
      courseTopic: 'Python Programming',
      category: 'Programming',
      chapterTitle: 'Variables and Data Types',
    },
    new Set(),
    {
      searchOverride: async () => {
        throw new YouTubeSearchError('YouTube Data API quota exceeded', 403, false);
      },
    }
  );
  assert.equal(apiErrorRec.status, 'api_error');
  assert.equal(apiErrorRec.primaryVideo, null);
  assert.equal(apiErrorRec.message, NO_RELEVANT_VIDEOS_MESSAGE);

  // 1H. Mock Gemini AI integration: conflict guard overrides false Gemini approval & Gemini error falls back safely
  const mockAiOverlyLenient: any = {
    models: {
      generateContent: async () => ({
        text: JSON.stringify([
          {
            videoId: cProgTrap.id,
            isRelevant: true,
            courseTopic: 'Digital Marketing',
            chapter: 'Search Engine Optimization (SEO)',
            videoTitle: cProgTrap.title,
            relevanceScore: 95,
            reason: 'Simulated faulty AI approval',
          },
        ]),
      }),
    },
  };
  const guardedRec = await recommendVideosForChapter(
    {
      courseTopic: 'Digital Marketing',
      category: 'Business',
      chapterTitle: 'Search Engine Optimization (SEO)',
    },
    new Set(),
    {
      ai: mockAiOverlyLenient,
      searchOverride: async () => [cProgTrap],
    }
  );
  assert.equal(
    guardedRec.primaryVideo,
    null,
    'Deterministic subject-conflict guard must reject unrelated video even if Gemini returns high score'
  );

  clearGeminiQuotaCooldown();
  let quotaCallCount = 0;
  const mockAiThrows: any = {
    models: {
      generateContent: async () => {
        quotaCallCount++;
        throw new Error('{"error":{"code":429,"status":"RESOURCE_EXHAUSTED","message":"Quota exceeded"}}');
      },
    },
  };
  const resilientRec = await recommendVideosForChapter(
    {
      courseTopic: 'Digital Marketing',
      category: 'Business',
      chapterTitle: 'Google Ads and PPC Advertising',
    },
    new Set(),
    {
      ai: mockAiThrows,
      searchOverride: async () => [googleAdsVideo],
    }
  );
  assert.equal(resilientRec.status, 'found');
  assert.equal(resilientRec.primaryVideo?.id, googleAdsVideo.id);
  assert.equal(quotaCallCount, 1, 'Quota error must trip circuit breaker immediately without retrying');

  // Second call during cooldown must skip Gemini completely
  const resilientRec2 = await recommendVideosForChapter(
    {
      courseTopic: 'Digital Marketing',
      category: 'Business',
      chapterTitle: 'Google Ads and PPC Advertising',
    },
    new Set(),
    {
      ai: mockAiThrows,
      searchOverride: async () => [googleAdsVideo],
    }
  );
  assert.equal(resilientRec2.status, 'found');
  assert.equal(quotaCallCount, 1, 'Subsequent call during cooldown must not hit Gemini API');
  clearGeminiQuotaCooldown();

  // 1I. Course-scoped deduplication across chapters
  const seoA = makeCandidate({
    id: 'SeoVideo001',
    title: 'Search Engine Optimization (SEO) Tutorial for Beginners',
    description: 'Learn on-page SEO, keyword research, and technical SEO in digital marketing.',
  });
  const seoB = makeCandidate({
    id: 'SeoVideo002',
    title: 'Complete SEO Course for Digital Marketing Beginners',
    description: 'Search engine optimization tutorial and backlinks guide.',
  });
  const courseRecs = await recommendVideosForCourseChapters(
    {
      courseTopic: 'Digital Marketing',
      category: 'Business',
      includeVideo: true,
      chapters: [
        { title: 'Search Engine Optimization (SEO)' },
        { title: 'Technical SEO and Backlinks' },
      ],
    },
    {
      searchOverride: async () => [seoA, seoB],
    }
  );
  assert.notEqual(
    courseRecs[0].primaryVideo?.id,
    courseRecs[1].primaryVideo?.id,
    'Chapters in the same course must never be assigned duplicate primary videos'
  );

  // 1J. applyVideoRecommendationToChapter preserves message when no video found
  const dummyChapter: CourseChapter = {
    id: 'ch-1',
    chapterNumber: 1,
    title: 'Email Marketing',
    description: 'Email campaigns',
    duration: '20m',
    completed: false,
    isUnlocked: true,
    content: {
      introduction: 'Email marketing intro',
      sections: [],
      keyTakeaways: [],
    },
    videoId: 'OLD_STALE_ID',
  };
  const updatedEmpty = applyVideoRecommendationToChapter(dummyChapter, noMatchRec, true);
  assert.equal(updatedEmpty.videoId, undefined);
  assert.equal(updatedEmpty.videoStatus, 'no_relevant_videos');
  assert.equal(updatedEmpty.videoMessage, NO_RELEVANT_VIDEOS_MESSAGE);

  console.log('✓ All 10 unit & strict rejection assertions passed!\n');
}

async function runLiveSubjectTests() {
  console.log('=== 2. Running Live YouTube Integration Tests Across 5 Required Subjects ===');
  clearVideoRecommendationCache();

  const subjects: Array<{
    name: string;
    courseTopic: string;
    category: string;
    forbiddenPattern: RegExp;
    chapters: Array<{ title: string }>;
  }> = [
    {
      name: 'Test 1: Digital Marketing',
      courseTopic: 'Digital Marketing',
      category: 'Business',
      forbiddenPattern: /\bc programming\b|\bpointer\b|\bmalloc\b|\bpython\b|\bjava\b(?!script)/i,
      chapters: [
        { title: 'Introduction to Digital Marketing' },
        { title: 'Search Engine Optimization (SEO)' },
        { title: 'Social Media Marketing' },
        { title: 'Google Ads and PPC Advertising' },
        { title: 'Email Marketing' },
        { title: 'Content Marketing' },
        { title: 'Digital Marketing Analytics' },
      ],
    },
    {
      name: 'Test 2: Python Programming',
      courseTopic: 'Python Programming',
      category: 'Programming',
      forbiddenPattern: /\bdigital marketing\b|\bseo\b|\bc\+\+\b|\bjava programming\b/i,
      chapters: [
        { title: 'Python Variables and Data Types' },
        { title: 'Python Loops and Control Flow' },
        { title: 'Python Functions and Scope' },
      ],
    },
    {
      name: 'Test 3: Machine Learning',
      courseTopic: 'Machine Learning',
      category: 'Artificial Intelligence',
      forbiddenPattern: /\bosi model\b|\btcp\/ip\b|\bdigital marketing\b|\bhtml5\b/i,
      chapters: [
        { title: 'Supervised Learning' },
        { title: 'Unsupervised Learning and Clustering' },
        { title: 'Neural Networks and Backpropagation' },
      ],
    },
    {
      name: 'Test 4: Web Development',
      courseTopic: 'Web Development',
      category: 'Programming',
      forbiddenPattern: /\bc programming\b|\bneural network\b|\bseo backlinks\b/i,
      chapters: [
        { title: 'HTML5 and Semantic Elements' },
        { title: 'CSS Flexbox and Grid' },
        { title: 'JavaScript DOM Manipulation' },
        { title: 'React Components and Hooks' },
      ],
    },
    {
      name: 'Test 5: Data Structures and Algorithms',
      courseTopic: 'Data Structures and Algorithms',
      category: 'Computer Science',
      forbiddenPattern: /\bdigital marketing\b|\bemail marketing\b|\bcss flexbox\b/i,
      chapters: [
        { title: 'Arrays and Big-O Notation' },
        { title: 'Linked Lists and Stacks' },
        { title: 'Binary Search Trees' },
        { title: 'Sorting Algorithms' },
      ],
    },
  ];

  for (const subj of subjects) {
    console.log(`\n--- ${subj.name} ---`);
    const recs = await recommendVideosForCourseChapters({
      courseTopic: subj.courseTopic,
      category: subj.category,
      includeVideo: true,
      language: 'English',
      chapters: subj.chapters,
    });

    const primaryQueries = recs.map((r) => r.searchQueries[0]);
    assert.equal(
      new Set(primaryQueries.map((q) => q.toLowerCase())).size,
      primaryQueries.length,
      `${subj.name}: chapter search queries must all be distinct`
    );

    const assignedIds: string[] = [];
    let foundCount = 0;

    for (const r of recs) {
      if (r.primaryVideo) {
        foundCount++;
        assignedIds.push(r.primaryVideo.id);
        assert.ok(
          r.primaryVideo.relevanceScore >= DEFAULT_RELEVANCE_THRESHOLD,
          `${subj.name} / "${r.chapterTitle}" score ${r.primaryVideo.relevanceScore} < ${DEFAULT_RELEVANCE_THRESHOLD}`
        );
        assert.equal(
          subj.forbiddenPattern.test(r.primaryVideo.title),
          false,
          `${subj.name} / "${r.chapterTitle}" matched forbidden unrelated subject in title: "${r.primaryVideo.title}"`
        );
        console.log(
          `  ✓ [${r.primaryVideo.relevanceScore}%] ${r.chapterTitle}\n      Query: "${r.searchQueries[0]}"\n      Video: "${r.primaryVideo.title}" (${r.primaryVideo.id}) — ${r.primaryVideo.channel}`
        );
      } else {
        console.log(
          `  ! [${r.status}] ${r.chapterTitle} — ${r.message} (Query: "${r.searchQueries[0]}")`
        );
      }
    }

    assert.equal(
      new Set(assignedIds).size,
      assignedIds.length,
      `${subj.name}: duplicate video IDs assigned across chapters`
    );
    assert.ok(
      foundCount >= Math.ceil(subj.chapters.length * 0.7),
      `${subj.name}: expected at least 70% chapter match rate, got ${foundCount}/${subj.chapters.length}`
    );
  }

  console.log('\n✓ All 5 live subject recommendation tests passed!');
}

async function main() {
  await runUnitTests();
  await runLiveSubjectTests();
}

main().catch((err) => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
