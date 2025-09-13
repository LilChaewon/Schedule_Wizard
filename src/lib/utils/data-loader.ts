// 실제 CSV 데이터 로딩 유틸리티

import { Course, CourseTime } from '@/lib/types/course';
import { parseKoreanUniversityCSV, generateSampleCourses } from './csv-parser';

/**
 * CSV 파일에서 실제 과목 데이터를 로드
 */
export async function loadCourseData(): Promise<{ courses: Course[]; courseTimes: CourseTime[] }> {
  try {
    // 실제 CSV 파일이 있으면 로드
    const response = await fetch('/2025-2.csv');
    if (response.ok) {
      const csvContent = await response.text();
      return parseKoreanUniversityCSV(csvContent, '2025-2', 2025);
    }
  } catch (error) {
    console.warn('Failed to load CSV file, using sample data:', error);
  }
  
  // CSV 파일이 없으면 샘플 데이터 사용
  return generateSampleCourses();
}

/**
 * 로컬 스토리지에서 사용자 시간표 로드
 */
export function loadUserSchedule(): string[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const saved = localStorage.getItem('user-schedule');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Failed to load user schedule:', error);
    return [];
  }
}

/**
 * 로컬 스토리지에 사용자 시간표 저장
 */
export function saveUserSchedule(courseIds: string[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('user-schedule', JSON.stringify(courseIds));
  } catch (error) {
    console.error('Failed to save user schedule:', error);
  }
}