# 프론트엔드 상세 요구사항 명세서

## 🎨 UI/UX 상세 요구사항

### 1. 컴포넌트 아키텍처

#### 1.1 페이지 구조
```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/
│   ├── page.tsx                 # 메인 대시보드
│   ├── search/page.tsx          # 과목 검색
│   ├── schedule/
│   │   ├── [id]/page.tsx        # 개별 시간표 뷰
│   │   └── compare/page.tsx     # 시간표 비교
│   └── profile/page.tsx         # 사용자 프로필
└── layout.tsx                   # 루트 레이아웃
```

#### 1.2 핵심 컴포넌트 상세 명세

##### ScheduleCalendar 컴포넌트
```typescript
interface ScheduleCalendarProps {
  scheduleId: string;
  courses: Course[];
  onCourseAdd: (course: Course, timeSlot: TimeSlot) => void;
  onCourseRemove: (courseId: string) => void;
  onCourseMove: (courseId: string, newTimeSlot: TimeSlot) => void;
  isReadOnly?: boolean;
  showConflicts?: boolean;
}

// 필수 기능
- 주간 그리드 뷰 (월~토, 9:00-21:00)
- 드래그 앤 드롭 지원
- 실시간 충돌 감지 시각화
- 과목별 색상 구분 (전공/교양/선택)
- 반응형 그리드 (모바일에서 세로 스크롤)
- 시간 오버레이 표시
- 강의실 정보 표시
```

##### CourseSearchPanel 컴포넌트
```typescript
interface CourseSearchPanelProps {
  onCourseSelect: (course: Course) => void;
  selectedScheduleId: string;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
}

// 필수 기능
- 실시간 검색 (300ms 디바운스)
- 고급 필터 패널 (접을 수 있는 형태)
- 무한 스크롤 또는 페이지네이션
- 검색 결과 하이라이팅
- 즐겨찾기 과목 표시
- 최근 검색어 저장
```

##### ScheduleGroupTabs 컴포넌트
```typescript
interface ScheduleGroupTabsProps {
  schedules: Schedule[];
  activeScheduleId: string;
  onScheduleChange: (scheduleId: string) => void;
  onScheduleCreate: () => void;
  onScheduleDelete: (scheduleId: string) => void;
  onScheduleRename: (scheduleId: string, newName: string) => void;
}

// 필수 기능
- 탭 기반 네비게이션 (최대 10개)
- 인라인 편집 (더블클릭으로 이름 변경)
- 드래그로 탭 순서 변경
- 새 탭 추가 버튼 (+)
- 탭 삭제 확인 모달
```

### 2. 상태 관리 상세 명세

#### 2.1 Zustand Store 구조
```typescript
// scheduleStore.ts
interface ScheduleStore {
  // State
  schedules: Schedule[];
  activeScheduleId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadSchedules: () => Promise<void>;
  createSchedule: (name: string) => Promise<string>;
  deleteSchedule: (id: string) => Promise<void>;
  updateSchedule: (id: string, updates: Partial<Schedule>) => Promise<void>;
  setActiveSchedule: (id: string) => void;
  
  // Course Actions
  addCourseToSchedule: (scheduleId: string, course: Course) => Promise<void>;
  removeCourseFromSchedule: (scheduleId: string, courseId: string) => Promise<void>;
  moveCourseInSchedule: (scheduleId: string, courseId: string, newTimeSlot: TimeSlot) => Promise<void>;
  
  // Conflict Detection
  detectConflicts: (scheduleId: string, newCourse?: Course) => ScheduleConflict[];
  
  // Validation
  validateSchedule: (scheduleId: string) => ValidationResult;
}

// searchStore.ts
interface SearchStore {
  // State
  searchQuery: string;
  filters: SearchFilters;
  results: Course[];
  isSearching: boolean;
  totalResults: number;
  currentPage: number;
  
  // Actions
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  searchCourses: () => Promise<void>;
  loadMoreResults: () => Promise<void>;
  clearSearch: () => void;
  
  // History
  searchHistory: string[];
  addToHistory: (query: string) => void;
  clearHistory: () => void;
}
```

#### 2.2 React Query 캐싱 전략
```typescript
// queries/courses.ts
export const useCourses = (filters: SearchFilters) => {
  return useQuery({
    queryKey: ['courses', filters],
    queryFn: () => searchCourses(filters),
    staleTime: 5 * 60 * 1000, // 5분
    cacheTime: 10 * 60 * 1000, // 10분
    keepPreviousData: true,
  });
};

export const useSchedule = (scheduleId: string) => {
  return useQuery({
    queryKey: ['schedule', scheduleId],
    queryFn: () => getSchedule(scheduleId),
    staleTime: 1 * 60 * 1000, // 1분
  });
};

// Mutations
export const useAddCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ scheduleId, course }: { scheduleId: string; course: Course }) =>
      addCourseToSchedule(scheduleId, course),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['schedule', variables.scheduleId]);
      queryClient.invalidateQueries(['schedules']);
    },
  });
};
```

### 3. 반응형 디자인 요구사항

#### 3.1 브레이크포인트 정의
```css
/* tailwind.config.js */
module.exports = {
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    }
  }
}
```

#### 3.2 레이아웃 변화
- **Desktop (lg+)**: 사이드바 + 메인 콘텐츠 레이아웃
- **Tablet (md-lg)**: 탭 기반 네비게이션, 컴팩트 사이드바
- **Mobile (xs-md)**: 풀스크린 모달, 바텀 시트, 햄버거 메뉴

#### 3.3 모바일 최적화
```typescript
// 모바일 전용 컴포넌트
const MobileScheduleView = () => {
  return (
    <div className="flex flex-col h-screen">
      <MobileHeader />
      <div className="flex-1 overflow-hidden">
        <Swiper
          spaceBetween={16}
          slidesPerView={1}
          onSlideChange={handleScheduleChange}
        >
          {schedules.map(schedule => (
            <SwiperSlide key={schedule.id}>
              <MobileCalendarGrid schedule={schedule} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      <MobileActionBar />
    </div>
  );
};
```

### 4. 애니메이션 및 인터랙션 요구사항

#### 4.1 Framer Motion 애니메이션
```typescript
// 페이지 전환 애니메이션
const pageVariants = {
  initial: { opacity: 0, x: -20 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: 20 }
};

// 과목 카드 애니메이션
const courseCardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
  hover: { scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }
};

// 드래그 애니메이션
const dragConstraints = {
  top: 0,
  left: 0,
  right: 0,
  bottom: 0
};
```

#### 4.2 필수 인터랙션
- **드래그 앤 드롭**: 검색 결과 → 시간표 캘린더
- **스와이프**: 모바일에서 시간표 그룹 간 전환
- **롱 프레스**: 모바일에서 과목 삭제/편집 메뉴
- **키보드 네비게이션**: Tab, Enter, Escape 키 지원

### 5. 성능 최적화 요구사항

#### 5.1 코드 스플리팅
```typescript
// 동적 import로 번들 크기 최적화
const ScheduleComparePage = lazy(() => import('./schedule/compare/page'));
const ProfileSettings = lazy(() => import('./profile/settings'));

// 컴포넌트 레벨 분할
const HeavyChart = lazy(() => import('./components/HeavyChart'));
```

#### 5.2 메모이제이션 전략
```typescript
// 복잡한 계산 결과 캐싱
const memoizedConflicts = useMemo(() => {
  return detectTimeConflicts(courses, newCourse);
}, [courses, newCourse]);

// 컴포넌트 렌더링 최적화
const CourseCard = memo(({ course, onSelect }: CourseCardProps) => {
  return (
    <div onClick={() => onSelect(course)}>
      {/* 카드 내용 */}
    </div>
  );
});

// 콜백 최적화
const handleCourseSelect = useCallback((course: Course) => {
  addCourseToSchedule(activeScheduleId, course);
}, [activeScheduleId, addCourseToSchedule]);
```

#### 5.3 가상화 (Virtualization)
```typescript
// 대량 과목 리스트 가상화
import { FixedSizeList as List } from 'react-window';

const CourseList = ({ courses }: { courses: Course[] }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <CourseCard course={courses[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={courses.length}
      itemSize={120}
      className="scrollbar-thin"
    >
      {Row}
    </List>
  );
};
```

### 6. 접근성 요구사항

#### 6.1 ARIA 레이블링
```typescript
// 시간표 그리드 접근성
<div
  role="grid"
  aria-label="주간 시간표"
  className="schedule-grid"
>
  <div role="row" aria-label="시간 헤더">
    <div role="columnheader" aria-label="시간">시간</div>
    <div role="columnheader" aria-label="월요일">월</div>
    {/* ... */}
  </div>
  {timeSlots.map(slot => (
    <div key={slot.id} role="row" aria-label={`${slot.time} 시간대`}>
      <div role="gridcell">{slot.time}</div>
      {slot.courses.map(course => (
        <div
          key={course.id}
          role="gridcell"
          aria-label={`${course.name} 강의, ${course.professor} 교수`}
          tabIndex={0}
        >
          <CourseBlock course={course} />
        </div>
      ))}
    </div>
  ))}
</div>
```

#### 6.2 키보드 네비게이션
- **Tab**: 포커스 이동
- **Enter/Space**: 버튼 활성화, 과목 선택
- **Escape**: 모달 닫기, 선택 취소
- **Arrow Keys**: 그리드 내 네비게이션
- **Delete**: 선택된 과목 삭제

### 7. 에러 처리 및 로딩 상태

#### 7.1 에러 바운더리
```typescript
class ScheduleErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Schedule error:', error, errorInfo);
    // 에러 리포팅 서비스로 전송
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>시간표를 불러오는 중 문제가 발생했습니다</h2>
          <button onClick={this.handleRetry}>다시 시도</button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

#### 7.2 로딩 상태 UI
```typescript
// 스켈레톤 UI
const ScheduleGridSkeleton = () => (
  <div className="animate-pulse">
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: 42 }).map((_, i) => (
        <div key={i} className="h-20 bg-gray-200 rounded" />
      ))}
    </div>
  </div>
);

// 검색 로딩 상태
const SearchResultsSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="h-24 bg-gray-200 rounded-lg" />
      </div>
    ))}
  </div>
);
```

### 8. 국제화 (i18n) 요구사항

#### 8.1 다국어 지원 구조
```typescript
// i18n 설정
const resources = {
  ko: {
    translation: {
      schedule: {
        title: '시간표',
        addCourse: '과목 추가',
        conflictDetected: '시간 충돌이 감지되었습니다',
        // ...
      }
    }
  },
  en: {
    translation: {
      schedule: {
        title: 'Schedule',
        addCourse: 'Add Course',
        conflictDetected: 'Time conflict detected',
        // ...
      }
    }
  }
};

// 사용 예시
const { t } = useTranslation();
<h1>{t('schedule.title')}</h1>
```

#### 8.2 날짜/시간 현지화
```typescript
// 한국어 요일 표시
const koreanDays = ['일', '월', '화', '수', '목', '금', '토'];
const englishDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// 시간 포맷 현지화
const formatTime = (time: string, locale: string) => {
  if (locale === 'ko') {
    return `${time}시`;
  }
  return time;
};
```

### 9. 테스트 요구사항

#### 9.1 단위 테스트 (Jest + React Testing Library)
```typescript
// ScheduleCalendar.test.tsx
describe('ScheduleCalendar', () => {
  test('시간 충돌 시각화', () => {
    const conflictingCourses = [
      { id: '1', name: '수학', time: '월09:00-10:50' },
      { id: '2', name: '물리', time: '월09:30-11:20' },
    ];
    
    render(<ScheduleCalendar courses={conflictingCourses} />);
    
    expect(screen.getByText('수학')).toHaveClass('conflict-highlight');
    expect(screen.getByText('물리')).toHaveClass('conflict-highlight');
  });

  test('드래그 앤 드롭 기능', () => {
    const handleCourseAdd = jest.fn();
    render(<ScheduleCalendar onCourseAdd={handleCourseAdd} />);
    
    const courseCard = screen.getByText('컴퓨터과학');
    const timeSlot = screen.getByLabelText('월요일 9시');
    
    fireEvent.dragStart(courseCard);
    fireEvent.drop(timeSlot);
    
    expect(handleCourseAdd).toHaveBeenCalled();
  });
});
```

#### 9.2 통합 테스트 (Playwright)
```typescript
// e2e/schedule.spec.ts
test('시간표 생성 및 과목 추가 플로우', async ({ page }) => {
  await page.goto('/dashboard');
  
  // 새 시간표 생성
  await page.click('[data-testid="create-schedule"]');
  await page.fill('[data-testid="schedule-name"]', '2025-2 시간표');
  await page.click('[data-testid="confirm-create"]');
  
  // 과목 검색 및 추가
  await page.goto('/search');
  await page.fill('[data-testid="search-input"]', '컴퓨터과학');
  await page.click('[data-testid="course-result"]:first-child [data-testid="add-course"]');
  
  // 시간표에서 확인
  await page.goto('/dashboard');
  await expect(page.locator('[data-testid="schedule-grid"]')).toContainText('컴퓨터과학');
});
```

### 10. 빌드 및 배포 요구사항

#### 10.1 Next.js 설정 최적화
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    formats: ['image/webp'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      };
    }
    return config;
  },
};

module.exports = nextConfig;
```

#### 10.2 환경별 설정
```bash
# .env.local (개발환경)
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://user:pass@localhost:5432/schedule_dev

# .env.production (프로덕션)
NEXT_PUBLIC_API_URL=https://api.schedule-wizard.com
NEXT_PUBLIC_APP_URL=https://schedule-wizard.com
DATABASE_URL=$DATABASE_URL
```

이 문서는 프론트엔드 개발 시 참조해야 할 모든 기술적 요구사항과 구현 세부사항을 포함합니다.