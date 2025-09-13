// 과목 관련 타입 정의

export interface Course {
  id: string;
  courseCode: string;    // 과목 코드 (예: CS101, 교필127)
  courseName: string;    // 과목명
  professor: string;     // 교수명
  credits: number;       // 학점
  department: string;    // 학과
  gradeLevel: number;    // 학년 (0: 전학년)
  maxStudents: number;   // 수강 정원
  currentStudents?: number; // 현재 신청 인원
  semester: string;      // 학기 (2025-1, 2025-2)
  year: number;         // 연도
  sectionNumber: string; // 분반 (0001, 0002 등)
  room?: string;        // 강의실
  notes?: string;       // 비고
}

export interface CourseTime {
  id: string;
  courseId: string;
  dayOfWeek: number;    // 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
  startTime: string;    // "09:00"
  endTime: string;      // "10:50"
  room?: string;        // 강의실 (Y2508 등)
}

export interface Schedule {
  id: string;
  name: string;
  semester: string;
  year: number;
  isActive: boolean;
  courses: Course[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleConflict {
  type: 'TIME_OVERLAP' | 'DUPLICATE_COURSE' | 'ROOM_CONFLICT';
  severity: 'ERROR' | 'WARNING' | 'INFO';
  conflictingCourses: Course[];
  timeSlot?: CourseTime;
  message: string;
}

export interface SearchFilters {
  department?: string[];
  gradeLevel?: number[];
  credits?: number[];
  timeSlots?: string[];
  days?: number[];
  professor?: string;
}

export interface SearchResult {
  course: Course;
  timeslots: CourseTime[];
  relevanceScore?: number;
}