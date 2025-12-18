# Dashboard Service - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Run Database Migration (2 minutes)

```sql
-- Connect to your database
mysql -u root -p your_database

-- Run the migration script
source src/main/resources/db/migration/V1.0__Create_Dashboard_Tables.sql

-- Verify tables created
SHOW TABLES LIKE '%visit%';
SHOW TABLES LIKE '%violation%';
```

### Step 2: Generate Sample Data (1 minute)

```sql
-- Quick sample data for testing
INSERT INTO page_visits (user_id, page_url, visit_time, session_id) VALUES
('user_001', '/courses', NOW(), UUID()),
('user_002', '/dashboard', DATE_SUB(NOW(), INTERVAL 1 DAY), UUID()),
('user_003', '/courses/123', DATE_SUB(NOW(), INTERVAL 2 DAY), UUID());

INSERT INTO violations (user_id, violation_type, description, status, severity, reported_at) VALUES
('user_005', 'PLAGIARISM', 'Test violation', 'PENDING', 'HIGH', NOW()),
('user_006', 'SPAM', 'Test spam', 'PENDING', 'MEDIUM', DATE_SUB(NOW(), INTERVAL 1 DAY));
```

### Step 3: Test the API (2 minutes)

```bash
# 1. Get JWT token first (login via your auth endpoint)
export TOKEN="your_jwt_token_here"

# 2. Test health check
curl -X GET http://localhost:8080/api/dashboard/health

# 3. Get monthly dashboard
curl -X GET "http://localhost:8080/api/dashboard/statistics?period=MONTH&educationType=ALL" \
  -H "Authorization: Bearer $TOKEN"
```

## 📝 Common Use Cases

### Use Case 1: Monthly Overview Dashboard

**Requirement:** Display last 30 days statistics for all education types

```bash
GET /api/dashboard/statistics?period=MONTH&educationType=ALL
```

**Frontend Integration (React):**

```javascript
const fetchDashboard = async () => {
  const response = await fetch(
    "/api/dashboard/statistics?period=MONTH&educationType=ALL",
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const data = await response.json();

  // Use data.data.userStatistics, etc.
  console.log(`Total Users: ${data.data.userStatistics.totalUsers}`);
  console.log(`Growth: ${data.data.userStatistics.growthRate}%`);
};
```

### Use Case 2: University-Only Dashboard

**Requirement:** Show university-level statistics for the current week

```bash
GET /api/dashboard/statistics?period=WEEK&educationType=UNIVERSITY
```

### Use Case 3: Custom Date Range Report

**Requirement:** Generate Q4 2024 report for all colleges

```bash
POST /api/dashboard/statistics
Content-Type: application/json

{
  "period": "CUSTOM",
  "educationType": "COLLEGE",
  "from": "2024-10-01",
  "to": "2024-12-31"
}
```

## 🎨 Frontend Integration Examples

### React Component

```jsx
import React, { useState, useEffect } from "react";

function DashboardStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/statistics?period=MONTH&educationType=ALL", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setStats(data.data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <StatCard
        title="Total Users"
        value={stats.userStatistics.totalUsers.toLocaleString()}
        growth={stats.userStatistics.growthRate}
        breakdown={`Students: ${stats.userStatistics.studentCount} | Teachers: ${stats.userStatistics.teacherCount}`}
      />

      <StatCard
        title="Active Courses"
        value={stats.activeCourses.currentValue}
        growth={stats.activeCourses.growthRate}
      />

      <StatCard
        title="Completion Rate"
        value={`${(stats.completionRate.currentValue / 10).toFixed(1)}%`}
        growth={stats.completionRate.growthRate}
      />
    </div>
  );
}
```

### Vue.js Component

```vue
<template>
  <div class="dashboard">
    <div class="kpi-card" v-for="kpi in kpis" :key="kpi.title">
      <h3>{{ kpi.title }}</h3>
      <div class="value">{{ kpi.value }}</div>
      <div class="growth" :class="growthClass(kpi.growth)">
        {{ kpi.growth }}% <span v-if="kpi.growth > 0">↑</span
        ><span v-else>↓</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      kpis: [],
    };
  },
  async mounted() {
    const response = await this.$http.get("/api/dashboard/statistics", {
      params: { period: "MONTH", educationType: "ALL" },
    });

    const data = response.data.data;
    this.kpis = [
      {
        title: "Total Users",
        value: data.userStatistics.totalUsers,
        growth: data.userStatistics.growthRate,
      },
      {
        title: "Active Courses",
        value: data.activeCourses.currentValue,
        growth: data.activeCourses.growthRate,
      },
      // ... more KPIs
    ];
  },
  methods: {
    growthClass(growth) {
      return growth > 0 ? "positive" : "negative";
    },
  },
};
</script>
```

## 🔧 Troubleshooting

### Problem: "403 Forbidden"

**Solution:**

```java
// Ensure user has ADMIN or MANAGER role
// Check JWT token is valid and not expired
// Verify Spring Security configuration
```

### Problem: All values are zero

**Solution:**

```sql
-- Check if data exists
SELECT COUNT(*) FROM course;
SELECT COUNT(*) FROM course_enrollments;
SELECT COUNT(*) FROM educational_units;

-- If zero, seed some test data
-- See DASHBOARD_TESTING.md for sample data scripts
```

### Problem: Slow response time

**Solution:**

```sql
-- Add indexes (should already be in migration)
CREATE INDEX idx_created_at ON course(created_at);
CREATE INDEX idx_enrolled_at ON course_enrollments(enrolled_at);

-- Check query execution plan
EXPLAIN SELECT COUNT(*) FROM course WHERE created_at >= '2024-01-01';
```

## 📊 Interpreting the Data

### Understanding Growth Rates

- **Positive Growth (e.g., +12.5%)**: Metric increased compared to previous period
- **Negative Growth (e.g., -12.0%)**: Metric decreased (good for violations!)
- **Zero Growth (0.0%)**: No change from previous period

### Completion Rate Value

The `completionRate.currentValue` is stored as **percentage × 10**:

- Value: 725 = 72.5% completion rate
- Value: 1000 = 100% completion rate
- Value: 0 = 0% completion rate

**Convert in frontend:**

```javascript
const completionPercentage = completionRate.currentValue / 10;
console.log(`${completionPercentage}%`); // "72.5%"
```

## 🎯 Best Practices

### 1. Caching Strategy

```java
// Add caching for better performance
@Cacheable(value = "dashboard", key = "#filter.period + '_' + #filter.educationType")
public DashboardResponse getDashboardStatistics(DashboardFilterRequest filter) {
    // ... existing code
}
```

### 2. Error Handling

```javascript
// Frontend: Always handle errors
try {
  const response = await fetch("/api/dashboard/statistics?period=MONTH");
  if (!response.ok) throw new Error("Failed to fetch");
  const data = await response.json();
  // Use data
} catch (error) {
  console.error("Dashboard error:", error);
  // Show error to user
}
```

### 3. Loading States

```jsx
// Show loading indicator while fetching
{
  loading && <Spinner />;
}
{
  error && <ErrorMessage message={error} />;
}
{
  stats && <DashboardView stats={stats} />;
}
```

## 📱 Mobile App Integration

### Android (Kotlin)

```kotlin
data class DashboardResponse(
    val userStatistics: UserStatistics,
    val activeCourses: KPI,
    // ... other fields
)

suspend fun getDashboard(period: String, educationType: String): DashboardResponse {
    val response = apiService.getDashboardStats(period, educationType)
    return response.data
}
```

### iOS (Swift)

```swift
struct DashboardResponse: Codable {
    let userStatistics: UserStatistics
    let activeCourses: KPI
    // ... other fields
}

func fetchDashboard(period: String, educationType: String) async throws -> DashboardResponse {
    let url = URL(string: "http://api.example.com/api/dashboard/statistics?period=\(period)&educationType=\(educationType)")!
    let (data, _) = try await URLSession.shared.data(from: url)
    return try JSONDecoder().decode(APIResponse<DashboardResponse>.self, from: data).data
}
```

## 🔄 Real-time Updates (Optional)

### Polling Strategy

```javascript
// Refresh dashboard every 5 minutes
useEffect(() => {
  const interval = setInterval(() => {
    fetchDashboard();
  }, 5 * 60 * 1000); // 5 minutes

  return () => clearInterval(interval);
}, []);
```

### WebSocket (Future Enhancement)

```javascript
// Example WebSocket integration
const ws = new WebSocket("ws://localhost:8080/dashboard-updates");
ws.onmessage = (event) => {
  const updatedStats = JSON.parse(event.data);
  setStats(updatedStats);
};
```

## 🧪 Testing Checklist

- [ ] Health endpoint returns 200
- [ ] MONTH period returns data
- [ ] WEEK period returns data
- [ ] YEAR period returns data
- [ ] CUSTOM period with valid dates works
- [ ] Growth rates calculate correctly
- [ ] Unauthorized request returns 401/403
- [ ] All KPIs have non-null values

## 📚 Additional Resources

- **Full Documentation**: See `DASHBOARD_README.md`
- **Testing Guide**: See `DASHBOARD_TESTING.md`
- **Architecture**: See `DASHBOARD_ARCHITECTURE.md`
- **Summary**: See `DASHBOARD_SUMMARY.md`

## 🆘 Getting Help

1. Check the error logs in console
2. Verify database connection
3. Ensure migrations ran successfully
4. Review the comprehensive documentation files
5. Contact the development team

---

**Ready to go!** Start with the health check endpoint, then move to basic queries, and finally integrate into your frontend. 🚀
