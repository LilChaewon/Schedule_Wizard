# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the "시간표 마법사" (Schedule Wizard) project - a Korean university course scheduling web application. The project is designed to replicate the functionality of Korean university course registration systems with modern web technologies.

## Data Structure

### Course Data Format
The project includes Korean university course data in CSV format (`2025-2.csv`) with the following structure:
- 학년 (Grade Level)
- 교과목명 (Course Name) 
- 한글코드 (Course Code)
- 학점 (Credits)
- 시간 (Hours)
- 담당교수 (Professor)
- 강좌번호 (Section Number)
- 제한인원 (Max Students)
- 시간(강의실) (Time & Room) - Format: "요일HH:MM-HH:MM (강의실)"
- 비고 (Notes)

### Time Format Convention
Korean university schedule format: "월09:00-10:50 (Y2508)" 
- 월/화/수/목/금/토 (Mon/Tue/Wed/Thu/Fri/Sat)
- 24-hour time format
- Room codes in parentheses

## Development Commands

### Project Setup (when implementing)
```bash
# Initial setup
npm install                    # Install dependencies
npx prisma generate           # Generate Prisma client
npx prisma db push            # Push schema to database
npm run db:seed               # Import CSV data and seed database

# Development
npm run dev                   # Start Next.js development server
npm run dev:api              # Start backend API server (if separate)
```

### Daily Development Commands
```bash
# Development workflow
npm run dev                   # Start development server
npm run typecheck            # TypeScript type checking
npm run lint                 # ESLint checking
npm run test                 # Run all tests

# Database operations
npm run db:studio            # Open Prisma Studio
npm run db:reset             # Reset database and re-seed
npm run csv:import           # Import new CSV course data

# Production
npm run build                # Build for production
npm run start                # Start production server
```

## Architecture Guidelines

### Tech Stack (as per PRD)
- **Frontend**: React 18 + TypeScript + Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Shadcn/ui + Radix UI
- **State Management**: Zustand + TanStack Query
- **Backend**: Node.js + Express.js + Prisma ORM
- **Database**: PostgreSQL + Redis
- **Deployment**: Vercel (Frontend) + Railway/PlanetScale (Database)

### Core Domain Logic

#### Time Conflict Detection
The most critical feature - detecting schedule conflicts between courses. Key considerations:
- Parse Korean time format: "월09:00-10:50"
- Handle multi-day courses (e.g., "월수" for Mon/Wed)
- Account for room conflicts (same time, same room)
- Support time overlap detection with minute precision

#### Schedule Management
- Support multiple schedule groups (up to 10)
- Each schedule group can contain multiple courses
- Calculate total credits, weekly hours, and free periods
- Export functionality (PNG, PDF, Excel)

#### Search and Filtering
- Real-time search across course names, professors, course codes
- Multi-dimensional filtering: department, grade level, time slots, credits
- Korean text search optimization
- Pagination for large course datasets

### Data Flow Architecture

```
CSV Data → Database Seeding → API Layer → Frontend State → UI Components
```

1. **Data Import**: Parse Korean university CSV data into structured database
2. **API Layer**: RESTful endpoints for course search, schedule CRUD operations  
3. **State Management**: Zustand for schedule state, TanStack Query for server state
4. **UI Layer**: Calendar grid, course search, drag-and-drop interface

### Key Components Structure

#### ScheduleCalendar
- Grid-based weekly view (Monday-Saturday)
- Time slots from 9:00-21:00 (1st-10th period)
- Drag-and-drop course placement
- Visual conflict highlighting
- Color coding by course type (major/general/elective)

#### CourseSearch  
- Real-time search with debouncing
- Advanced filter panel (collapsible)
- Course card display with essential info
- Add-to-schedule functionality
- Course detail modal

#### ScheduleManager
- Multiple schedule tabs/groups
- Schedule comparison view
- Statistics display (credits, hours, conflicts)
- Import/export functionality

### Korean Language Considerations

#### Text Processing
- Course names and professor names in Korean
- Day abbreviations: 월화수목금토 (Mon-Sat)
- Time period names: 1교시, 2교시... (1st period, 2nd period...)
- Building/room codes: Often alphanumeric (Y2508, 공학관301)

#### Search Optimization
- Support both Hangul and Hanja course names
- Professor name variations (한글, 영문)
- Course code search (both Korean and alphanumeric codes)
- Autocomplete with Korean input method support

### Development Workflow

#### Component-First Development
1. Create UI components with mock data first
2. Implement state management and data flow
3. Connect to backend APIs
4. Add real data and error handling

#### Time Parsing Utilities
Critical utilities needed for Korean schedule format:
- `parseKoreanTime()`: Parse "월09:00-10:50" format
- `detectTimeConflicts()`: Check overlapping time slots
- `formatScheduleDisplay()`: Convert to display format
- `validateTimeSlot()`: Ensure valid time ranges

### Course Data Import Process

When working with the CSV data (`2025-2.csv`):
1. Parse CSV headers and map to database schema
2. Handle Korean encoding (likely UTF-8 with BOM)
3. Clean and validate time format strings
4. Extract room information from time strings
5. Handle multiple time slots for single courses
6. Validate professor names and course codes

Sample CSV structure from `2025-2.csv`:
- Row 8 contains headers: `학년,교과목명,한글코드,,,학점,시간,담당교수,,강좌번호,제한인원,시간(강의실),,,,비  고,`
- Data starts from row 9 with format: `전학년,성서와인간이해,교필127,,,2 ,2 ,김진옥,, 0001,50 ,월09:00-10:50 (Y2508),,,,,`

### Implementation Priority

Based on the detailed requirements documents in this repository:

1. **Phase 1**: Core time conflict detection and Korean time parsing
2. **Phase 2**: Schedule CRUD operations and basic UI components  
3. **Phase 3**: Advanced search and filtering with CSV data integration
4. **Phase 4**: Export functionality and mobile optimization

### Related Documentation

- `PRD_시간표마법사.md` - Complete product requirements
- `FRONTEND_REQUIREMENTS.md` - Detailed frontend technical specifications
- `BACKEND_REQUIREMENTS.md` - Detailed backend API and database design
- `SUMMARY_TEMPLATE.md` - Template for documenting code changes

This codebase focuses on Korean university-specific scheduling requirements with emphasis on accurate time conflict detection and intuitive course management.