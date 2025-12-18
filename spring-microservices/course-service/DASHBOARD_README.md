# Dashboard Service Implementation

## Overview

The Dashboard Service provides comprehensive system analytics and KPIs (Key Performance Indicators) with support for flexible time-based filtering and education type filtering. All metrics include period-over-period comparison to calculate growth rates.

## Features

### 📊 Key Performance Indicators

1. **User Statistics**

   - Total users (students + teachers)
   - Student count breakdown
   - Teacher count breakdown
   - Growth rate vs previous period

2. **Organization Statistics**

   - Total educational units/organizations
   - Active organizations count
   - Inactive organizations count
   - Growth rate vs previous period

3. **Course Activity**

   - Total active/published courses
   - Growth rate vs previous period

4. **Completion Rate**

   - Average course completion percentage
   - Stored as percentage × 10 (e.g., 725 = 72.5%)
   - Growth rate vs previous period

5. **Traffic Metrics**

   - Weekly page visits/traffic
   - Growth rate vs previous period

6. **Pending Violations**
   - Count of unresolved violations
   - Growth rate vs previous period

### 🔍 Filtering Capabilities

- **Period Types:**

  - `WEEK` - Last 7 days
  - `MONTH` - Last 30 days
  - `YEAR` - Last 365 days
  - `CUSTOM` - User-defined date range

- **Education Types:**
  - `UNIVERSITY` - University-level courses
  - `COLLEGE` - College-level courses
  - `INTERMEDIATE` - Intermediate-level courses
  - `ALL` - All education types

## Architecture

### Components Created

```
├── DTOs (Response)
│   ├── DashboardResponse.java           # Main dashboard response
│   ├── DashboardKPIResponse.java        # Generic KPI with growth rate
│   ├── UserStatisticsResponse.java      # User metrics breakdown
│   └── OrganizationStatisticsResponse.java # Organization metrics
│
├── DTOs (Request)
│   └── DashboardFilterRequest.java      # Filter parameters
│
├── Entities
│   ├── PageVisit.java                   # Traffic tracking
│   └── Violation.java                   # Violation management
│
├── Repositories
│   ├── PageVisitRepository.java         # Traffic queries
│   ├── ViolationRepository.java         # Violation queries
│   ├── CourseRepository.java            # Enhanced with dashboard queries
│   ├── CourseEnrollmentRepository.java  # Enhanced with dashboard queries
│   ├── EducationalUnitRepository.java   # Enhanced with dashboard queries
│   └── CourseProgressRepository.java    # Enhanced with dashboard queries
│
├── Services
│   └── DashboardService.java            # Core business logic
│
├── Controllers
│   └── DashboardController.java         # REST API endpoints
│
└── Utils
    └── PeriodRange.java                 # Period calculation utility
```

## API Endpoints

### GET /api/dashboard/statistics

Retrieve comprehensive dashboard statistics.

**Query Parameters:**

- `period` (optional, default: MONTH): WEEK | MONTH | YEAR | CUSTOM
- `educationType` (optional, default: ALL): UNIVERSITY | COLLEGE | INTERMEDIATE | ALL
- `from` (required if period=CUSTOM): Start date (ISO format)
- `to` (required if period=CUSTOM): End date (ISO format)

**Example Request:**

```http
GET /api/dashboard/statistics?period=MONTH&educationType=ALL
```

**Example Response:**

```json
{
  "code": 200,
  "message": "Dashboard statistics retrieved successfully",
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
      "currentValue": 725,
      "previousValue": 702,
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

### POST /api/dashboard/statistics

Alternative POST endpoint with filter in request body.

**Request Body:**

```json
{
  "period": "CUSTOM",
  "educationType": "UNIVERSITY",
  "from": "2024-01-01",
  "to": "2024-12-31"
}
```

### GET /api/dashboard/health

Health check endpoint.

## Implementation Details

### Period Calculation

The `PeriodRange` utility class handles:

- Current period calculation based on filter type
- Previous period calculation for comparison
- Support for custom date ranges
- Automatic date boundary handling

**Algorithm:**

1. Calculate current period end (today)
2. Calculate current period start based on period type
3. Calculate previous period by shifting back the same duration
4. For CUSTOM periods, use provided dates directly

### Growth Rate Formula

```java
growthRate = ((current - previous) * 100.0) / previous
```

- Rounded to 1 decimal place
- Handles edge cases (zero/null values)
- Negative growth indicates decline

### Query Optimization

All repository queries:

- Use indexed columns (createdAt, enrolledAt, etc.)
- Support education type filtering
- Use COUNT for performance
- Minimize data transfer

## Database Schema

### New Tables

#### page_visits

```sql
CREATE TABLE page_visits (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(255),
    page_url VARCHAR(500),
    visit_time DATETIME,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    session_id VARCHAR(255),
    INDEX idx_visit_time (visit_time)
);
```

#### violations

```sql
CREATE TABLE violations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(255),
    violation_type VARCHAR(100),
    description VARCHAR(1000),
    status VARCHAR(50),
    severity VARCHAR(50),
    reported_at DATETIME,
    reviewed_at DATETIME,
    reviewed_by VARCHAR(255),
    course_id INT,
    reference_id VARCHAR(255),
    INDEX idx_status (status),
    INDEX idx_reported_at (reported_at),
    FOREIGN KEY (course_id) REFERENCES course(id)
);
```

## Security

- Endpoints protected with `@PreAuthorize("hasAnyAuthority('ADMIN', 'MANAGER')")`
- Only administrators and managers can access dashboard
- Input validation on filter parameters
- SQL injection prevention via JPA parameterized queries

## Performance Considerations

1. **Caching Strategy** (Recommended)

   - Cache dashboard results for 5-15 minutes
   - Use Redis or in-memory cache
   - Invalidate on data updates

2. **Query Optimization**

   - All date columns indexed
   - COUNT queries optimized
   - Batch multiple queries when possible

3. **Async Processing** (Future Enhancement)
   - Calculate complex metrics asynchronously
   - Use CompletableFuture for parallel execution

## Usage Examples

### Example 1: Monthly Dashboard

```java
// GET request
GET /api/dashboard/statistics?period=MONTH&educationType=ALL
```

### Example 2: Yearly University Stats

```java
// GET request
GET /api/dashboard/statistics?period=YEAR&educationType=UNIVERSITY
```

### Example 3: Custom Date Range

```java
// POST request
{
  "period": "CUSTOM",
  "educationType": "COLLEGE",
  "from": "2024-01-01",
  "to": "2024-06-30"
}
```

## Extension Points

The service is designed for extensibility:

1. **Add New KPIs**

   - Create method in `DashboardService`
   - Add field to `DashboardResponse`
   - Implement repository query if needed

2. **Custom Filters**

   - Extend `DashboardFilterRequest`
   - Update filter logic in `PeriodRange`
   - Apply filters in service methods

3. **Additional Breakdowns**
   - Add new response DTOs
   - Implement specific queries
   - Integrate into main response

## Testing

### Unit Tests

```java
@Test
void testDashboardStatistics() {
    DashboardFilterRequest filter = DashboardFilterRequest.builder()
        .period(PeriodType.MONTH)
        .educationType(EducationType.ALL)
        .build();

    DashboardResponse response = dashboardService.getDashboardStatistics(filter);

    assertNotNull(response);
    assertNotNull(response.getUserStatistics());
    assertTrue(response.getActiveCourses().getCurrentValue() >= 0);
}
```

### Integration Tests

- Test with real database
- Verify period calculations
- Validate growth rate formulas
- Test edge cases (zero data, null values)

## Monitoring

Recommended monitoring:

- Response times for dashboard endpoint
- Query execution times
- Cache hit/miss rates
- Error rates and types

## Future Enhancements

1. **Real-time Updates**

   - WebSocket support for live updates
   - Server-Sent Events (SSE)

2. **Data Export**

   - CSV/Excel export
   - PDF report generation

3. **Advanced Analytics**

   - Trend prediction
   - Anomaly detection
   - Comparative analysis

4. **Visualization Support**
   - Chart.js integration ready
   - Historical data tracking

## Troubleshooting

### Common Issues

1. **Zero values in metrics**

   - Check if data exists in database
   - Verify date range calculations
   - Ensure filters are correct

2. **Performance issues**

   - Add database indexes
   - Implement caching
   - Optimize queries

3. **Incorrect growth rates**
   - Verify period calculations
   - Check previous period logic
   - Validate data integrity

## Support

For issues or questions, please contact the development team or refer to the main project documentation.
