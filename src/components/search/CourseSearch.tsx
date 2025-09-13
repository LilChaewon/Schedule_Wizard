'use client';

import { useState } from 'react';
import { Course, CourseTime, SearchFilters } from '@/lib/types/course';
import { formatCourseTimes } from '@/lib/utils/time';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourseSearchProps {
  courses: Course[];
  courseTimes: CourseTime[];
  onCourseAdd?: (course: Course) => void;
  className?: string;
}

export function CourseSearch({ 
  courses, 
  courseTimes, 
  onCourseAdd, 
  className 
}: CourseSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  
  // 검색 및 필터링 로직
  const filteredCourses = filterCourses(courses, courseTimes, searchQuery, filters);
  
  // 필터 옵션 추출
  const filterOptions = extractFilterOptions(courses);
  
  return (
    <Card className={cn('p-4', className)}>
      <div className="space-y-4">
        {/* 검색 헤더 */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="과목명, 교수명, 과목코드로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            필터
          </Button>
        </div>
        
        {/* 고급 필터 패널 */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium mb-1">학과</label>
              <Select onValueChange={(value) => 
                setFilters(prev => ({ ...prev, department: value ? [value] : undefined }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">전체</SelectItem>
                  {filterOptions.departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">학년</label>
              <Select onValueChange={(value) => 
                setFilters(prev => ({ ...prev, gradeLevel: value ? [parseInt(value)] : undefined }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">전체</SelectItem>
                  <SelectItem value="0">전학년</SelectItem>
                  <SelectItem value="1">1학년</SelectItem>
                  <SelectItem value="2">2학년</SelectItem>
                  <SelectItem value="3">3학년</SelectItem>
                  <SelectItem value="4">4학년</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">학점</label>
              <Select onValueChange={(value) => 
                setFilters(prev => ({ ...prev, credits: value ? [parseInt(value)] : undefined }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">전체</SelectItem>
                  <SelectItem value="1">1학점</SelectItem>
                  <SelectItem value="2">2학점</SelectItem>
                  <SelectItem value="3">3학점</SelectItem>
                  <SelectItem value="4">4학점</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">시간대</label>
              <Select onValueChange={(value) => 
                setFilters(prev => ({ ...prev, timeSlots: value ? [value] : undefined }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">전체</SelectItem>
                  <SelectItem value="09:00-10:50">1-2교시 (09:00-10:50)</SelectItem>
                  <SelectItem value="11:00-12:50">3-4교시 (11:00-12:50)</SelectItem>
                  <SelectItem value="13:00-14:50">5-6교시 (13:00-14:50)</SelectItem>
                  <SelectItem value="15:00-16:50">7-8교시 (15:00-16:50)</SelectItem>
                  <SelectItem value="17:00-18:50">9-10교시 (17:00-18:50)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        
        {/* 검색 결과 */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          <div className="text-sm text-gray-600">
            총 {filteredCourses.length}개 과목
          </div>
          
          {filteredCourses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              검색 결과가 없습니다.
            </div>
          ) : (
            filteredCourses.map((result) => (
              <CourseCard
                key={result.course.id}
                course={result.course}
                courseTimes={result.timeslots}
                onAdd={() => onCourseAdd?.(result.course)}
              />
            ))
          )}
        </div>
      </div>
    </Card>
  );
}

interface CourseCardProps {
  course: Course;
  courseTimes: CourseTime[];
  onAdd?: () => void;
}

function CourseCard({ course, courseTimes, onAdd }: CourseCardProps) {
  return (
    <Card className="p-3 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium truncate">{course.courseName}</h3>
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
              {course.credits}학점
            </span>
          </div>
          
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-center gap-4">
              <span>
                <span className="font-medium">교수:</span> {course.professor}
              </span>
              <span>
                <span className="font-medium">분반:</span> {course.sectionNumber}
              </span>
            </div>
            
            <div>
              <span className="font-medium">시간:</span> {formatCourseTimes(courseTimes)}
            </div>
            
            <div>
              <span className="font-medium">정원:</span> {course.maxStudents}명
            </div>
            
            {course.notes && (
              <div className="text-xs text-gray-500">{course.notes}</div>
            )}
          </div>
        </div>
        
        <Button
          size="sm"
          onClick={onAdd}
          className="ml-4 flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          추가
        </Button>
      </div>
    </Card>
  );
}

// 검색 및 필터링 함수
function filterCourses(
  courses: Course[],
  courseTimes: CourseTime[],
  searchQuery: string,
  filters: SearchFilters
) {
  const results = courses
    .filter(course => {
      // 텍스트 검색
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesQuery = 
          course.courseName.toLowerCase().includes(query) ||
          course.professor.toLowerCase().includes(query) ||
          course.courseCode.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }
      
      // 학과 필터
      if (filters.department?.length && !filters.department.includes(course.department)) {
        return false;
      }
      
      // 학년 필터
      if (filters.gradeLevel?.length && !filters.gradeLevel.includes(course.gradeLevel)) {
        return false;
      }
      
      // 학점 필터
      if (filters.credits?.length && !filters.credits.includes(course.credits)) {
        return false;
      }
      
      return true;
    })
    .map(course => ({
      course,
      timeslots: courseTimes.filter(ct => ct.courseId === course.id),
    }));
  
  return results;
}

// 필터 옵션 추출
function extractFilterOptions(courses: Course[]) {
  const departments = Array.from(new Set(courses.map(c => c.department))).sort();
  const gradelevels = Array.from(new Set(courses.map(c => c.gradeLevel))).sort();
  const credits = Array.from(new Set(courses.map(c => c.credits))).sort();
  
  return { departments, gradelevels, credits };
}