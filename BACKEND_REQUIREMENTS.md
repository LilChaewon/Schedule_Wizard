# 백엔드 상세 요구사항 명세서

## 🏗️ 백엔드 아키텍처 요구사항

### 1. API 설계 및 엔드포인트

#### 1.1 RESTful API 구조
```
/api/v1/
├── auth/                    # 인증 관련
├── courses/                 # 과목 관리
├── schedules/              # 시간표 관리
├── users/                  # 사용자 관리
├── search/                 # 검색 기능
├── conflicts/              # 충돌 감지
└── exports/                # 내보내기
```

#### 1.2 상세 API 엔드포인트

##### 인증 API
```typescript
// POST /api/v1/auth/login
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// POST /api/v1/auth/refresh
interface RefreshRequest {
  refreshToken: string;
}

// POST /api/v1/auth/logout
interface LogoutRequest {
  refreshToken: string;
}

// POST /api/v1/auth/register
interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  studentId?: string;
  department?: string;
  grade?: number;
}
```

##### 과목 API
```typescript
// GET /api/v1/courses
interface CoursesQuery {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  grade?: number;
  semester: string;
  year: number;
  professor?: string;
  credits?: number;
  timeSlots?: string[]; // ['월09:00-10:50', '화11:00-12:50']
}

interface CoursesResponse {
  courses: Course[];
  total: number;
  page: number;
  totalPages: number;
}

// GET /api/v1/courses/:courseId
interface CourseDetailResponse {
  course: CourseDetail;
  reviews: CourseReview[];
  sections: CourseSection[];
  statistics: {
    averageRating: number;
    totalReviews: number;
    enrollmentHistory: EnrollmentData[];
  };
}

// GET /api/v1/courses/:courseId/sections
interface CourseSectionsResponse {
  sections: CourseSection[];
}

// GET /api/v1/courses/:courseId/reviews
interface CourseReviewsResponse {
  reviews: CourseReview[];
  summary: {
    averageRating: number;
    ratingDistribution: Record<string, number>;
    totalReviews: number;
  };
}
```

##### 시간표 API
```typescript
// GET /api/v1/schedules
interface SchedulesResponse {
  schedules: Schedule[];
  total: number;
}

// POST /api/v1/schedules
interface CreateScheduleRequest {
  name: string;
  semester: string;
  year: number;
  isTemplate?: boolean;
}

interface CreateScheduleResponse {
  schedule: Schedule;
}

// GET /api/v1/schedules/:scheduleId
interface ScheduleDetailResponse {
  schedule: ScheduleDetail;
  courses: CourseInSchedule[];
  conflicts: ScheduleConflict[];
  statistics: ScheduleStatistics;
}

// PUT /api/v1/schedules/:scheduleId
interface UpdateScheduleRequest {
  name?: string;
  isActive?: boolean;
  settings?: ScheduleSettings;
}

// DELETE /api/v1/schedules/:scheduleId
// 빈 응답 (204 No Content)

// POST /api/v1/schedules/:scheduleId/courses
interface AddCourseRequest {
  courseId: string;
  sectionId?: string;
  customTimeSlots?: TimeSlot[]; // 커스텀 시간 설정
}

interface AddCourseResponse {
  success: boolean;
  conflicts?: ScheduleConflict[];
  schedule: ScheduleDetail;
}

// DELETE /api/v1/schedules/:scheduleId/courses/:courseId
interface RemoveCourseResponse {
  success: boolean;
  schedule: ScheduleDetail;
}

// PUT /api/v1/schedules/:scheduleId/courses/:courseId
interface UpdateCourseInScheduleRequest {
  sectionId?: string;
  customTimeSlots?: TimeSlot[];
  notes?: string;
}
```

##### 충돌 감지 API
```typescript
// POST /api/v1/conflicts/detect
interface ConflictDetectionRequest {
  scheduleId: string;
  newCourseId?: string;
  timeSlots?: TimeSlot[];
}

interface ConflictDetectionResponse {
  conflicts: ScheduleConflict[];
  suggestions: ConflictSuggestion[];
  canProceed: boolean;
}

interface ScheduleConflict {
  type: 'TIME_OVERLAP' | 'DUPLICATE_COURSE' | 'ROOM_CONFLICT' | 'PROFESSOR_CONFLICT';
  severity: 'ERROR' | 'WARNING' | 'INFO';
  conflictingCourses: string[]; // Course IDs
  timeSlot: TimeSlot;
  message: string;
  suggestions?: string[];
}

interface ConflictSuggestion {
  type: 'ALTERNATIVE_SECTION' | 'TIME_ADJUSTMENT' | 'COURSE_REPLACEMENT';
  description: string;
  courseId?: string;
  sectionId?: string;
  newTimeSlot?: TimeSlot;
}
```

##### 검색 API
```typescript
// GET /api/v1/search/courses
interface CourseSearchQuery {
  q: string;                    // 검색어
  filters: {
    department?: string[];
    professor?: string[];
    grade?: number[];
    credits?: number[];
    timeSlots?: string[];       // ['09:00-10:50', '11:00-12:50']
    days?: string[];            // ['월', '화', '수', '목', '금', '토']
    semester: string;
    year: number;
  };
  sort?: {
    field: 'name' | 'professor' | 'credits' | 'rating' | 'enrollment';
    order: 'asc' | 'desc';
  };
  page?: number;
  limit?: number;
}

interface CourseSearchResponse {
  results: SearchResult[];
  facets: {
    departments: FacetCount[];
    professors: FacetCount[];
    credits: FacetCount[];
    timeSlots: FacetCount[];
  };
  total: number;
  page: number;
  totalPages: number;
  searchTime: number; // ms
}

interface SearchResult {
  course: Course;
  highlights: {
    name?: string;
    professor?: string;
    description?: string;
  };
  relevanceScore: number;
}

// GET /api/v1/search/suggestions
interface SearchSuggestionsQuery {
  q: string;
  type?: 'course' | 'professor' | 'department';
  limit?: number;
}

interface SearchSuggestionsResponse {
  suggestions: string[];
}
```

##### 내보내기 API
```typescript
// POST /api/v1/exports/schedule
interface ExportScheduleRequest {
  scheduleId: string;
  format: 'png' | 'pdf' | 'excel' | 'ical' | 'json';
  options: {
    includeDetails?: boolean;
    theme?: 'light' | 'dark' | 'auto';
    language?: 'ko' | 'en';
    paperSize?: 'A4' | 'letter';
    orientation?: 'portrait' | 'landscape';
  };
}

interface ExportScheduleResponse {
  downloadUrl: string;
  expiresAt: string;
  fileSize: number;
  format: string;
}

// GET /api/v1/exports/:exportId/download
// 파일 스트림 반환
```

### 2. 데이터베이스 설계

#### 2.1 Prisma Schema 정의
```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String
  studentId   String?  @unique
  department  String?
  grade       Int?
  
  // 인증 관련
  hashedPassword String
  emailVerified  DateTime?
  
  // 설정
  preferences Json     @default("{}")
  timezone    String   @default("Asia/Seoul")
  language    String   @default("ko")
  
  // 관계
  schedules      Schedule[]
  courseReviews  CourseReview[]
  searchHistory  SearchHistory[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

model Course {
  id            String   @id @default(cuid())
  courseCode    String   // 과목 코드 (CS101)
  courseName    String   // 과목명
  professor     String
  credits       Int
  department    String
  gradeLevel    Int      // 학년
  maxStudents   Int
  currentStudents Int    @default(0)
  semester      String   // "2025-1", "2025-2"
  year          Int
  
  // 상세 정보
  description   String?
  prerequisites String[] @default([])
  objectives    String?
  textbooks     String?
  evaluationMethod String?
  
  // 검색 최적화
  searchVector  Unsupported("tsvector")?
  
  // 관계
  courseTimes   CourseTime[]
  schedules     ScheduleCourse[]
  reviews       CourseReview[]
  sections      CourseSection[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([courseCode, professor, semester, year])
  @@index([semester, year])
  @@index([department, gradeLevel])
  @@map("courses")
}

model CourseSection {
  id        String @id @default(cuid())
  courseId  String
  sectionNumber String // "01", "02", "03"
  professor String
  maxStudents Int
  currentStudents Int @default(0)
  room      String?
  
  // 관계
  course    Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
  courseTimes CourseTime[]
  schedules   ScheduleCourse[]
  
  @@unique([courseId, sectionNumber])
  @@map("course_sections")
}

model CourseTime {
  id        String @id @default(cuid())
  courseId  String?
  sectionId String?
  
  dayOfWeek Int      // 1=월, 2=화, ..., 6=토
  startTime String   // "09:00"
  endTime   String   // "10:50"
  room      String?
  
  // 관계 (둘 중 하나만 존재)
  course    Course?        @relation(fields: [courseId], references: [id], onDelete: Cascade)
  section   CourseSection? @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  
  @@index([courseId, dayOfWeek, startTime])
  @@index([sectionId, dayOfWeek, startTime])
  @@map("course_times")
}

model Schedule {
  id        String  @id @default(cuid())
  userId    String
  name      String
  semester  String
  year      Int
  isActive  Boolean @default(false)
  isTemplate Boolean @default(false)
  
  // 설정
  settings  Json    @default("{}")
  
  // 통계 (캐시된 값)
  totalCredits    Int @default(0)
  totalHours      Int @default(0)
  conflictCount   Int @default(0)
  
  // 관계
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  courses   ScheduleCourse[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId, semester, year])
  @@map("schedules")
}

model ScheduleCourse {
  id          String @id @default(cuid())
  scheduleId  String
  courseId    String
  sectionId   String?
  
  // 커스텀 설정
  customTimeSlots Json?    // 사용자가 시간을 직접 조정한 경우
  notes          String?
  color          String?   // 시간표에서 표시할 색상
  
  // 관계
  schedule    Schedule       @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  course      Course         @relation(fields: [courseId], references: [id], onDelete: Cascade)
  section     CourseSection? @relation(fields: [sectionId], references: [id])
  
  addedAt DateTime @default(now())

  @@unique([scheduleId, courseId])
  @@map("schedule_courses")
}

model CourseReview {
  id        String @id @default(cuid())
  courseId  String
  userId    String
  
  rating    Int      // 1-5 별점
  difficulty Int     // 1-5 난이도
  workload   Int     // 1-5 과제량
  attendance Boolean // 출석 체크 여부
  
  comment   String?
  pros      String[] @default([]) // 장점들
  cons      String[] @default([]) // 단점들
  tags      String[] @default([]) // 태그들
  
  // 추천 여부
  wouldRecommend Boolean
  
  // 수강 정보
  semester  String
  year      Int
  grade     String? // 받은 성적 (선택적)
  
  // 관계
  course    Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
  user      User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([courseId, userId, semester, year])
  @@index([courseId, rating])
  @@map("course_reviews")
}

model SearchHistory {
  id        String @id @default(cuid())
  userId    String
  query     String
  filters   Json   @default("{}")
  resultCount Int
  clickedCourseId String?
  
  // 관계
  user      User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  searchedAt DateTime @default(now())

  @@index([userId, searchedAt])
  @@map("search_history")
}

model ExportJob {
  id        String @id @default(cuid())
  userId    String
  scheduleId String
  format    String
  options   Json
  status    String // 'pending', 'processing', 'completed', 'failed'
  fileUrl   String?
  errorMessage String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  expiresAt DateTime

  @@index([userId, status])
  @@map("export_jobs")
}
```

#### 2.2 인덱스 최적화 전략
```sql
-- 검색 성능 최적화
CREATE INDEX CONCURRENTLY idx_courses_search 
ON courses USING GIN (search_vector);

-- 복합 인덱스
CREATE INDEX CONCURRENTLY idx_courses_dept_grade_semester 
ON courses (department, grade_level, semester, year);

-- 시간 검색 최적화
CREATE INDEX CONCURRENTLY idx_course_times_day_time 
ON course_times (day_of_week, start_time, end_time);

-- 파티셔닝 (학기별)
CREATE TABLE courses_2025_1 PARTITION OF courses 
FOR VALUES IN ('2025-1');

CREATE TABLE courses_2025_2 PARTITION OF courses 
FOR VALUES IN ('2025-2');
```

### 3. 비즈니스 로직 구현

#### 3.1 시간 충돌 감지 알고리즘
```typescript
// services/conflictDetection.ts
interface TimeSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
}

interface ConflictDetectionResult {
  hasConflict: boolean;
  conflicts: ScheduleConflict[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

class ConflictDetectionService {
  /**
   * 시간 충돌 감지 메인 로직
   */
  async detectConflicts(
    scheduleId: string,
    newCourse?: Course,
    newTimeSlots?: TimeSlot[]
  ): Promise<ConflictDetectionResult> {
    const existingCourses = await this.getScheduleCourses(scheduleId);
    const allTimeSlots = await this.getAllTimeSlots(existingCourses);
    
    if (newCourse) {
      const newCourseSlots = await this.getCourseTimeSlots(newCourse.id);
      return this.checkTimeConflicts(allTimeSlots, newCourseSlots);
    }
    
    if (newTimeSlots) {
      return this.checkTimeConflicts(allTimeSlots, newTimeSlots);
    }
    
    // 기존 시간표 내 충돌 검사
    return this.checkInternalConflicts(allTimeSlots);
  }

  /**
   * 두 시간대가 겹치는지 확인
   */
  private isTimeOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
    if (slot1.dayOfWeek !== slot2.dayOfWeek) {
      return false;
    }

    const start1 = this.parseTime(slot1.startTime);
    const end1 = this.parseTime(slot1.endTime);
    const start2 = this.parseTime(slot2.startTime);
    const end2 = this.parseTime(slot2.endTime);

    return start1 < end2 && start2 < end1;
  }

  /**
   * 시간 문자열을 분 단위로 변환
   */
  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * 충돌 심각도 계산
   */
  private calculateSeverity(conflicts: ScheduleConflict[]): 'LOW' | 'MEDIUM' | 'HIGH' {
    const errorCount = conflicts.filter(c => c.severity === 'ERROR').length;
    const warningCount = conflicts.filter(c => c.severity === 'WARNING').length;

    if (errorCount > 0) return 'HIGH';
    if (warningCount > 2) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * 대안 제안 생성
   */
  async generateSuggestions(
    conflicts: ScheduleConflict[]
  ): Promise<ConflictSuggestion[]> {
    const suggestions: ConflictSuggestion[] = [];

    for (const conflict of conflicts) {
      if (conflict.type === 'TIME_OVERLAP') {
        // 다른 분반 찾기
        const alternatives = await this.findAlternativeSections(
          conflict.conflictingCourses[0]
        );
        
        suggestions.push(...alternatives.map(alt => ({
          type: 'ALTERNATIVE_SECTION',
          description: `${alt.professor} 교수 분반으로 변경 (${alt.timeSlots.join(', ')})`,
          courseId: conflict.conflictingCourses[0],
          sectionId: alt.id
        })));
      }
    }

    return suggestions;
  }
}
```

#### 3.2 검색 서비스 구현
```typescript
// services/searchService.ts
class SearchService {
  /**
   * 통합 과목 검색
   */
  async searchCourses(query: CourseSearchQuery): Promise<CourseSearchResponse> {
    const searchBuilder = new SearchQueryBuilder()
      .setQuery(query.q)
      .setFilters(query.filters)
      .setSort(query.sort)
      .setPagination(query.page, query.limit);

    // 전문 검색 (PostgreSQL Full Text Search)
    if (query.q) {
      searchBuilder.addFullTextSearch(query.q);
    }

    const results = await this.executeSearch(searchBuilder.build());
    const facets = await this.calculateFacets(query.filters);

    return {
      results: results.map(this.formatSearchResult),
      facets,
      total: results.length,
      page: query.page || 1,
      totalPages: Math.ceil(results.length / (query.limit || 20)),
      searchTime: Date.now() - searchBuilder.startTime
    };
  }

  /**
   * 자동완성 제안
   */
  async getSuggestions(query: SearchSuggestionsQuery): Promise<string[]> {
    const suggestions = await prisma.$queryRaw`
      SELECT DISTINCT name
      FROM courses
      WHERE name ILIKE ${`%${query.q}%`}
      ORDER BY 
        CASE WHEN name ILIKE ${`${query.q}%`} THEN 1 ELSE 2 END,
        char_length(name)
      LIMIT ${query.limit || 10}
    `;

    return suggestions.map((s: any) => s.name);
  }

  /**
   * 검색 기록 저장
   */
  async saveSearchHistory(
    userId: string,
    query: string,
    filters: any,
    resultCount: number,
    clickedCourseId?: string
  ): Promise<void> {
    await prisma.searchHistory.create({
      data: {
        userId,
        query,
        filters,
        resultCount,
        clickedCourseId
      }
    });

    // 검색 기록은 최대 100개까지만 유지
    await this.cleanupSearchHistory(userId);
  }

  /**
   * 인기 검색어 조회
   */
  async getPopularSearches(limit = 10): Promise<string[]> {
    const results = await prisma.searchHistory.groupBy({
      by: ['query'],
      _count: {
        query: true
      },
      orderBy: {
        _count: {
          query: 'desc'
        }
      },
      take: limit,
      where: {
        searchedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 최근 7일
        }
      }
    });

    return results.map(r => r.query);
  }
}
```

#### 3.3 CSV 데이터 파싱 서비스
```typescript
// services/dataImportService.ts
class DataImportService {
  /**
   * 한국 대학교 시간표 CSV 파싱
   */
  async importCoursesFromCSV(filePath: string, semester: string, year: number): Promise<void> {
    const csvData = await this.readCSVFile(filePath);
    const courses = await this.parseKoreanScheduleCSV(csvData, semester, year);
    
    // 배치 처리로 대량 데이터 삽입
    await this.batchInsertCourses(courses);
    
    // 검색 인덱스 업데이트
    await this.updateSearchIndex();
  }

  /**
   * 한국 시간표 형식 파싱 ("월09:00-10:50 (Y2508)")
   */
  private parseKoreanTimeFormat(timeStr: string): CourseTime[] {
    const regex = /([월화수목금토]+)(\d{2}):(\d{2})-(\d{2}):(\d{2})\s*\(([^)]+)\)/;
    const match = timeStr.match(regex);
    
    if (!match) {
      throw new Error(`Invalid time format: ${timeStr}`);
    }

    const [, daysStr, startHour, startMin, endHour, endMin, room] = match;
    const days = this.parseKoreanDays(daysStr);
    
    return days.map(dayOfWeek => ({
      dayOfWeek,
      startTime: `${startHour}:${startMin}`,
      endTime: `${endHour}:${endMin}`,
      room: room.trim()
    }));
  }

  /**
   * 한국어 요일을 숫자로 변환
   */
  private parseKoreanDays(daysStr: string): number[] {
    const dayMap: Record<string, number> = {
      '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6
    };

    return Array.from(daysStr).map(day => dayMap[day]).filter(Boolean);
  }

  /**
   * CSV 데이터를 Course 객체로 변환
   */
  private async parseKoreanScheduleCSV(
    csvData: string[][],
    semester: string,
    year: number
  ): Promise<CreateCourseData[]> {
    const courses: CreateCourseData[] = [];

    for (let i = 8; i < csvData.length; i++) { // 헤더 스킵
      const row = csvData[i];
      if (!row || row.length < 12) continue;

      const [
        gradeLevel,
        courseName,
        courseCode,
        ,, // 빈 컬럼들
        credits,
        hours,
        professor,
        ,
        sectionNumber,
        maxStudents,
        timeAndRoom,
        ,,,,
        notes
      ] = row;

      if (!courseName || !professor || !timeAndRoom) continue;

      try {
        const courseTimes = this.parseKoreanTimeFormat(timeAndRoom);
        
        courses.push({
          courseCode: courseCode.trim(),
          courseName: courseName.trim(),
          professor: professor.trim(),
          credits: parseInt(credits) || 0,
          department: this.inferDepartment(courseCode),
          gradeLevel: this.parseGradeLevel(gradeLevel),
          maxStudents: parseInt(maxStudents) || 0,
          semester,
          year,
          sections: [{
            sectionNumber: sectionNumber?.trim() || '01',
            professor: professor.trim(),
            maxStudents: parseInt(maxStudents) || 0,
            courseTimes
          }]
        });
      } catch (error) {
        console.warn(`Failed to parse course: ${courseName}`, error);
      }
    }

    return courses;
  }

  /**
   * 과목 코드에서 학과 추정
   */
  private inferDepartment(courseCode: string): string {
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
      '교선': '교양선택'
    };

    const prefix = courseCode.replace(/\d+/g, '');
    return prefixMap[prefix] || '기타';
  }

  /**
   * 학년 정보 파싱
   */
  private parseGradeLevel(gradeStr: string): number {
    if (!gradeStr || gradeStr === '전학년') return 0;
    
    const match = gradeStr.match(/(\d+)학년/);
    return match ? parseInt(match[1]) : 0;
  }
}
```

### 4. 인증 및 보안

#### 4.1 JWT 인증 구현
```typescript
// services/authService.ts
class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET!;
  private readonly JWT_EXPIRES_IN = '1h';
  private readonly REFRESH_TOKEN_EXPIRES_IN = '7d';

  /**
   * 로그인 처리
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !await bcrypt.compare(password, user.hashedPassword)) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id);
    
    return {
      user: this.sanitizeUser(user),
      ...tokens
    };
  }

  /**
   * 토큰 생성
   */
  private async generateTokens(userId: string) {
    const payload = { userId, type: 'access' };
    
    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN
    });

    const refreshToken = jwt.sign(
      { userId, type: 'refresh' },
      this.JWT_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRES_IN }
    );

    // Refresh token을 DB에 저장 (해시화)
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken }
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600 // 1시간 (초 단위)
    };
  }

  /**
   * 토큰 검증 미들웨어
   */
  verifyToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      throw new UnauthorizedError('Access token required');
    }

    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as JWTPayload;
      req.user = { userId: decoded.userId };
      next();
    } catch (error) {
      throw new UnauthorizedError('Invalid token');
    }
  };
}
```

#### 4.2 입력 검증 및 보안
```typescript
// validators/courseValidators.ts
import { z } from 'zod';

export const createScheduleSchema = z.object({
  name: z.string()
    .min(1, '시간표 이름은 필수입니다')
    .max(50, '시간표 이름은 50자 이하여야 합니다')
    .regex(/^[가-힣a-zA-Z0-9\s-_]+$/, '특수문자는 사용할 수 없습니다'),
  
  semester: z.enum(['2025-1', '2025-2'], {
    errorMap: () => ({ message: '올바른 학기를 선택해주세요' })
  }),
  
  year: z.number()
    .int('연도는 정수여야 합니다')
    .min(2020, '2020년 이후만 가능합니다')
    .max(2030, '2030년 이전만 가능합니다'),
  
  isTemplate: z.boolean().optional()
});

export const courseSearchSchema = z.object({
  q: z.string().max(100, '검색어는 100자 이하여야 합니다').optional(),
  
  filters: z.object({
    department: z.array(z.string()).max(10).optional(),
    professor: z.array(z.string()).max(10).optional(),
    grade: z.array(z.number().int().min(1).max(4)).optional(),
    credits: z.array(z.number().int().min(1).max(6)).optional(),
    semester: z.string().regex(/^\d{4}-[12]$/),
    year: z.number().int().min(2020).max(2030)
  }),
  
  page: z.number().int().min(1).max(1000).optional(),
  limit: z.number().int().min(1).max(100).optional()
});

// Rate limiting
export const searchRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1분
  max: 60, // 요청 60회 제한
  message: '검색 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  standardHeaders: true,
  legacyHeaders: false,
});
```

### 5. 성능 최적화

#### 5.1 데이터베이스 최적화
```typescript
// services/cacheService.ts
class CacheService {
  private redis = new Redis(process.env.REDIS_URL!);

  /**
   * 검색 결과 캐싱
   */
  async getCachedSearchResults(
    queryKey: string
  ): Promise<CourseSearchResponse | null> {
    const cached = await this.redis.get(`search:${queryKey}`);
    return cached ? JSON.parse(cached) : null;
  }

  async setCachedSearchResults(
    queryKey: string,
    results: CourseSearchResponse,
    ttl = 300 // 5분
  ): Promise<void> {
    await this.redis.setex(
      `search:${queryKey}`,
      ttl,
      JSON.stringify(results)
    );
  }

  /**
   * 시간표 캐싱
   */
  async getCachedSchedule(scheduleId: string): Promise<Schedule | null> {
    const cached = await this.redis.get(`schedule:${scheduleId}`);
    return cached ? JSON.parse(cached) : null;
  }

  async setCachedSchedule(
    scheduleId: string,
    schedule: Schedule,
    ttl = 600 // 10분
  ): Promise<void> {
    await this.redis.setex(
      `schedule:${scheduleId}`,
      ttl,
      JSON.stringify(schedule)
    );
  }

  /**
   * 충돌 감지 결과 캐싱
   */
  async getCachedConflicts(
    scheduleId: string,
    courseId?: string
  ): Promise<ConflictDetectionResult | null> {
    const key = `conflicts:${scheduleId}:${courseId || 'all'}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
}
```

#### 5.2 백그라운드 작업 큐
```typescript
// services/queueService.ts
import Bull from 'bull';

class QueueService {
  private exportQueue = new Bull('export', process.env.REDIS_URL!);
  private emailQueue = new Bull('email', process.env.REDIS_URL!);

  constructor() {
    this.setupProcessors();
  }

  /**
   * 시간표 내보내기 작업 큐
   */
  async queueExportJob(
    userId: string,
    scheduleId: string,
    format: string,
    options: any
  ): Promise<string> {
    const job = await this.exportQueue.add('exportSchedule', {
      userId,
      scheduleId,
      format,
      options
    }, {
      attempts: 3,
      backoff: 'exponential'
    });

    return job.id.toString();
  }

  private setupProcessors(): void {
    // 시간표 내보내기 프로세서
    this.exportQueue.process('exportSchedule', async (job) => {
      const { userId, scheduleId, format, options } = job.data;
      
      try {
        const exportService = new ExportService();
        const fileUrl = await exportService.exportSchedule(
          scheduleId,
          format,
          options
        );

        // 작업 완료 후 사용자에게 알림
        await this.emailQueue.add('exportCompleted', {
          userId,
          fileUrl,
          format
        });

        return { fileUrl };
      } catch (error) {
        console.error('Export failed:', error);
        throw error;
      }
    });

    // 이메일 발송 프로세서
    this.emailQueue.process('exportCompleted', async (job) => {
      const { userId, fileUrl, format } = job.data;
      
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (user) {
        await this.sendExportCompletionEmail(user.email, fileUrl, format);
      }
    });
  }
}
```

### 6. 모니터링 및 로깅

#### 6.1 로깅 설정
```typescript
// utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'schedule-wizard-api' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// 요청 로깅 미들웨어
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      userId: req.user?.userId
    });
  });

  next();
};
```

#### 6.2 에러 처리 미들웨어
```typescript
// middleware/errorHandler.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('API Error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.userId,
    body: req.body
  });

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        message: error.message,
        code: error.code
      }
    });
  }

  // Prisma 에러 처리
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    if (prismaError.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: {
          message: '중복된 데이터입니다',
          code: 'DUPLICATE_ENTRY'
        }
      });
    }
  }

  // 기타 에러
  res.status(500).json({
    success: false,
    error: {
      message: '내부 서버 오류가 발생했습니다',
      code: 'INTERNAL_SERVER_ERROR'
    }
  });
};
```

### 7. 테스트 전략

#### 7.1 단위 테스트
```typescript
// tests/services/conflictDetection.test.ts
describe('ConflictDetectionService', () => {
  let service: ConflictDetectionService;

  beforeEach(() => {
    service = new ConflictDetectionService();
  });

  describe('detectConflicts', () => {
    test('시간 겹침 감지', async () => {
      const existingCourses = [
        { id: '1', times: [{ dayOfWeek: 1, startTime: '09:00', endTime: '10:50' }] }
      ];
      
      const newCourse = {
        id: '2',
        times: [{ dayOfWeek: 1, startTime: '09:30', endTime: '11:20' }]
      };

      const result = await service.detectConflicts('schedule-1', newCourse);

      expect(result.hasConflict).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe('TIME_OVERLAP');
    });

    test('같은 과목 중복 감지', async () => {
      const existingCourses = [
        { id: '1', courseCode: 'CS101' }
      ];
      
      const newCourse = { id: '2', courseCode: 'CS101' };

      const result = await service.detectConflicts('schedule-1', newCourse);

      expect(result.hasConflict).toBe(true);
      expect(result.conflicts[0].type).toBe('DUPLICATE_COURSE');
    });
  });
});
```

#### 7.2 통합 테스트
```typescript
// tests/integration/api.test.ts
describe('Schedule API Integration', () => {
  let app: Application;
  let authToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    authToken = await getTestAuthToken();
  });

  describe('POST /api/v1/schedules', () => {
    test('시간표 생성 성공', async () => {
      const response = await request(app)
        .post('/api/v1/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '테스트 시간표',
          semester: '2025-1',
          year: 2025
        });

      expect(response.status).toBe(201);
      expect(response.body.schedule.name).toBe('테스트 시간표');
    });

    test('과목 추가 및 충돌 감지', async () => {
      // 시간표 생성
      const scheduleRes = await request(app)
        .post('/api/v1/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '충돌 테스트', semester: '2025-1', year: 2025 });

      const scheduleId = scheduleRes.body.schedule.id;

      // 첫 번째 과목 추가
      await request(app)
        .post(`/api/v1/schedules/${scheduleId}/courses`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ courseId: 'course-1' });

      // 충돌하는 과목 추가 시도
      const conflictRes = await request(app)
        .post(`/api/v1/schedules/${scheduleId}/courses`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ courseId: 'course-2' });

      expect(conflictRes.status).toBe(409);
      expect(conflictRes.body.conflicts).toBeDefined();
    });
  });
});
```

이 문서는 백엔드 개발 시 참조해야 할 모든 기술적 요구사항과 구현 세부사항을 포함합니다.