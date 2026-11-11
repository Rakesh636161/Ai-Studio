/**
 * Video Processing Utility
 * Handles video file validation, client-side canvas keyframe extraction,
 * audio/video player state management, and race condition prevention.
 */

export interface ExtractedVideoData {
  processingId: string;
  fileName: string;
  fileSize: number;
  durationSeconds: number;
  durationFormatted: string;
  frames: string[]; // Base64 JPEG data URLs
  sampleScenario?: string;
}

export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function createProcessingId(): string {
  return 'vproc_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

export function validateVideoFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No video file selected.' };
  }

  const validTypes = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-matroska',
  ];

  const hasValidExt = /\.(mp4|webm|ogg|mov|mkv)$/i.test(file.name);
  const hasValidMime = validTypes.includes(file.type);

  if (!hasValidExt && !hasValidMime) {
    return {
      valid: false,
      error: 'Please upload a valid video lecture file (.mp4, .webm, or .mov).',
    };
  }

  // 100 MB max limit
  const maxBytes = 100 * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: 'Video file size exceeds the 100MB limit. Please upload a smaller video clip.',
    };
  }

  return { valid: true };
}

/**
 * Resets an HTML5 video element completely, removing src, pausing playback,
 * and freeing object URL memory to prevent any stale state or caching.
 */
export function resetVideoElement(videoEl: HTMLVideoElement | null, currentBlobUrl?: string | null) {
  if (!videoEl) return;
  try {
    videoEl.pause();
    videoEl.removeAttribute('src');
    videoEl.load();
  } catch {
    // Ignore DOM unload errors
  }
  if (currentBlobUrl && currentBlobUrl.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(currentBlobUrl);
    } catch {
      // Ignore
    }
  }
}

/**
 * Extracts representative high-clarity keyframes across the video using an off-screen HTML5 Canvas.
 * Captures slides, blackboard writing, diagrams, and titles for multimodal AI inspection.
 */
export async function extractVideoFrames(
  videoSource: File | string,
  processingId: string,
  numFrames: number = 5,
  onProgress?: (percent: number, status: string) => void,
  signal?: AbortSignal
): Promise<ExtractedVideoData> {
  let objectUrl = '';
  const isFile = videoSource instanceof File;
  const fileName = isFile ? videoSource.name : 'lecture_video.mp4';
  const fileSize = isFile ? videoSource.size : 15 * 1024 * 1024;

  if (isFile) {
    objectUrl = URL.createObjectURL(videoSource);
  } else {
    objectUrl = videoSource;
  }

  return new Promise<ExtractedVideoData>((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';

    let isCleanedUp = false;
    const cleanup = () => {
      if (isCleanedUp) return;
      isCleanedUp = true;
      try {
        video.pause();
        video.removeAttribute('src');
        video.load();
      } catch {
        // Ignore
      }
      if (isFile && objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };

    if (signal) {
      signal.addEventListener('abort', () => {
        cleanup();
        reject(new DOMException('Video analysis aborted by user', 'AbortError'));
      });
    }

    video.onerror = () => {
      cleanup();
      reject(new Error('Failed to load video file. Please verify codec format (H.264/AAC MP4 recommended).'));
    };

    video.onloadedmetadata = async () => {
      if (signal?.aborted) return;
      const duration = video.duration || 60;
      onProgress?.(25, `Loaded metadata (${formatDuration(duration)}). Extracting lecture frames...`);

      const frames: string[] = [];
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        cleanup();
        reject(new Error('HTML5 Canvas 2D context not supported on this browser.'));
        return;
      }

      // Compute evenly distributed checkpoints across duration (avoid 0.0s black screen)
      const timestamps: number[] = [];
      for (let i = 1; i <= numFrames; i++) {
        const factor = i / (numFrames + 1);
        timestamps.push(Math.max(1, duration * factor));
      }

      let currentIdx = 0;

      const seekNext = () => {
        if (signal?.aborted) return;
        if (currentIdx >= timestamps.length) {
          cleanup();
          resolve({
            processingId,
            fileName,
            fileSize,
            durationSeconds: Math.round(duration),
            durationFormatted: formatDuration(duration),
            frames,
          });
          return;
        }

        const targetTime = timestamps[currentIdx];
        const progressPct = 25 + Math.round((currentIdx / timestamps.length) * 45);
        onProgress?.(progressPct, `Extracting frame ${currentIdx + 1} of ${timestamps.length} at ${formatDuration(targetTime)}...`);
        video.currentTime = targetTime;
      };

      video.onseeked = () => {
        if (signal?.aborted) return;
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          // Export high-quality JPEG base64 string
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          frames.push(dataUrl);
          currentIdx++;
          seekNext();
        } catch (drawErr: any) {
          console.warn('[Frame capture notice]:', drawErr?.message);
          // Still proceed if individual frame draw fails (e.g. cross-origin video)
          currentIdx++;
          seekNext();
        }
      };

      // Start sequential extraction
      seekNext();
    };

    video.src = objectUrl;
  });
}

/**
 * Pre-configured verified academic lecture video test scenarios
 * specifically enabling instant verification of User Requirements:
 * 1. DBMS Lecture (must recognize as DBMS, not Python)
 * 2. Python Programming Lecture
 * 3. Computer Networks Lecture (OSI & TCP/IP)
 * 4. Operating Systems Lecture (CPU Scheduling & Deadlocks)
 * 5. Non-English Regional Language Lecture (Telugu/Hindi) to verify language rejection
 */
export interface SampleLectureScenario {
  id: string;
  title: string;
  expectedSubject:
    | 'DBMS'
    | 'Python Programming'
    | 'Computer Networks'
    | 'Operating Systems'
    | 'Computer Vision';
  expectedLanguage: string;
  isEnglish: boolean;
  durationSeconds: number;
  description: string;
  keyVisualEvidence: string[];
  mockFrames: string[];
}

// Generate realistic lecture slides as canvas base64 image data URLs
export function generateSyntheticLectureSlide(
  subjectTitle: string,
  topicTitle: string,
  bulletPoints: string[],
  diagramOrCode: string,
  languageBadge: string = 'English'
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  const gradient = ctx.createLinearGradient(0, 0, 640, 360);
  gradient.addColorStop(0, '#0F172A');
  gradient.addColorStop(1, '#1E293B');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 640, 360);

  // Top header bar
  ctx.fillStyle = '#8150E8';
  ctx.fillRect(0, 0, 640, 6);

  // Subject Tag
  ctx.fillStyle = '#A78BFA';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(subjectTitle.toUpperCase(), 30, 36);

  // Language Tag
  ctx.fillStyle = languageBadge === 'English' ? '#10B981' : '#F59E0B';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText(`Language: ${languageBadge}`, 520, 36);

  // Lecture Topic Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 19px sans-serif';
  ctx.fillText(topicTitle, 30, 68);

  // Divider
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, 82);
  ctx.lineTo(610, 82);
  ctx.stroke();

  // Bullet points
  ctx.fillStyle = '#E2E8F0';
  ctx.font = '13px sans-serif';
  let y = 115;
  bulletPoints.slice(0, 4).forEach((pt) => {
    ctx.fillStyle = '#8150E8';
    ctx.fillText('•', 30, y);
    ctx.fillStyle = '#CBD5E1';
    ctx.fillText(pt, 45, y);
    y += 26;
  });

  // Diagram / Code Box
  ctx.fillStyle = '#020617';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(30, 230, 580, 105, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('CONCEPTUAL ARCHITECTURE / VISUAL SPECIFICATION:', 42, 248);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '11px monospace';
  const lines = diagramOrCode.split('\n');
  let lineY = 268;
  lines.slice(0, 3).forEach((line) => {
    ctx.fillText(line, 42, lineY);
    lineY += 18;
  });

  return canvas.toDataURL('image/jpeg', 0.85);
}

export const SAMPLE_LECTURE_SCENARIOS: SampleLectureScenario[] = [
  {
    id: 'sample-dbms-normalization',
    title: 'DBMS Lecture: Database Normalization (1NF, 2NF, 3NF & BCNF)',
    expectedSubject: 'DBMS',
    expectedLanguage: 'English',
    isEnglish: true,
    durationSeconds: 1420,
    description:
      'University database lecture covering functional dependencies, 1NF, 2NF, 3NF, BCNF decomposition, relational schemas, primary and foreign keys.',
    keyVisualEvidence: [
      'Relational Table Schema: Students(StudentID [PK], DeptID [FK], CourseName)',
      'Functional Dependencies: DeptID -> DeptName, StudentID -> {Name, GPA}',
      'Decomposition into 3NF eliminating transitive dependency',
      'Lossless Join & Dependency Preservation conditions',
    ],
    mockFrames: [
      generateSyntheticLectureSlide(
        'Database Management Systems (DBMS)',
        'Lecture 04: Database Normalization & Functional Dependencies',
        [
          'Primary Key & Candidate Key definitions in Relational Model',
          'First Normal Form (1NF): Eliminating multi-valued repeating groups',
          'Second Normal Form (2NF): Eliminating partial functional dependencies',
          'Third Normal Form (3NF): Eliminating transitive dependencies (X -> Y, Y -> Z)',
        ],
        'TABLE: EnrolledCourses(StudentID [PK], CourseID [PK], Instructor, OfficeRoom)\nFD1: StudentID, CourseID -> Grade  |  FD2: Instructor -> OfficeRoom (Transitive!)'
      ),
      generateSyntheticLectureSlide(
        'Database Management Systems (DBMS)',
        'BCNF (Boyce-Codd Normal Form) & Lossless Decomposition',
        [
          'Strict requirement: For every non-trivial FD X -> Y, X must be a superkey',
          'Comparison of 3NF vs BCNF anomalies and redundancy reduction',
          'Lossless Join Property: R1 ∩ R2 must be a superkey for R1 or R2',
          'Dependency preservation verification using attribute closure',
        ],
        'SQL: CREATE TABLE Students (id INT PRIMARY KEY, name VARCHAR(100), dept_id INT REFERENCES Departments(id));'
      ),
    ],
  },
  {
    id: 'sample-python-programming',
    title: 'Python Programming: Functions, Scope & List Comprehensions',
    expectedSubject: 'Python Programming',
    expectedLanguage: 'English',
    isEnglish: true,
    durationSeconds: 1240,
    description:
      'Computer science programming lecture covering Python functions, *args and **kwargs, LEGB variable scoping, and list comprehensions.',
    keyVisualEvidence: [
      'def compute_metrics(*args, **kwargs): function signature',
      'LEGB variable scope: Local, Enclosing, Global, Built-in',
      'List comprehension syntax: [x**2 for x in items if x % 2 == 0]',
      'Python mutable vs immutable arguments (lists vs tuples)',
    ],
    mockFrames: [
      generateSyntheticLectureSlide(
        'Python Programming',
        'Lecture 03: Modular Functions, Arguments & Scope',
        [
          'Function definitions using def keyword, default parameters & return values',
          'Arbitrary arguments unpacking with *args (tuple) and **kwargs (dict)',
          'LEGB Variable Scoping: Local, Enclosing, Global, Built-in',
          'Pass-by-object-reference semantics for mutable vs immutable types',
        ],
        'def transform_data(records: list[dict], threshold: float = 0.5) -> list[str]:\n    return [r["user_id"] for r in records if r.get("score", 0) >= threshold]'
      ),
      generateSyntheticLectureSlide(
        'Python Programming',
        'Advanced Python: Generators, Lambdas & List Comprehensions',
        [
          'List comprehensions vs map() and filter() performance benchmarks',
          'Generator expressions with yield for memory-efficient iteration',
          'Lambda anonymous functions and higher-order functions',
          'Exception handling using try-except-finally blocks',
        ],
        'cubes = {num: num**3 for num in range(1, 10) if num % 2 != 0}\ngenerator = (x for x in range(1000000))  # O(1) memory usage'
      ),
    ],
  },
  {
    id: 'sample-computer-networks',
    title: 'Computer Networks: OSI 7-Layer Model & TCP/IP Architecture',
    expectedSubject: 'Computer Networks',
    expectedLanguage: 'English',
    isEnglish: true,
    durationSeconds: 1560,
    description:
      'Academic computer networking lecture detailing OSI 7 layers, TCP 3-way handshake, packet encapsulation, and IP routing.',
    keyVisualEvidence: [
      'OSI 7 Layers: Physical, Data Link, Network, Transport, Session, Presentation, Application',
      'TCP 3-Way Handshake: SYN, SYN-ACK, ACK packet exchange',
      'IPv4 Classless Inter-Domain Routing (CIDR) and Subnet Masks (/24, /16)',
      'Encapsulation: Data -> Segment -> Packet -> Frame -> Bits',
    ],
    mockFrames: [
      generateSyntheticLectureSlide(
        'Computer Networks',
        'Lecture 02: The OSI Reference Model vs TCP/IP Architecture',
        [
          'Layer 7-5: Application, Presentation, Session (Data payload)',
          'Layer 4 Transport: TCP (Reliable, Flow Control) vs UDP (Connectionless, Low Latency)',
          'Layer 3 Network: IP addressing, routing tables, ICMP and packet forwarding',
          'Layer 2 & 1: Data Link (MAC frames) and Physical transmission medium',
        ],
        'TCP 3-Way Handshake: Client [SYN seq=100] -> Server [SYN-ACK seq=300 ack=101] -> Client [ACK ack=301]'
      ),
    ],
  },
  {
    id: 'sample-operating-systems',
    title: 'Operating Systems: CPU Scheduling & Deadlock Prevention',
    expectedSubject: 'Operating Systems',
    expectedLanguage: 'English',
    isEnglish: true,
    durationSeconds: 1380,
    description:
      'Operating systems lecture explaining process states, preemptive Round-Robin scheduling, and Coffman deadlock conditions.',
    keyVisualEvidence: [
      'Process State Diagram: New -> Ready -> Running -> Waiting -> Terminated',
      'CPU Scheduling Algorithms: Round-Robin (Time Quantum), FCFS, Shortest Job First',
      'Coffman 4 Deadlock Conditions: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait',
      'Banker\'s Algorithm for Resource Allocation and Safe State verification',
    ],
    mockFrames: [
      generateSyntheticLectureSlide(
        'Operating Systems',
        'Lecture 05: CPU Scheduling Algorithms & Deadlock Avoidance',
        [
          'Process Control Block (PCB) structure: PID, Registers, Program Counter',
          'Context switching overhead and dispatcher latency metrics',
          'Coffman Conditions for Deadlock: Mutual exclusion, hold & wait, no preemption, circular wait',
          'Dijkstra\'s Banker\'s Algorithm for safe state deadlock avoidance',
        ],
        'Resource Allocation Graph (RAG): Processes P1, P2 requesting and holding instances of R1, R2'
      ),
    ],
  },
  {
    id: 'sample-non-english-rejection',
    title: 'Regional Language Lecture (Telugu/Hindi - Unsupported Language Test)',
    expectedSubject: 'DBMS',
    expectedLanguage: 'Telugu / Hindi',
    isEnglish: false,
    durationSeconds: 980,
    description:
      'Demonstrates language detection and rejection: Video contains regional language spoken explanations (Telugu/Hindi). The system must reject it with a friendly notification.',
    keyVisualEvidence: [
      'Spoken audio language detected: Telugu / Hindi (Regional Non-English)',
      'Subtitles & narration in regional non-English language',
      'System compliance rule: Only English-language lectures permitted',
    ],
    mockFrames: [
      generateSyntheticLectureSlide(
        'Database Management Systems',
        'డేటాబేస్ నార్మలైజేషన్ పాఠము (Database Normalization in Telugu)',
        [
          'ఈ వీడియోలో తెలుగు భాషలో వివరణ ఇవ్వబడినది (Spoken in Telugu)',
          'Regional language lecture video content',
          'AlphaWave AI requires English-language lecture videos',
          'System must reject regional language lectures and prompt for English',
        ],
        'డేటాబేస్ మేనేజ్మెంట్ సిస్టమ్స్ - మొదటి నార్మల్ ఫారమ్ (1NF) నియమాలు\nRegional non-English audio detected: Rejecting according to policy.',
        'Telugu / Non-English'
      ),
    ],
  },
];
