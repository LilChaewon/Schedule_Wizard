'use client';

import { useState, useEffect } from 'react';
import { Course } from '@/lib/types/course';
import { loadCourseData } from '@/lib/utils/data-loader';

export default function TestPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const load = async () => {
      const { courses } = await loadCourseData();
      setCourses(courses);
      setLoading(false);
      console.log('Total courses loaded:', courses.length);
      console.log('First 10 courses:', courses.slice(0, 10));
    };
    load();
  }, []);

  const filteredCourses = courses.filter(course => 
    course.professor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.courseName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-8">Loading CSV data...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">CSV Test Page</h1>
      <p className="mb-4">Total courses loaded: {courses.length}</p>
      
      <input
        type="text"
        placeholder="Search by professor or course name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border p-2 mb-4 w-full max-w-md"
      />
      
      <p className="mb-4">Filtered results: {filteredCourses.length}</p>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredCourses.slice(0, 50).map((course) => (
          <div key={course.id} className="border p-2 rounded">
            <div className="font-semibold">{course.courseName}</div>
            <div className="text-gray-600">
              교수: {course.professor} | 
              학과: {course.department} | 
              학점: {course.credits} |
              분반: {course.sectionNumber}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8">
        <h2 className="text-lg font-semibold">Sample professors found:</h2>
        <div className="flex flex-wrap gap-2 mt-2">
          {Array.from(new Set(courses.map(c => c.professor)))
            .filter(p => p && p !== '미배정')
            .slice(0, 20)
            .map(prof => (
              <span key={prof} className="bg-gray-200 px-2 py-1 rounded text-sm">
                {prof}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}