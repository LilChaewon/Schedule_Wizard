'use client';

import { useState, useEffect } from 'react';
import { Course, CourseTime } from '@/lib/types/course';
import { loadCourseData, loadUserSchedule, saveUserSchedule } from '@/lib/utils/data-loader';
import { ScheduleCalendar } from '@/components/schedule/ScheduleCalendar';
import { CourseSearch } from '@/components/search/CourseSearch';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Download } from 'lucide-react';

export default function ScheduleWizardPage() {
  // 상태 관리
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [allCourseTimes, setAllCourseTimes] = useState<CourseTime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        const { courses, courseTimes } = await loadCourseData();
        setAllCourses(courses);
        setAllCourseTimes(courseTimes);
      } catch (error) {
        console.error('Failed to load course data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // 현재 시간표에 추가된 과목들
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  
  // 로컬 스토리지에서 저장된 시간표 로드
  useEffect(() => {
    const savedSchedule = loadUserSchedule();
    setSelectedCourseIds(savedSchedule);
  }, []);
  
  // 시간표 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    if (selectedCourseIds.length > 0) {
      saveUserSchedule(selectedCourseIds);
    }
  }, [selectedCourseIds]);
  
  // 선택된 과목들과 시간 정보
  const selectedCourses = allCourses.filter(course => 
    selectedCourseIds.includes(course.id)
  );
  const selectedCourseTimes = allCourseTimes.filter(time => 
    selectedCourseIds.includes(time.courseId)
  );
  
  // 과목 추가 핸들러
  const handleAddCourse = (course: Course) => {
    if (!selectedCourseIds.includes(course.id)) {
      setSelectedCourseIds(prev => [...prev, course.id]);
    }
  };
  
  // 과목 제거 핸들러
  const handleRemoveCourse = (course: Course) => {
    setSelectedCourseIds(prev => prev.filter(id => id !== course.id));
  };
  
  // 시간표 통계 계산
  const totalCredits = selectedCourses.reduce((sum, course) => sum + course.credits, 0);
  const totalCourses = selectedCourses.length;
  
  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">시간표 마법사</h2>
          <p className="text-gray-600">과목 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">시간표 마법사</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" className="hidden sm:flex items-center gap-2">
                <Download className="h-4 w-4" />
                내보내기
              </Button>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                새 시간표
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 시간표 영역 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 시간표 정보 */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">2025-2학기 시간표</h2>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>총 {totalCourses}과목</span>
                  <span>총 {totalCredits}학점</span>
                </div>
              </div>
              
              {/* 선택된 과목 목록 */}
              {selectedCourses.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">수강 과목</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCourses.map(course => (
                      <div
                        key={course.id}
                        className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        <span>{course.courseName}</span>
                        <button
                          onClick={() => handleRemoveCourse(course)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
            
            {/* 시간표 캘린더 */}
            <ScheduleCalendar
              courses={selectedCourses}
              courseTimes={selectedCourseTimes}
              onCourseClick={handleRemoveCourse}
            />
          </div>
          
          {/* 과목 검색 영역 */}
          <div className="space-y-6">
            <CourseSearch
              courses={allCourses}
              courseTimes={allCourseTimes}
              onCourseAdd={handleAddCourse}
            />
            
            {/* 시간표 통계 */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4">시간표 통계</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">수강 과목</span>
                  <span className="font-medium">{totalCourses}과목</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">총 학점</span>
                  <span className="font-medium">{totalCredits}학점</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">시간표 완성도</span>
                  <span className="font-medium">
                    {Math.min(100, Math.round((totalCredits / 21) * 100))}%
                  </span>
                </div>
              </div>
              
              {totalCredits > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>💡 권장 학점: 15-21학점</p>
                    {totalCredits < 12 && (
                      <p className="text-orange-600">⚠️ 학점이 부족합니다</p>
                    )}
                    {totalCredits > 21 && (
                      <p className="text-red-600">⚠️ 학점이 과다합니다</p>
                    )}
                  </div>
                </div>
              )}
            </Card>
            
            {/* 최근 추가된 과목 */}
            {selectedCourses.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3">최근 추가된 과목</h3>
                <div className="space-y-2">
                  {selectedCourses.slice(-3).map(course => (
                    <div key={course.id} className="text-sm">
                      <div className="font-medium">{course.courseName}</div>
                      <div className="text-gray-600">{course.professor}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
        
        {/* 빈 상태 메시지 */}
        {selectedCourses.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              시간표가 비어있습니다
            </h3>
            <p className="text-gray-600 mb-4">
              오른쪽 검색 패널에서 과목을 검색하고 추가해보세요.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}