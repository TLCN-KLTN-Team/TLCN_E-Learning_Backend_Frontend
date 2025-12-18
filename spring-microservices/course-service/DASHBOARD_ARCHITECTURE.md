# Dashboard Service Architecture

## Component Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐                  │
│  │  Web App   │  │  Mobile    │  │  Dashboard   │                  │
│  │  (React)   │  │   App      │  │    Admin     │                  │
│  └──────┬─────┘  └──────┬─────┘  └──────┬───────┘                  │
└─────────┼────────────────┼───────────────┼──────────────────────────┘
          │                │               │
          └────────────────┴───────────────┘
                           │
                    HTTP Request
                  (JWT Authentication)
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       CONTROLLER LAYER                               │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │            DashboardController.java                           │  │
│  │  ┌─────────────────────┐  ┌──────────────────────────────┐   │  │
│  │  │ GET /statistics     │  │ POST /statistics             │   │  │
│  │  │ - Query params      │  │ - Request body               │   │  │
│  │  │ - Security check    │  │ - Validation                 │   │  │
│  │  └─────────────────────┘  └──────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SERVICE LAYER                                 │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              DashboardService.java                            │  │
│  │  ┌──────────────────────────────────────────────────────┐    │  │
│  │  │  getDashboardStatistics(filter)                      │    │  │
│  │  │    ├── Calculate period ranges (current/previous)    │    │  │
│  │  │    ├── getUserStatistics()                           │    │  │
│  │  │    ├── getOrganizationStatistics()                   │    │  │
│  │  │    ├── getActiveCoursesKPI()                         │    │  │
│  │  │    ├── getCompletionRateKPI()                        │    │  │
│  │  │    ├── getWeeklyTrafficKPI()                         │    │  │
│  │  │    ├── getPendingViolationsKPI()                     │    │  │
│  │  │    └── calculateGrowthRate()                         │    │  │
│  │  └──────────────────────────────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────┬───────────────────────────────────────────────────────┘
              │
              ├────────────┬────────────┬─────────────┬──────────────┐
              ▼            ▼            ▼             ▼              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      REPOSITORY LAYER                                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │
│  │   Course     │ │  Enrollment  │ │ Educational  │               │
│  │  Repository  │ │  Repository  │ │    Unit      │               │
│  └──────────────┘ └──────────────┘ │  Repository  │               │
│  ┌──────────────┐ ┌──────────────┐ └──────────────┘               │
│  │   Course     │ │  PageVisit   │ ┌──────────────┐               │
│  │  Progress    │ │  Repository  │ │  Violation   │               │
│  │  Repository  │ └──────────────┘ │  Repository  │               │
│  └──────────────┘                  └──────────────┘               │
└─────────────┬───────────────────────────────────────────────────────┘
              │
              │ JPA Queries
              │ (Optimized with indexes)
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATABASE LAYER                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │   course   │  │ enrollment │  │educational │  │   course   │   │
│  │            │  │            │  │    unit    │  │  progress  │   │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘   │
│  ┌────────────┐  ┌────────────┐                                    │
│  │ page_visit │  │ violations │  🆕 NEW TABLES                     │
│  │     s      │  │            │                                     │
│  └────────────┘  └────────────┘                                    │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
1. Client Request
   ↓
2. Controller receives & validates
   ↓
3. Service processes filter
   ├── PeriodRange.getCurrentPeriod()
   └── PeriodRange.getPreviousPeriod()
   ↓
4. Service queries repositories (parallel)
   ├── User statistics
   ├── Organization statistics
   ├── Active courses
   ├── Completion rate
   ├── Traffic metrics
   └── Violations
   ↓
5. Service calculates growth rates
   ↓
6. Service builds DashboardResponse
   ↓
7. Controller wraps in ApiResponse
   ↓
8. JSON returned to client
```

## Key Design Patterns

```
┌────────────────────────────────────────────────────┐
│ PATTERN               │ IMPLEMENTATION             │
├────────────────────────────────────────────────────┤
│ Repository Pattern    │ Data access abstraction    │
│ Service Layer         │ Business logic separation  │
│ DTO Pattern           │ Data transfer objects      │
│ Builder Pattern       │ Response construction      │
│ Strategy Pattern      │ Period calculations        │
│ Dependency Injection  │ @RequiredArgsConstructor   │
└────────────────────────────────────────────────────┘
```

## Period Calculation Logic

```
┌─────────────────────────────────────────────────────────┐
│                    Time Period                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  WEEK:    [Today - 7 days] ←→ [Today]                  │
│           Previous: [Today - 14 days] ←→ [Today - 7]   │
│                                                          │
│  MONTH:   [Today - 30 days] ←→ [Today]                 │
│           Previous: [Today - 60 days] ←→ [Today - 30]  │
│                                                          │
│  YEAR:    [Today - 365 days] ←→ [Today]                │
│           Previous: [Today - 730] ←→ [Today - 365]     │
│                                                          │
│  CUSTOM:  [from date] ←→ [to date]                     │
│           Previous: Calculate same duration back        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## KPI Calculation Flow

```
┌─────────────────────────────────────────────────────────────┐
│            For Each KPI (6 total)                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Query Current Period Data                               │
│     ├── Apply date filter                                   │
│     ├── Apply education type filter                         │
│     └── COUNT or AVG aggregation                            │
│                                                              │
│  2. Query Previous Period Data                              │
│     ├── Apply date filter (shifted back)                    │
│     ├── Apply same education type filter                    │
│     └── COUNT or AVG aggregation                            │
│                                                              │
│  3. Calculate Growth Rate                                   │
│     formula: ((current - previous) / previous) × 100        │
│     ├── Handle null values                                  │
│     ├── Handle division by zero                             │
│     └── Round to 1 decimal place                            │
│                                                              │
│  4. Build KPI Response                                      │
│     └── DashboardKPIResponse(current, previous, growth)     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Security Flow

```
┌──────────────────────────────────────────────────┐
│         Security & Authorization                 │
├──────────────────────────────────────────────────┤
│                                                   │
│  Client Request                                   │
│       ↓                                           │
│  JWT Token in Header                              │
│       ↓                                           │
│  Spring Security Filter                           │
│       ↓                                           │
│  Token Validation                                 │
│       ↓                                           │
│  Extract User Authorities                         │
│       ↓                                           │
│  @PreAuthorize Check                             │
│  ├── ADMIN ✓                                     │
│  ├── MANAGER ✓                                   │
│  └── Others ✗ (403 Forbidden)                    │
│       ↓                                           │
│  Controller Method Execution                      │
│                                                   │
└──────────────────────────────────────────────────┘
```

## Response Structure

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "userStatistics": {
      "totalUsers": 15420,
      "studentCount": 8234,
      "teacherCount": 4186,
      "growthRate": 12.5
    },
    "organizationStatistics": {
      "totalOrganizations": 156,
      "activeOrganizations": 98,
      "inactiveOrganizations": 32,
      "growthRate": 8.3
    },
    "activeCourses": {
      "currentValue": 1248,
      "previousValue": 1080,
      "growthRate": 15.7
    },
    "completionRate": {
      "currentValue": 725, // 72.5%
      "previousValue": 702, // 70.2%
      "growthRate": 3.2
    },
    "weeklyTraffic": {
      "currentValue": 45678,
      "previousValue": 42356,
      "growthRate": 7.8
    },
    "pendingViolations": {
      "currentValue": 23,
      "previousValue": 26,
      "growthRate": -12.0
    },
    "period": "MONTH",
    "educationType": "ALL",
    "fromDate": "2024-11-18",
    "toDate": "2024-12-18"
  }
}
```

## Database Query Optimization

```
┌─────────────────────────────────────────────────┐
│         Performance Optimizations               │
├─────────────────────────────────────────────────┤
│                                                  │
│  1. Indexes on date columns                     │
│     ├── created_at                              │
│     ├── enrolled_at                             │
│     ├── visit_time                              │
│     └── reported_at                             │
│                                                  │
│  2. Use COUNT instead of SELECT *               │
│                                                  │
│  3. Filter early in WHERE clause                │
│                                                  │
│  4. Composite indexes for common filters        │
│     └── (status, reported_at)                   │
│                                                  │
│  5. Connection pooling (HikariCP)               │
│                                                  │
└─────────────────────────────────────────────────┘
```
