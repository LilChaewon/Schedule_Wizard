// 실제 CSV 데이터 로딩 유틸리티

import { Course, CourseTime } from '@/lib/types/course';
import { parseKoreanUniversityCSV } from './csv-parser';

/**
 * 샘플 데이터 생성 (개발용)
 */
export function generateSampleCourses(): { courses: Course[]; courseTimes: CourseTime[] } {
  const courses: Course[] = [
    {
      id: '교필127-0001-2025-2',
      courseCode: '교필127',
      courseName: '성서와인간이해',
      professor: '김진옥',
      credits: 2,
      department: '교양필수',
      gradeLevel: 0,
      maxStudents: 50,
      semester: '2025-2',
      year: 2025,
      sectionNumber: '0001'
    },
    {
      id: 'MATH101-0001-2025-2',
      courseCode: 'MATH101',
      courseName: '미적분학1',
      professor: '박수학',
      credits: 3,
      department: '수학과',
      gradeLevel: 1,
      maxStudents: 40,
      semester: '2025-2',
      year: 2025,
      sectionNumber: '0001'
    },
    {
      id: 'CS201-0001-2025-2',
      courseCode: 'CS201',
      courseName: '자료구조',
      professor: '이컴퓨터',
      credits: 3,
      department: '컴퓨터과학과',
      gradeLevel: 2,
      maxStudents: 35,
      semester: '2025-2',
      year: 2025,
      sectionNumber: '0001'
    },
    {
      id: 'CS301-0001-2025-2',
      courseCode: 'CS301',
      courseName: '데이터베이스',
      professor: '최데이터',
      credits: 3,
      department: '컴퓨터과학과',
      gradeLevel: 3,
      maxStudents: 30,
      semester: '2025-2',
      year: 2025,
      sectionNumber: '0001'
    },
    {
      id: 'ENG101-0001-2025-2',
      courseCode: 'ENG101',
      courseName: '영어회화',
      professor: 'John Smith',
      credits: 2,
      department: '영어영문학과',
      gradeLevel: 1,
      maxStudents: 25,
      semester: '2025-2',
      year: 2025,
      sectionNumber: '0001'
    }
  ];

  const courseTimes: CourseTime[] = [
    {
      id: '교필127-0001-2025-2-1',
      courseId: '교필127-0001-2025-2',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '10:50',
      room: 'Y2508'
    },
    {
      id: 'MATH101-0001-2025-2-1',
      courseId: 'MATH101-0001-2025-2',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '09:50',
      room: '수학관201'
    },
    {
      id: 'MATH101-0001-2025-2-2',
      courseId: 'MATH101-0001-2025-2',
      dayOfWeek: 3,
      startTime: '09:00',
      endTime: '09:50',
      room: '수학관201'
    },
    {
      id: 'MATH101-0001-2025-2-3',
      courseId: 'MATH101-0001-2025-2',
      dayOfWeek: 5,
      startTime: '09:00',
      endTime: '09:50',
      room: '수학관201'
    },
    {
      id: 'CS201-0001-2025-2-1',
      courseId: 'CS201-0001-2025-2',
      dayOfWeek: 2,
      startTime: '14:00',
      endTime: '15:50',
      room: '공학관301'
    },
    {
      id: 'CS201-0001-2025-2-2',
      courseId: 'CS201-0001-2025-2',
      dayOfWeek: 4,
      startTime: '14:00',
      endTime: '15:50',
      room: '공학관301'
    },
    {
      id: 'CS301-0001-2025-2-1',
      courseId: 'CS301-0001-2025-2',
      dayOfWeek: 1,
      startTime: '16:00',
      endTime: '17:50',
      room: '공학관302'
    },
    {
      id: 'CS301-0001-2025-2-2',
      courseId: 'CS301-0001-2025-2',
      dayOfWeek: 3,
      startTime: '16:00',
      endTime: '17:50',
      room: '공학관302'
    },
    {
      id: 'ENG101-0001-2025-2-1',
      courseId: 'ENG101-0001-2025-2',
      dayOfWeek: 2,
      startTime: '11:00',
      endTime: '12:50',
      room: '인문관105'
    }
  ];

  return { courses, courseTimes };
}

/**
 * CSV 파일에서 실제 과목 데이터를 로드
 */
export async function loadCourseData(): Promise<{ courses: Course[]; courseTimes: CourseTime[] }> {
  try {
    console.log('Loading CSV file from /2025-2.csv...');
    // 실제 CSV 파일 로드
    const response = await fetch('/2025-2.csv');
    if (response.ok) {
      let csvContent = await response.text();
      console.log('CSV file loaded successfully, parsing...');
      
      // UTF-8 BOM 제거
      if (csvContent.charCodeAt(0) === 0xFEFF) {
        csvContent = csvContent.slice(1);
      }
      
      console.log(`CSV content length: ${csvContent.length} characters`);
      console.log('First few lines:', csvContent.split('\n').slice(0, 10));
      
      // CSV 내용 파싱
      const result = parseKoreanUniversityCSV(csvContent, '2025-2', 2025);
      
      if (result.courses.length > 0) {
        console.log(`Successfully parsed ${result.courses.length} courses from CSV`);
        return result;
      } else {
        console.warn('No courses found in CSV, falling back to sample data');
      }
    } else {
      console.warn('CSV file not found (404), using sample data');
    }
  } catch (error) {
    console.error('Failed to load or parse CSV file:', error);
  }
  
  // CSV 파일이 없거나 파싱 실패 시 샘플 데이터 사용
  console.log('Using sample data instead');
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