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
  
  // 헤더를 찾아서 데이터 시작 위치 결정
  let dataStartIndex = 8;
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    if (lines[i].includes('학년') && lines[i].includes('교과목명')) {
      dataStartIndex = i + 1;
      break;
    }
  }
  
  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // CSV 파싱 (쉼표로 분리하되 따옴표 안의 쉼표는 무시)
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
    
    // 필수 필드 검증
    if (!courseName || !professor || !timeAndRoom) {
      continue;
    }
    
    const courseId = `${courseCode}-${sectionNumber}-${semester}-${year}`;
    
    try {
      // 시간 정보 파싱
      const parsedTimes = parseKoreanTime(timeAndRoom, courseId);
      
      const course: Course = {
        id: courseId,
        courseCode: courseCode?.trim() || '',
        courseName: courseName.trim(),
        professor: professor.trim(),
        credits: parseInt(credits?.trim()) || 0,
        department: inferDepartmentFromCode(courseCode?.trim() || ''),
        gradeLevel: parseGradeLevel(gradeLevel?.trim() || ''),
        maxStudents: parseInt(maxStudents?.trim()) || 0,
        semester,
        year,
        sectionNumber: sectionNumber?.trim() || '001',
        notes: notes?.trim() || undefined,
      };
      
      courses.push(course);
      courseTimes.push(...parsedTimes);
      
    } catch (error) {
      console.warn(`Failed to parse course: ${courseName}`, error);
    }
  }
  
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

/**
 * 샘플 데이터 생성 (개발용)
 */
export function generateSampleCourses(): { courses: Course[]; courseTimes: CourseTime[] } {
  const sampleCSV = `학년,교과목명,한글코드,,,학점,시간,담당교수,,강좌번호,제한인원,시간(강의실),,,,비  고,
전학년,성서와인간이해,교필127,,,2 ,2 ,김진옥,, 0001,50 ,월09:00-10:50 (Y2508),,,,,
전학년,성서와인간이해,교필127,,,2 ,2 ,김준,, 0002,50 ,월11:00-12:50 (Y9006),,,,,
1학년,미적분학1,MATH101,,,3,3,박수학,, 0001,40,월수금09:00-09:50 (수학관201),,,,,
2학년,자료구조,CS201,,,3,3,이컴퓨터,, 0001,35,화목14:00-15:50 (공학관301),,,,,
3학년,데이터베이스,CS301,,,3,3,최데이터,, 0001,30,월수16:00-17:50 (공학관302),,,,,`;
  
  return parseKoreanUniversityCSV(sampleCSV, '2025-2', 2025);
}