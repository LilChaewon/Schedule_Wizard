// 한국 대학교 시간표 관련 유틸리티 함수

import { CourseTime } from '@/lib/types/course';

// 한국어 요일을 숫자로 변환
export const KOREAN_DAYS: Record<string, number> = {
  '월': 1,
  '화': 2,
  '수': 3,
  '목': 4,
  '금': 5,
  '토': 6,
};

// 숫자를 한국어 요일로 변환
export const DAYS_KOREAN: Record<number, string> = {
  1: '월',
  2: '화',
  3: '수',
  4: '목',
  5: '금',
  6: '토',
};

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
export function parseKoreanDays(daysStr: string): number[] {
  return Array.from(daysStr)
    .map(day => KOREAN_DAYS[day])
    .filter(Boolean);
}

/**
 * 시간 문자열을 분 단위로 변환
 * @param timeStr - "09:00" 형태의 시간
 * @returns 분 단위 숫자
 */
export function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * 두 시간대가 겹치는지 확인
 * @param time1 - 첫 번째 시간대
 * @param time2 - 두 번째 시간대
 * @returns 겹치는지 여부
 */
export function isTimeOverlap(time1: CourseTime, time2: CourseTime): boolean {
  if (time1.dayOfWeek !== time2.dayOfWeek) {
    return false;
  }

  const start1 = parseTimeToMinutes(time1.startTime);
  const end1 = parseTimeToMinutes(time1.endTime);
  const start2 = parseTimeToMinutes(time2.startTime);
  const end2 = parseTimeToMinutes(time2.endTime);

  return start1 < end2 && start2 < end1;
}

/**
 * 시간대를 표시용 문자열로 포맷
 * @param courseTime - 시간 정보
 * @returns 표시용 문자열 (예: "월 09:00-10:50")
 */
export function formatCourseTime(courseTime: CourseTime): string {
  const day = DAYS_KOREAN[courseTime.dayOfWeek] || '?';
  return `${day} ${courseTime.startTime}-${courseTime.endTime}`;
}

/**
 * 여러 시간대를 하나의 문자열로 포맷
 * @param courseTimes - 시간 배열
 * @returns 포맷된 문자열 (예: "월수금 09:00-10:50")
 */
export function formatCourseTimes(courseTimes: CourseTime[]): string {
  if (courseTimes.length === 0) return '';
  
  // 같은 시간대끼리 그룹화
  const timeGroups = new Map<string, number[]>();
  
  courseTimes.forEach(time => {
    const timeKey = `${time.startTime}-${time.endTime}`;
    if (!timeGroups.has(timeKey)) {
      timeGroups.set(timeKey, []);
    }
    timeGroups.get(timeKey)!.push(time.dayOfWeek);
  });
  
  return Array.from(timeGroups.entries())
    .map(([timeRange, days]) => {
      const dayStr = days
        .sort()
        .map(day => DAYS_KOREAN[day])
        .join('');
      return `${dayStr} ${timeRange}`;
    })
    .join(', ');
}

/**
 * 교시를 시간으로 변환 (한국 대학교 표준)
 * @param period - 교시 (1~10)
 * @returns 시작/종료 시간
 */
export function getPeriodTime(period: number): { start: string; end: string } {
  const periods: Record<number, { start: string; end: string }> = {
    1: { start: '09:00', end: '09:50' },
    2: { start: '10:00', end: '10:50' },
    3: { start: '11:00', end: '11:50' },
    4: { start: '12:00', end: '12:50' },
    5: { start: '13:00', end: '13:50' },
    6: { start: '14:00', end: '14:50' },
    7: { start: '15:00', end: '15:50' },
    8: { start: '16:00', end: '16:50' },
    9: { start: '17:00', end: '17:50' },
    10: { start: '18:00', end: '18:50' },
  };
  
  return periods[period] || { start: '09:00', end: '09:50' };
}