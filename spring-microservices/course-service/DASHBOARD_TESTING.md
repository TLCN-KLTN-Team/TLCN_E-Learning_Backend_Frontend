# Dashboard Service Testing Guide

## Quick Start

### 1. Database Setup

First, run the migration script to create the required tables:

```sql
-- Run this in your MySQL/MariaDB database
source src/main/resources/db/migration/V1.0__Create_Dashboard_Tables.sql
```

Or use Flyway/Liquibase if configured in your project.

### 2. Test the Health Check

```bash
curl -X GET http://localhost:8080/api/dashboard/health
```

**Expected Response:**

```json
{
  "code": 200,
  "message": "Health check successful",
  "data": "Dashboard service is operational"
}
```

### 3. Basic Dashboard Request

```bash
curl -X GET "http://localhost:8080/api/dashboard/statistics?period=MONTH&educationType=ALL" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Testing Scenarios

### Scenario 1: Monthly Dashboard (All Education Types)

**Request:**

```bash
GET /api/dashboard/statistics?period=MONTH&educationType=ALL
```

**Expected Fields:**

- userStatistics: totalUsers, studentCount, teacherCount, growthRate
- organizationStatistics: totalOrganizations, activeOrganizations, inactiveOrganizations, growthRate
- activeCourses: currentValue, previousValue, growthRate
- completionRate: currentValue (×10), previousValue, growthRate
- weeklyTraffic: currentValue, previousValue, growthRate
- pendingViolations: currentValue, previousValue, growthRate

### Scenario 2: Weekly University Dashboard

**Request:**

```bash
GET /api/dashboard/statistics?period=WEEK&educationType=UNIVERSITY
```

**What to Verify:**

- Period should be "WEEK"
- EducationType should be "UNIVERSITY"
- Date range should be last 7 days
- Only university-related data included

### Scenario 3: Custom Date Range

**Request:**

```bash
POST /api/dashboard/statistics
Content-Type: application/json

{
  "period": "CUSTOM",
  "educationType": "COLLEGE",
  "from": "2024-01-01",
  "to": "2024-06-30"
}
```

**What to Verify:**

- fromDate matches provided "from"
- toDate matches provided "to"
- Only college-level data included

### Scenario 4: Year-over-Year Comparison

**Request:**

```bash
GET /api/dashboard/statistics?period=YEAR&educationType=ALL
```

**What to Verify:**

- Covers last 365 days
- Previous period is 365 days before that
- Growth rates show yearly trends

## Sample Data Generation

### Generate Traffic Data

```sql
-- Generate 1000 random page visits over the last 30 days
DELIMITER //

CREATE PROCEDURE generate_page_visits()
BEGIN
    DECLARE i INT DEFAULT 0;
    WHILE i < 1000 DO
        INSERT INTO page_visits (user_id, page_url, visit_time, ip_address, session_id)
        VALUES (
            CONCAT('user_', FLOOR(RAND() * 1000)),
            CONCAT('/page/', FLOOR(RAND() * 100)),
            DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY),
            CONCAT('192.168.', FLOOR(RAND() * 255), '.', FLOOR(RAND() * 255)),
            UUID()
        );
        SET i = i + 1;
    END WHILE;
END//

DELIMITER ;

CALL generate_page_visits();
DROP PROCEDURE generate_page_visits;
```

### Generate Violation Data

```sql
-- Generate sample violations
INSERT INTO violations (user_id, violation_type, description, status, severity, reported_at)
SELECT
    CONCAT('user_', FLOOR(RAND() * 1000)) as user_id,
    ELT(FLOOR(1 + RAND() * 4), 'PLAGIARISM', 'SPAM', 'INAPPROPRIATE_CONTENT', 'CHEATING') as violation_type,
    'Sample violation for testing' as description,
    ELT(FLOOR(1 + RAND() * 4), 'PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED') as status,
    ELT(FLOOR(1 + RAND() * 4), 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL') as severity,
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 60) DAY) as reported_at
FROM
    (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) t1,
    (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) t2
LIMIT 100;
```

## Postman Collection

### Setup Environment Variables

```json
{
  "name": "Dashboard Testing",
  "values": [
    {
      "key": "baseUrl",
      "value": "http://localhost:8080",
      "enabled": true
    },
    {
      "key": "token",
      "value": "YOUR_JWT_TOKEN_HERE",
      "enabled": true
    }
  ]
}
```

### Test Collection

```json
{
  "info": {
    "name": "Dashboard API Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/dashboard/health",
          "host": ["{{baseUrl}}"],
          "path": ["api", "dashboard", "health"]
        }
      }
    },
    {
      "name": "Monthly Dashboard - All",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/dashboard/statistics?period=MONTH&educationType=ALL",
          "host": ["{{baseUrl}}"],
          "path": ["api", "dashboard", "statistics"],
          "query": [
            { "key": "period", "value": "MONTH" },
            { "key": "educationType", "value": "ALL" }
          ]
        }
      },
      "tests": [
        "pm.test('Status code is 200', function () {",
        "    pm.response.to.have.status(200);",
        "});",
        "",
        "pm.test('Response has required fields', function () {",
        "    var jsonData = pm.response.json();",
        "    pm.expect(jsonData.data).to.have.property('userStatistics');",
        "    pm.expect(jsonData.data).to.have.property('organizationStatistics');",
        "    pm.expect(jsonData.data).to.have.property('activeCourses');",
        "});"
      ]
    },
    {
      "name": "Custom Period Dashboard",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"period\": \"CUSTOM\",\n  \"educationType\": \"UNIVERSITY\",\n  \"from\": \"2024-01-01\",\n  \"to\": \"2024-12-31\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/dashboard/statistics",
          "host": ["{{baseUrl}}"],
          "path": ["api", "dashboard", "statistics"]
        }
      }
    }
  ]
}
```

## Validation Checklist

### ✅ Functional Tests

- [ ] Dashboard returns data for WEEK period
- [ ] Dashboard returns data for MONTH period
- [ ] Dashboard returns data for YEAR period
- [ ] Dashboard returns data for CUSTOM period with valid dates
- [ ] Education type filter works (UNIVERSITY, COLLEGE, INTERMEDIATE)
- [ ] ALL education type includes all data
- [ ] Growth rates are calculated correctly
- [ ] Previous period calculation is accurate

### ✅ Data Integrity Tests

- [ ] User statistics totals match breakdown (students + teachers)
- [ ] Organization statistics totals match breakdown (active + inactive)
- [ ] Completion rate is between 0 and 1000 (0% to 100%)
- [ ] Dates in response match requested period
- [ ] Negative growth rates displayed correctly

### ✅ Edge Cases

- [ ] Empty database returns zero values (not null)
- [ ] Single data point doesn't crash
- [ ] Future dates handled gracefully
- [ ] Invalid period type returns error
- [ ] Missing required fields return validation error
- [ ] Unauthorized access returns 401/403

### ✅ Performance Tests

- [ ] Response time < 2 seconds for simple query
- [ ] Response time < 5 seconds for complex query
- [ ] Concurrent requests handled properly
- [ ] Database connection pool doesn't exhaust

## Manual Testing Steps

### Step 1: Verify Database State

```sql
-- Check if data exists
SELECT
    (SELECT COUNT(*) FROM course) as total_courses,
    (SELECT COUNT(*) FROM course_enrollments) as total_enrollments,
    (SELECT COUNT(*) FROM educational_units) as total_orgs,
    (SELECT COUNT(*) FROM course_progress) as total_progress,
    (SELECT COUNT(*) FROM page_visits) as total_visits,
    (SELECT COUNT(*) FROM violations WHERE status = 'PENDING') as pending_violations;
```

### Step 2: Test Each Period Type

```bash
# Week
curl -X GET "http://localhost:8080/api/dashboard/statistics?period=WEEK" \
  -H "Authorization: Bearer TOKEN"

# Month
curl -X GET "http://localhost:8080/api/dashboard/statistics?period=MONTH" \
  -H "Authorization: Bearer TOKEN"

# Year
curl -X GET "http://localhost:8080/api/dashboard/statistics?period=YEAR" \
  -H "Authorization: Bearer TOKEN"
```

### Step 3: Test Education Type Filtering

```bash
# University
curl -X GET "http://localhost:8080/api/dashboard/statistics?educationType=UNIVERSITY" \
  -H "Authorization: Bearer TOKEN"

# College
curl -X GET "http://localhost:8080/api/dashboard/statistics?educationType=COLLEGE" \
  -H "Authorization: Bearer TOKEN"
```

### Step 4: Verify Growth Rate Calculations

1. Run query for current period
2. Note the values
3. Run query for previous period
4. Manually calculate: `((current - previous) / previous) * 100`
5. Compare with API response

## Common Issues & Solutions

### Issue: All values are zero

**Solution:**

- Check if data exists in database
- Verify date filters are not excluding all data
- Ensure education type filter matches data

### Issue: Growth rate shows NaN or Infinity

**Solution:**

- Check for division by zero in growth rate calculation
- Verify previous period has data
- Look at null value handling

### Issue: Dates don't match expected range

**Solution:**

- Verify server timezone configuration
- Check LocalDate to Date conversion
- Ensure period calculation logic is correct

### Issue: Performance is slow

**Solution:**

- Add database indexes (see migration script)
- Implement caching (Redis recommended)
- Optimize queries (use EXPLAIN)

## Automated Testing

### JUnit Test Example

```java
@SpringBootTest
@AutoConfigureMockMvc
class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(authorities = "ADMIN")
    void testMonthlyDashboard() throws Exception {
        mockMvc.perform(get("/api/dashboard/statistics")
                .param("period", "MONTH")
                .param("educationType", "ALL"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.userStatistics").exists())
            .andExpect(jsonPath("$.data.activeCourses.growthRate").isNumber());
    }
}
```

## Performance Benchmarks

Target metrics:

- Simple query (WEEK/MONTH): < 1 second
- Complex query (YEAR): < 3 seconds
- Custom range (1 year): < 5 seconds
- Concurrent users (100): < 10 seconds average

## Support

For issues during testing:

1. Check logs for exceptions
2. Verify database connectivity
3. Ensure all migrations ran successfully
4. Contact development team with error details
