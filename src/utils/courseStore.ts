import { Course, CourseChapter, User } from '../types';

export const INITIAL_USER: User = {
  id: 'user_default_1',
  name: 'Student Learner',
  email: 'sagarn6363@gmail.com',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  coursesCreated: 3,
};

export const INITIAL_COURSES: Course[] = [
  {
    id: 'course-sql-101',
    userId: 'user_default_1',
    title: 'Introduction to SQL for Beginners',
    description: 'This course provides a comprehensive introduction to Structured Query Language (SQL), a standard language used to interact with relational databases. You will learn the essential SQL commands and concepts for querying, manipulating, and managing data.',
    category: 'Programming',
    difficulty: 'Beginner',
    duration: '1 hour',
    noOfChapters: 5,
    includeVideo: true,
    thumbnailUrl: '/src/assets/images/banner_sql_course_1794057965712.jpg',
    createdAt: '2026-11-01T10:00:00Z',
    creatorName: 'Course Studio AI',
    userEmail: 'sagarn6363@gmail.com',
    progress: 20,
    chapters: [
      {
        chapterNumber: 1,
        title: 'What is SQL and Relational Databases?',
        description: 'This chapter introduces SQL as a language for interacting with databases and explains the concept of relational databases, focusing on their structure and key components.',
        duration: '15 minutes',
        videoId: '7S_tz1z_5bA',
        completed: true,
        isUnlocked: true,
      },
      {
        chapterNumber: 2,
        title: 'Basic SQL Commands: SELECT, WHERE, ORDER BY',
        description: 'This chapter dives into essential SQL commands for selecting data, filtering results with WHERE clauses, and sorting data using ORDER BY.',
        duration: '25 minutes',
        videoId: '27axs9dO7AE',
        completed: false,
        isUnlocked: true,
      },
      {
        chapterNumber: 3,
        title: 'Data Manipulation: INSERT, UPDATE, DELETE',
        description: 'You will learn how to add new data using INSERT, modify existing data with UPDATE, and remove data with DELETE commands.',
        duration: '20 minutes',
        videoId: 'vPQnSj_aDQE',
        completed: false,
        isUnlocked: false,
      },
      {
        chapterNumber: 4,
        title: 'Joins and Aggregations',
        description: 'This chapter covers essential SQL concepts like joins to combine data from multiple tables and aggregation functions for calculating summaries and statistics.',
        duration: '25 minutes',
        videoId: '0r6vM7ZkUvA',
        completed: false,
        isUnlocked: false,
      },
      {
        chapterNumber: 5,
        title: 'Practice Exercises and Project',
        description: 'This chapter provides hands-on practice exercises to solidify your understanding of SQL, followed by a simple database project that uses the concepts you have learned.',
        duration: '15 minutes',
        videoId: 'HXV3zeRR3h4',
        completed: false,
        isUnlocked: false,
      },
    ],
  },
];

const STORAGE_KEY_COURSES = 'coursestudio_courses_v2';
const STORAGE_KEY_USER = 'coursestudio_user_v2';

export function getStoredUser(): User {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return INITIAL_USER;
}

export function saveStoredUser(user: User): void {
  try {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  } catch (e) {
    console.error(e);
  }
}

export function getStoredCourses(): Course[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COURSES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error(e);
  }
  saveStoredCourses(INITIAL_COURSES);
  return INITIAL_COURSES;
}

export function saveStoredCourses(courses: Course[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_COURSES, JSON.stringify(courses));
  } catch (e) {
    console.error(e);
  }
}

export function addCourse(newCourse: Course): void {
  const current = getStoredCourses();
  const updated = [newCourse, ...current];
  saveStoredCourses(updated);
}

export function updateCourse(id: string, updates: Partial<Course>): Course | null {
  const current = getStoredCourses();
  const idx = current.findIndex(c => c.id === id);
  if (idx === -1) return null;
  const updatedCourse = { ...current[idx], ...updates };
  current[idx] = updatedCourse;
  saveStoredCourses(current);
  return updatedCourse;
}

export function deleteCourse(id: string): void {
  const current = getStoredCourses();
  const filtered = current.filter(c => c.id !== id);
  saveStoredCourses(filtered);
}

export function getCourseById(id: string): Course | null {
  const current = getStoredCourses();
  return current.find(c => c.id === id) || null;
}
