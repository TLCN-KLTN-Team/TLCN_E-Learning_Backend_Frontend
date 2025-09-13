import { useState } from "react";
import { useTheme } from "@/context/theme-context/useTheme";
import {
  SmartBreadcrumb,
  createCustomBreadcrumbs,
} from "@/components/shared/navigation";
import {
  UserIcon,
  AcademicCapIcon,
  CogIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

const BreadcrumbDemo = () => {
  const { resolvedTheme } = useTheme();
  const [selectedDemo, setSelectedDemo] = useState("student-profile-edit");

  const demos = {
    "student-profile-edit": {
      title: "Student Profile Edit",
      description: "Auto-generated breadcrumb for student profile edit page",
      component: (
        <SmartBreadcrumb
          currentPath="/student/profile/edit"
          homePath="/student"
        />
      ),
    },
    "student-dashboard": {
      title: "Student Dashboard",
      description: "Breadcrumb for student dashboard",
      component: (
        <SmartBreadcrumb currentPath="/student/dashboard" homePath="/student" />
      ),
    },
    "student-courses": {
      title: "Student Courses",
      description: "Breadcrumb for student courses page",
      component: (
        <SmartBreadcrumb currentPath="/student/courses" homePath="/student" />
      ),
    },
    "custom-breadcrumb": {
      title: "Custom Breadcrumb",
      description: "Manually created breadcrumb with custom items",
      component: (
        <SmartBreadcrumb
          currentPath="/custom"
          customItems={createCustomBreadcrumbs([
            {
              label: "Dashboard",
              href: "/student",
              icon: <AcademicCapIcon className="h-4 w-4" />,
            },
            {
              label: "Courses",
              href: "/student/courses",
              icon: <AcademicCapIcon className="h-4 w-4" />,
            },
            {
              label: "Advanced React",
              href: "/student/courses/react",
              icon: <DocumentTextIcon className="h-4 w-4" />,
            },
            {
              label: "Lesson 5",
              isActive: true,
              icon: <DocumentTextIcon className="h-4 w-4" />,
            },
          ])}
        />
      ),
    },
    "long-path": {
      title: "Long Path (Truncated)",
      description: "Demonstrates breadcrumb truncation for long paths",
      component: (
        <SmartBreadcrumb
          currentPath="/custom"
          maxItems={4}
          customItems={createCustomBreadcrumbs([
            { label: "Home", href: "/student" },
            { label: "Courses", href: "/student/courses" },
            { label: "Web Development", href: "/student/courses/web-dev" },
            {
              label: "Frontend Frameworks",
              href: "/student/courses/web-dev/frontend",
            },
            {
              label: "React.js",
              href: "/student/courses/web-dev/frontend/react",
            },
            {
              label: "Advanced Hooks",
              href: "/student/courses/web-dev/frontend/react/hooks",
            },
            { label: "useEffect Deep Dive", isActive: true },
          ])}
        />
      ),
    },
  };

  return (
    <div
      className={`min-h-screen p-6 lg:p-12 ${
        resolvedTheme === "dark" ? "bg-slate-900" : "bg-slate-50"
      }`}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        <div
          className={`${
            resolvedTheme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          <h1 className="text-3xl font-bold mb-4">
            Breadcrumb Navigation Examples
          </h1>
          <p className="text-lg mb-8 opacity-80">
            Demonstrating modern breadcrumb navigation patterns for the
            E-Learning platform
          </p>
        </div>

        {/* Demo Selector */}
        <div className="flex flex-wrap gap-2 mb-8">
          {Object.entries(demos).map(([key, demo]) => (
            <button
              key={key}
              onClick={() => setSelectedDemo(key)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                ${
                  selectedDemo === key
                    ? resolvedTheme === "dark"
                      ? "bg-blue-600 text-white"
                      : "bg-blue-500 text-white"
                    : resolvedTheme === "dark"
                    ? "bg-slate-800 text-gray-300 hover:bg-slate-700"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                }
              `.trim()}
            >
              {demo.title}
            </button>
          ))}
        </div>

        {/* Selected Demo */}
        <div
          className={`
            p-6 rounded-lg border
            ${
              resolvedTheme === "dark"
                ? "bg-slate-800 border-slate-700 text-white"
                : "bg-white border-gray-200 text-gray-900"
            }
          `.trim()}
        >
          <h2 className="text-xl font-semibold mb-2">
            {demos[selectedDemo as keyof typeof demos].title}
          </h2>
          <p className="mb-6 opacity-80">
            {demos[selectedDemo as keyof typeof demos].description}
          </p>

          {/* Breadcrumb Demo */}
          <div
            className={`
              p-4 rounded-md border-2 border-dashed
              ${
                resolvedTheme === "dark"
                  ? "border-slate-600 bg-slate-900/50"
                  : "border-gray-300 bg-gray-50"
              }
            `.trim()}
          >
            {demos[selectedDemo as keyof typeof demos].component}
          </div>
        </div>

        {/* Features Overview */}
        <div
          className={`
            grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
            ${resolvedTheme === "dark" ? "text-white" : "text-gray-900"}
          `.trim()}
        >
          <div
            className={`
              p-6 rounded-lg
              ${
                resolvedTheme === "dark"
                  ? "bg-slate-800 border border-slate-700"
                  : "bg-white border border-gray-200"
              }
            `.trim()}
          >
            <CogIcon className="h-8 w-8 text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Auto-Generation</h3>
            <p className="text-sm opacity-80">
              Breadcrumbs are automatically generated from route configuration
              and current path.
            </p>
          </div>

          <div
            className={`
              p-6 rounded-lg
              ${
                resolvedTheme === "dark"
                  ? "bg-slate-800 border border-slate-700"
                  : "bg-white border border-gray-200"
              }
            `.trim()}
          >
            <UserIcon className="h-8 w-8 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Icon Support</h3>
            <p className="text-sm opacity-80">
              Each breadcrumb item can display an icon based on its content type
              or function.
            </p>
          </div>

          <div
            className={`
              p-6 rounded-lg
              ${
                resolvedTheme === "dark"
                  ? "bg-slate-800 border border-slate-700"
                  : "bg-white border border-gray-200"
              }
            `.trim()}
          >
            <DocumentTextIcon className="h-8 w-8 text-purple-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Responsive Design</h3>
            <p className="text-sm opacity-80">
              Breadcrumbs adapt to different screen sizes and truncate long
              paths intelligently.
            </p>
          </div>
        </div>

        {/* Usage Examples */}
        <div
          className={`
            p-6 rounded-lg
            ${
              resolvedTheme === "dark"
                ? "bg-slate-800 border border-slate-700 text-white"
                : "bg-white border border-gray-200 text-gray-900"
            }
          `.trim()}
        >
          <h2 className="text-xl font-semibold mb-4">
            Implementation Examples
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-sm mb-2">
                1. Basic Usage (Auto-generated)
              </h3>
              <pre
                className={`
                  text-xs p-3 rounded overflow-x-auto
                  ${
                    resolvedTheme === "dark"
                      ? "bg-slate-900 text-green-400"
                      : "bg-gray-100 text-gray-800"
                  }
                `.trim()}
              >
                {`<SmartBreadcrumb 
  currentPath="/student/profile/edit"
  homePath="/student"
/>`}
              </pre>
            </div>

            <div>
              <h3 className="font-medium text-sm mb-2">2. Custom Items</h3>
              <pre
                className={`
                  text-xs p-3 rounded overflow-x-auto
                  ${
                    resolvedTheme === "dark"
                      ? "bg-slate-900 text-green-400"
                      : "bg-gray-100 text-gray-800"
                  }
                `.trim()}
              >
                {`<SmartBreadcrumb 
  currentPath="/custom"
  customItems={createCustomBreadcrumbs([
    { label: 'Dashboard', href: '/student' },
    { label: 'Courses', href: '/student/courses' },
    { label: 'Current Page', isActive: true }
  ])}
/>`}
              </pre>
            </div>

            <div>
              <h3 className="font-medium text-sm mb-2">
                3. With Configuration
              </h3>
              <pre
                className={`
                  text-xs p-3 rounded overflow-x-auto
                  ${
                    resolvedTheme === "dark"
                      ? "bg-slate-900 text-green-400"
                      : "bg-gray-100 text-gray-800"
                  }
                `.trim()}
              >
                {`<SmartBreadcrumb 
  currentPath="/student/profile/edit"
  maxItems={3}
  showHomeIcon={true}
  homePath="/student"
  className="mb-6"
/>`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreadcrumbDemo;
