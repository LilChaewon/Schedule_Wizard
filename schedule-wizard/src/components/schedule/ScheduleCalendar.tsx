'use client';

import { Course, CourseTime } from '@/lib/types/course';
import { formatCourseTime, DAYS_KOREAN } from '@/lib/utils/time';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ScheduleCalendarProps {
  courses: Course[];
  courseTimes: CourseTime[];
  onCourseClick?: (course: Course) => void;
  className?: string;
}

const TIME_SLOTS = [
  { period: 1, start: '09:00', end: '09:50' },
  { period: 2, start: '10:00', end: '10:50' },
  { period: 3, start: '11:00', end: '11:50' },
  { period: 4, start: '12:00', end: '12:50' },
  { period: 5, start: '13:00', end: '13:50' },
  { period: 6, start: '14:00', end: '14:50' },
  { period: 7, start: '15:00', end: '15:50' },
  { period: 8, start: '16:00', end: '16:50' },
  { period: 9, start: '17:00', end: '17:50' },
  { period: 10, start: '18:00', end: '18:50' },
];

const DAYS = [1, 2, 3, 4, 5, 6]; // 월~토

export function ScheduleCalendar({ 
  courses, 
  courseTimes, 
  onCourseClick, 
  className 
}: ScheduleCalendarProps) {
  // 시간대별로 과목 매핑
  const scheduleGrid = createScheduleGrid(courses, courseTimes);
  
  return (
    <Card className={cn('p-4 overflow-auto', className)}>
      <div className="min-w-[800px]">
        {/* 헤더 */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          <div className="p-3 text-center font-semibold bg-gray-50 rounded">
            시간
          </div>
          {DAYS.map((day) => (
            <div 
              key={day}
              className="p-3 text-center font-semibold bg-gray-50 rounded"
            >
              {DAYS_KOREAN[day]}
            </div>
          ))}
        </div>
        
        {/* 시간표 그리드 */}
        {TIME_SLOTS.map((timeSlot) => (
          <div key={timeSlot.period} className="grid grid-cols-7 gap-1 mb-1">
            {/* 시간 표시 */}
            <div className="p-2 text-center text-sm bg-gray-50 rounded flex flex-col justify-center">
              <div className="font-medium">{timeSlot.period}교시</div>
              <div className="text-xs text-gray-600">
                {timeSlot.start}-{timeSlot.end}
              </div>
            </div>
            
            {/* 각 요일의 과목 */}
            {DAYS.map((day) => {
              const courseInSlot = scheduleGrid[day]?.[timeSlot.period];
              
              return (
                <div
                  key={`${day}-${timeSlot.period}`}
                  className="min-h-[60px] p-1 border rounded hover:bg-gray-50"
                >
                  {courseInSlot && (
                    <CourseBlock
                      course={courseInSlot.course}
                      courseTime={courseInSlot.time}
                      onClick={() => onCourseClick?.(courseInSlot.course)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </Card>
  );
}

interface CourseBlockProps {
  course: Course;
  courseTime: CourseTime;
  onClick?: () => void;
}

function CourseBlock({ course, courseTime, onClick }: CourseBlockProps) {
  const bgColor = getCourseColor(course.department);
  
  return (
    <div
      className={cn(
        'w-full h-full p-2 rounded cursor-pointer transition-all hover:opacity-80',
        bgColor,
        'text-white text-xs'
      )}
      onClick={onClick}
      title={`${course.courseName}\n${course.professor}\n${formatCourseTime(courseTime)}`}
    >
      <div className="font-medium truncate">{course.courseName}</div>
      <div className="truncate opacity-90">{course.professor}</div>
      {courseTime.room && (
        <div className="truncate opacity-80 text-[10px]">{courseTime.room}</div>
      )}
    </div>
  );
}

// 시간표 그리드 생성 함수
function createScheduleGrid(courses: Course[], courseTimes: CourseTime[]) {
  const grid: Record<number, Record<number, { course: Course; time: CourseTime }>> = {};
  
  // 각 요일별로 초기화
  DAYS.forEach(day => {
    grid[day] = {};
  });
  
  courseTimes.forEach(courseTime => {
    const course = courses.find(c => c.id === courseTime.courseId);
    if (!course) return;
    
    const period = getTimeSlotPeriod(courseTime.startTime);
    if (period && period <= 10) {
      grid[courseTime.dayOfWeek][period] = { course, time: courseTime };
    }
  });
  
  return grid;
}

// 시작 시간을 교시로 변환
function getTimeSlotPeriod(startTime: string): number | null {
  const timeSlot = TIME_SLOTS.find(slot => slot.start === startTime);
  return timeSlot?.period || null;
}

// 학과별 색상 매핑
function getCourseColor(department: string): string {
  const colorMap: Record<string, string> = {
    '컴퓨터과학과': 'bg-blue-500',
    '수학과': 'bg-green-500',
    '물리학과': 'bg-purple-500',
    '화학과': 'bg-red-500',
    '생물학과': 'bg-emerald-500',
    '영어영문학과': 'bg-pink-500',
    '국어국문학과': 'bg-indigo-500',
    '경제학과': 'bg-orange-500',
    '경영학과': 'bg-teal-500',
    '교양필수': 'bg-gray-500',
    '교양선택': 'bg-slate-500',
    '전공선택': 'bg-cyan-500',
    '전공필수': 'bg-violet-500',
  };
  
  return colorMap[department] || 'bg-gray-400';
}