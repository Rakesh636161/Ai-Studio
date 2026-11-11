/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreateCourseWizard } from './pages/CreateCourseWizard';
import { CourseLayoutPage } from './pages/CourseLayoutPage';
import { CourseLearningPage } from './pages/CourseLearningPage';
import { ExplorePage } from './pages/ExplorePage';
import { MyCoursesPage } from './pages/MyCoursesPage';
import { PdfToCoursePage } from './pages/PdfToCoursePage';
import { AiTutorPage } from './pages/AiTutorPage';
import { LearningProgressPage } from './pages/LearningProgressPage';
import { CertificatesPage } from './pages/CertificatesPage';
import { VerifyCertificatePage } from './pages/VerifyCertificatePage';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage';
import { HelpSupportPage } from './pages/HelpSupportPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { VideoAnalysisPage } from './pages/VideoAnalysisPage';
import { FinalExamPage } from './pages/FinalExamPage';
import { User, Course } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('coursestudio_user');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const [courses, setCourses] = useState<Course[]>([]);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('coursestudio_token') || user?.id;
      if (!token || !user) {
        setCourses([]);
        return;
      }
      const res = await fetch('/api/courses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (err) {
      console.error('Failed fetching courses:', err);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [user?.id]);

  const handleLogout = () => {
    localStorage.removeItem('coursestudio_token');
    localStorage.removeItem('coursestudio_user');
    setUser(null);
    setCourses([]);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage user={user} />} />

        {/* Authentication Page (Email only + Instant Password Recreate) */}
        <Route
          path="/auth"
          element={
            <AuthPage
              onLogin={(loggedInUser) => {
                setUser(loggedInUser);
                setTimeout(() => fetchCourses(), 50);
              }}
            />
          }
        />

        {/* 1. Dashboard */}
        <Route
          path="/dashboard"
          element={
            user ? (
              <DashboardPage
                user={user}
                courses={courses}
                onRefreshCourses={fetchCourses}
                onLogout={handleLogout}
                onUserUpdated={(updatedUser) => setUser(updatedUser)}
              />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* 2. AI Course Generator */}
        <Route
          path="/create-course"
          element={
            user ? (
              <CreateCourseWizard
                user={user}
                onCourseCreated={(_newCourse) => {
                  fetchCourses();
                }}
              />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* 3. My Courses */}
        <Route
          path="/my-courses"
          element={
            user ? (
              <MyCoursesPage
                user={user}
                courses={courses}
                onRefreshCourses={fetchCourses}
                onLogout={handleLogout}
                onUserUpdated={(updatedUser) => setUser(updatedUser)}
              />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* 4. PDF to Course */}
        <Route
          path="/pdf-to-course"
          element={
            user ? (
              <PdfToCoursePage
                user={user}
                courses={courses}
                onRefreshCourses={fetchCourses}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* 4.5 Video Lecture Analyzer & Subject Detection */}
        <Route
          path="/video-analysis"
          element={
            user ? (
              <VideoAnalysisPage
                user={user}
                courses={courses}
                onRefreshCourses={fetchCourses}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* 5. AI Tutor – Doubt Solver */}
        <Route
          path="/ai-tutor"
          element={
            user ? (
              <AiTutorPage
                user={user}
                courses={courses}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* 6. My Learning Progress */}
        <Route
          path="/progress"
          element={
            user ? (
              <LearningProgressPage
                user={user}
                courses={courses}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* 7. Certificates */}
        <Route
          path="/certificates"
          element={
            user ? (
              <CertificatesPage
                user={user}
                courses={courses}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* Public Certificate Verification (Accessible by Anyone!) */}
        <Route path="/verify-certificate" element={<VerifyCertificatePage />} />
        <Route path="/verify-certificate/:id" element={<VerifyCertificatePage />} />

        {/* 8. Profile and Settings */}
        <Route
          path="/profile"
          element={
            user ? (
              <ProfileSettingsPage
                user={user}
                courses={courses}
                onLogout={handleLogout}
                onUserUpdated={(updatedUser) => setUser(updatedUser)}
              />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* 9. Help and Support */}
        <Route
          path="/help"
          element={
            user ? (
              <HelpSupportPage
                user={user}
                courses={courses}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* 10. Admin & Platform Management */}
        <Route
          path="/admin"
          element={
            user ? (
              <AdminDashboardPage
                user={user}
                courses={courses}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* Explore Courses */}
        <Route
          path="/dashboard/explore"
          element={
            user ? (
              <ExplorePage
                user={user}
                courses={courses}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* Course Layout (Public / Shareable) */}
        <Route
          path="/course/:id"
          element={
            <CourseLayoutPage
              user={user}
              onRefreshCourses={fetchCourses}
            />
          }
        />
        <Route
          path="/create-course/:id"
          element={
            <CourseLayoutPage
              user={user}
              onRefreshCourses={fetchCourses}
            />
          }
        />

        {/* Interactive Course Learning Page with Locked Lectures & 75% Assessments */}
        <Route
          path="/course/:id/start"
          element={<CourseLearningPage />}
        />

        {/* Final Comprehensive Assessment (15 Questions) */}
        <Route
          path="/course/:id/final-exam"
          element={
            user ? (
              <FinalExamPage user={user} onRefreshCourses={fetchCourses} />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
