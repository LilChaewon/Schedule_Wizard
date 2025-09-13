// CSV 데이터 파싱 유틸리티

import { Course, CourseTime } from '@/lib/types/course';
import { parseKoreanTime } from './time';

/**
 * CSV 파일을 파싱하여 Course 배열로 변환
 * @param csvContent - CSV 문자열 내용
 * @param semester - 학기 정보
 * @param year - 연도
 * @returns Course 배열과 CourseTime 배열
 */
export function parseKoreanUniversityCSV(
  csvContent: string,
  semester: string,
  year: number
): { courses: Course[]; courseTimes: CourseTime[] } {
  const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line);
  const courses: Course[] = [];
  const courseTimes: CourseTime[] = [];
  
  // 현재 처리 중인 과목 정보 (여러 분반이 연속으로 나올 수 있음)
  let currentCourse: Partial<Course> | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // 헤더 행 건너뛰기
    if (line.includes('학년,교과목명,한글코드') || 
        line.includes('강 의 시 간 표') ||
        line.includes('학년도') ||
        line.startsWith(',,,,,,,,,,,,,,,,') ||
        line.startsWith('﻿,,,,,,,,,,,,,,,,')) {
      continue;
    }
    
    // CSV 파싱 (쉼표로 분리)
    const columns = parseCSVLine(line);
    if (columns.length < 12) continue;
    
    const [
      gradeLevel,      // 0: 학년
      courseName,      // 1: 교과목명
      courseCode,      // 2: 한글코드
      ,,,              // 3-5: 빈 컬럼들
      credits,         // 6: 학점
      hours,           // 7: 시간
      professor,       // 8: 담당교수
      ,                // 9: 빈 컬럼
      sectionNumber,   // 10: 강좌번호
      maxStudents,     // 11: 제한인원
      timeAndRoom,     // 12: 시간(강의실)
      ,,,,,            // 13-17: 빈 컬럼들
      notes            // 18: 비고
    ] = columns;
    
    // 새로운 과목인지 확인 (학년, 과목명, 과목코드가 모두 있으면 새 과목)
    const isNewCourse = gradeLevel && courseName && courseCode;
    
    if (isNewCourse) {
      // 새로운 과목 시작
      currentCourse = {
        courseCode: courseCode.trim(),
        courseName: courseName.trim(),
        credits: parseInt(credits?.trim()) || 0,
        department: inferDepartmentFromCode(courseCode.trim()),
        gradeLevel: parseGradeLevel(gradeLevel.trim()),
        semester,
        year,
      };
    }
    
    // 현재 과목이 있고, 교수와 분반, 시간 정보가 있으면 분반 추가
    if (currentCourse && sectionNumber && timeAndRoom) {
      // 교수가 없으면 '미배정'으로 처리
      const professorName = professor?.trim() || '미배정';
      try {
        const courseId = `${currentCourse.courseCode}-${sectionNumber.trim()}-${semester}-${year}`;
        
        // 시간 정보 파싱
        const parsedTimes = parseKoreanTime(timeAndRoom, courseId);
        
        const course: Course = {
          id: courseId,
          courseCode: currentCourse.courseCode!,
          courseName: currentCourse.courseName!,
          professor: professorName,
          credits: currentCourse.credits!,
          department: currentCourse.department!,
          gradeLevel: currentCourse.gradeLevel!,
          maxStudents: parseInt(maxStudents?.trim()) || 0,
          semester,
          year,
          sectionNumber: sectionNumber.trim(),
          notes: notes?.trim() || undefined,
        };
        
        courses.push(course);
        courseTimes.push(...parsedTimes);
        
      } catch (error) {
        console.warn(`Failed to parse course section: ${currentCourse.courseName} ${professor}`, error);
      }
    }
  }
  
  console.log(`Parsed ${courses.length} courses with ${courseTimes.length} time slots`);
  return { courses, courseTimes };
}

/**
 * CSV 라인을 파싱 (쉼표로 분리하되 따옴표 처리)
 * @param line - CSV 라인
 * @returns 파싱된 컬럼 배열
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * 한국 시간표 형식 파싱 ("월09:00-10:50 (Y2508)")
 * @param timeStr - 시간 문자열
 * @returns CourseTime 배열 (여러 요일 가능)
 */
export function parseKoreanTime(timeStr: string, courseId: string): CourseTime[] {
  const regex = /([월화수목금토]+)(\d{2}):(\d{2})-(\d{2}):(\d{2})\s*\(([^)]*)\)/;
  const match = timeStr.trim().match(regex);
  
  if (!match) {
    console.warn(`Failed to parse time format: ${timeStr}`);
    return [];
  }

  const [, daysStr, startHour, startMin, endHour, endMin, room] = match;
  const days = parseKoreanDays(daysStr);
  
  return days.map((dayOfWeek, index) => ({
    id: `${courseId}-${dayOfWeek}-${index}`,
    courseId,
    dayOfWeek,
    startTime: `${startHour}:${startMin}`,
    endTime: `${endHour}:${endMin}`,
    room: room.trim() || undefined,
  }));
}

/**
 * 한국어 요일 문자열을 숫자 배열로 변환
 * @param daysStr - 요일 문자열 (예: "월수금")
 * @returns 요일 숫자 배열
 */
function parseKoreanDays(daysStr: string): number[] {
  const KOREAN_DAYS: Record<string, number> = {
    '월': 1,
    '화': 2,
    '수': 3,
    '목': 4,
    '금': 5,
    '토': 6,
  };

  return Array.from(daysStr)
    .map(day => KOREAN_DAYS[day])
    .filter(Boolean);
}

/**
 * 과목 코드에서 학과 정보 추론
 * @param courseCode - 과목 코드
 * @returns 학과명
 */
function inferDepartmentFromCode(courseCode: string): string {
  const prefixMap: Record<string, string> = {
    'CS': '컴퓨터과학과',
    'MATH': '수학과',
    'PHYS': '물리학과',
    'CHEM': '화학과',
    'BIO': '생물학과',
    'ENG': '영어영문학과',
    'KOR': '국어국문학과',
    'HIST': '사학과',
    'ECON': '경제학과',
    'MGMT': '경영학과',
    '교필': '교양필수',
    '교선': '교양선택',
    '전선': '전공선택',
    '전필': '전공필수',
  };
  
  // 숫자 제거하여 접두사 추출
  const prefix = courseCode.replace(/\d+/g, '');
  return prefixMap[prefix] || '기타';
}

/**
 * 학년 정보 파싱
 * @param gradeStr - 학년 문자열
 * @returns 학년 숫자
 */
function parseGradeLevel(gradeStr: string): number {
  if (!gradeStr || gradeStr === '전학년') return 0;
  
  const match = gradeStr.match(/(\d+)학년/);
  return match ? parseInt(match[1]) : 0;
}