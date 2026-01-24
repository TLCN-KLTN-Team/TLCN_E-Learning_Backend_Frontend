/**
 * CSV/XLSX Parser + Template utilities for teacher import
 */
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";

// Default password for CSV imports - from environment variable
const DEFAULT_USER_PASSWORD = import.meta.env.VITE_DEFAULT_USER_PASSWORD || "ChangeMe@123";

// Department mapping - will be built dynamically from API data
export let DEPARTMENT_MAP: Record<string, string> = {};

/**
 * Update department map with real data from API
 */
export const updateDepartmentMap = (
  departments: Array<{ id?: string | number; name?: string; departmentId?: string | number; departmentName?: string }>
): void => {
  DEPARTMENT_MAP = {};
  departments.forEach((dept) => {
    const deptName = (dept.name || dept.departmentName) as string;
    const deptId = String(dept.id || dept.departmentId);
    if (deptName && deptId) {
      DEPARTMENT_MAP[deptName] = deptId;
    }
  });
};

/**
 * Map department name to departmentId
 */
export const mapDepartmentNameToId = (departmentName: string): string | undefined => {
  if (!departmentName) return undefined;
  return DEPARTMENT_MAP[departmentName.trim()];
};

export interface CSVParseResult<T> {
  success: boolean;
  data?: T[];
  errors: string[];
  rowsProcessed: number;
}

/**
 * Parse CSV file and extract rows
 * @param file - CSV file to parse
 * @returns Promise with parsed data
 */
export const parseCSV = (file: File): Promise<string[][]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        let text = e.target?.result as string;

        // Remove BOM if present
        if (text.charCodeAt(0) === 0xFEFF) {
          text = text.slice(1);
        }

        // Split by line (handle both \r\n and \n)
        let rows = text.split("\r\n");
        if (rows.length === 1) {
          rows = text.split("\n");
        }
        rows = rows.filter((row) => row.trim());

        const splitWithDelimiter = (row: string, delimiter: string): string[] => {
          const result: string[] = [];
          let current = "";
          let inQuotes = false;

          for (let i = 0; i < row.length; i++) {
            const char = row[i];
            const nextChar = row[i + 1];

            if (char === '"') {
              if (inQuotes && nextChar === '"') {
                current += '"';
                i++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if (!inQuotes && row.startsWith(delimiter, i)) {
              result.push(current.trim());
              current = "";
              i += delimiter.length - 1; // Skip delimiter chars
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        // Detect delimiter from header row: prefer tab, then semicolon, then comma
        const header = rows[0] || "";
        const delimiter = header.includes("\t")
          ? "\t"
          : header.includes(";")
            ? ";"
            : ",";

        const data: string[][] = rows.map((row) => splitWithDelimiter(row, delimiter));

        resolve(data);
      } catch (error) {
        reject(new Error("Failed to parse CSV file"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsText(file);
  });
};

/**
 * Parse XLSX file and return rows as string[][] (first row is headers)
 */
export const parseXLSX = async (file: File): Promise<string[][]> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  if (!sheet) return [];

  // Get 2D array (including headers)
  const aoa: any[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    blankrows: false,
    defval: "",
  });
  return aoa.map((row) => row.map((v) => String(v ?? "").trim()));
};

/**
 * Parse file (CSV or XLSX). Auto-detect by extension/MIME.
 */
export const parseSpreadsheet = (file: File): Promise<string[][]> => {
  const name = file.name.toLowerCase();
  const type = file.type;
  const isXlsx =
    name.endsWith(".xlsx") ||
    type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (!isXlsx) {
    return Promise.reject(new Error("Chỉ hỗ trợ file Excel (.xlsx)"));
  }
  return parseXLSX(file);
};

/**
 * Validate teacher data
 */
export interface TeacherImportData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  teacherId: string;
  password?: string;
  dob?: string;
  departmentId?: string; // Will be resolved from department name
  department?: string; // Department name from dropdown
  description?: string;
  bankAccountNumber?: string;
}

/**
 * Validate expert data
 */
export interface ExpertImportData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  expertId: string;
  password?: string;
  dob?: string;
  description?: string;
  phoneNumber?: string;
  bio?: string;
}

/**
 * Validate student data
 */
export interface StudentImportData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  studentId: string;
  password?: string;
  dob?: string;
  departmentId?: string; // Will be resolved from department name
  department?: string; // Department name from dropdown
  description?: string;
  className?: string;
}

/**
 * Validate class data
 */
export interface ClassImportData {
  className: string;
  classCode: string;
  maxStudents?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

// Normalize header to map Vietnamese labels to canonical keys
const normalizeHeader = (header: string): string => {
  if (!header) return "";

  // Vietnamese character mapping
  const vietnameseMap: Record<string, string> = {
    'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
    'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
    'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
    'đ': 'd',
    'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
    'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
    'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
    'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
    'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
    'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
    'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
    'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
  };

  return header
    .trim()
    .toLowerCase()
    .split('')
    .map(char => vietnameseMap[char] || char)
    .join('')
    .replace(/\s+/g, ' ')
    .replace(/[/\\]/g, ' '); // normalize slashes to space
};

const headerAliases: Record<string, string> = {
  username: "username",
  "ten dang nhap": "username",

  email: "email",

  firstname: "firstName",
  "ten": "firstName",

  lastname: "lastName",
  "ho": "lastName",

  teacherid: "teacherId",
  "ma giang vien": "teacherId",

  expertid: "expertId",
  "ma chuyen gia": "expertId",

  studentid: "studentId",
  "ma sinh vien": "studentId",

  password: "password",
  "mat khau": "password",

  dob: "dob",
  "ngay sinh": "dob",

  department: "department",
  "khoa phong ban": "department",
  "khoa": "department",
  "phong ban": "department",

  departmentid: "departmentId",
  "ma khoa": "departmentId",

  description: "description",
  "mo ta": "description",

  bankaccountnumber: "bankAccountNumber",
  "so tai khoan": "bankAccountNumber",
  "so tai khoan ngan hang": "bankAccountNumber",

  phonenumber: "phoneNumber",
  "so dien thoai": "phoneNumber",

  bio: "bio",
  "tieu su": "bio",

  classname: "className",
  "lop": "className",
  "ten lop": "className",
  "ten lop hoc": "className",

  classcode: "classCode",
  "ma lop": "classCode",
  "ma lop hoc": "classCode",

  maxstudents: "maxStudents",
  "si so": "maxStudents",
  "si so toi da": "maxStudents",

  startdate: "startDate",
  "ngay bat dau": "startDate",

  enddate: "endDate",
  "ngay ket thuc": "endDate",
};

export const validateTeacherRow = (
  row: string[],
  headers: string[],
  rowIndex: number
): { isValid: boolean; data?: TeacherImportData; errors: string[] } => {
  const errors: string[] = [];
  const data: Record<string, string> = {};

  // Debug logging
  console.log(`Row ${rowIndex} validation - Headers:`, headers);
  console.log(`Row ${rowIndex} validation - Row data:`, row);

  // Map row data to headers
  row.forEach((value, index) => {
    if (index < headers.length) {
      const originalHeader = headers[index];
      const normalized = normalizeHeader(originalHeader);
      const canonical = headerAliases[normalized] || originalHeader;
      console.log(`Mapping: "${originalHeader}" -> normalized: "${normalized}" -> canonical: "${canonical}" = "${value}"`);
      data[canonical] = value;
    }
  });

  console.log(`Row ${rowIndex} - Mapped data:`, data);

  // Required field validation
  const required = ["username", "email", "firstName", "lastName", "teacherId"];

  required.forEach((field) => {
    if (!data[field] || !data[field].trim()) {
      errors.push(`Row ${rowIndex}: Field "${field}" is required`);
    }
  });

  // Email validation
  if (data["email"] && !isValidEmail(data["email"])) {
    errors.push(`Row ${rowIndex}: Invalid email format`);
  }

  // Username validation (alphanumeric and underscore)
  if (data["username"] && !/^[a-zA-Z0-9_]{3,}$/.test(data["username"])) {
    errors.push(`Row ${rowIndex}: Username must be 3+ characters (alphanumeric and underscore)`);
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    data: {
      username: data["username"],
      email: data["email"],
      firstName: data["firstName"],
      lastName: data["lastName"],
      teacherId: data["teacherId"],
      password: data["password"] || DEFAULT_USER_PASSWORD, // Default password from env
      dob: data["dob"] || undefined,
      department: data["department"] || undefined,
      departmentId: data["departmentId"] || undefined,
      description: data["description"] || undefined,
      bankAccountNumber: data["bankAccountNumber"] || undefined,
    },
    errors: [],
  };
};
export const validateExpertRow = (
  row: string[],
  headers: string[],
  rowIndex: number
): { isValid: boolean; data?: ExpertImportData; errors: string[] } => {
  const errors: string[] = [];
  const data: Record<string, string> = {};

  // Map row data to headers
  row.forEach((value, index) => {
    if (index < headers.length) {
      const originalHeader = headers[index];
      const normalized = normalizeHeader(originalHeader);
      const canonical = headerAliases[normalized] || originalHeader;
      data[canonical] = value;
    }
  });

  // Required field validation
  const required = ["username", "email", "firstName", "lastName", "expertId"];

  required.forEach((field) => {
    if (!data[field] || !data[field].trim()) {
      errors.push(`Row ${rowIndex}: Field "${field}" is required`);
    }
  });

  // Email validation
  if (data["email"] && !isValidEmail(data["email"])) {
    errors.push(`Row ${rowIndex}: Invalid email format`);
  }

  // Username validation (alphanumeric and underscore)
  if (data["username"] && !/^[a-zA-Z0-9_]{3,}$/.test(data["username"])) {
    errors.push(`Row ${rowIndex}: Username must be 3+ characters (alphanumeric and underscore)`);
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    data: {
      username: data["username"],
      email: data["email"],
      firstName: data["firstName"],
      lastName: data["lastName"],
      expertId: data["expertId"],
      password: data["password"] || DEFAULT_USER_PASSWORD, // Default password from env
      dob: data["dob"] || undefined,
      description: data["description"] || undefined,
      phoneNumber: data["phoneNumber"] || undefined,
      bio: data["bio"] || undefined,
    },
    errors: [],
  };
};

export const validateStudentRow = (
  row: string[],
  headers: string[],
  rowIndex: number
): { isValid: boolean; data?: StudentImportData; errors: string[] } => {
  const errors: string[] = [];
  const data: Record<string, string> = {};

  // Map row data to headers
  row.forEach((value, index) => {
    if (index < headers.length) {
      const originalHeader = headers[index];
      const normalized = normalizeHeader(originalHeader);
      const canonical = headerAliases[normalized] || originalHeader;
      data[canonical] = value;
    }
  });

  // Required field validation
  const required = ["username", "email", "firstName", "lastName", "studentId"];

  required.forEach((field) => {
    if (!data[field] || !data[field].trim()) {
      errors.push(`Row ${rowIndex}: Field "${field}" is required`);
    }
  });

  // Email validation
  if (data["email"] && !isValidEmail(data["email"])) {
    errors.push(`Row ${rowIndex}: Invalid email format`);
  }

  // Username validation (alphanumeric and underscore)
  if (data["username"] && !/^[a-zA-Z0-9_]{3,}$/.test(data["username"])) {
    errors.push(`Row ${rowIndex}: Username must be 3+ characters (alphanumeric and underscore)`);
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    data: {
      username: data["username"],
      email: data["email"],
      firstName: data["firstName"],
      lastName: data["lastName"],
      studentId: data["studentId"],
      password: data["password"] || DEFAULT_USER_PASSWORD, // Default password from env
      dob: data["dob"] || undefined,
      department: data["department"] || undefined,
      departmentId: data["departmentId"] || undefined,
      description: data["description"] || undefined,
      className: data["className"] || undefined,
    },
    errors: [],
  };
};

export const validateClassRow = (
  row: string[],
  headers: string[],
  rowIndex: number
): { isValid: boolean; data?: ClassImportData; errors: string[] } => {
  const errors: string[] = [];
  const data: Record<string, string> = {};

  row.forEach((value, index) => {
    if (index < headers.length) {
      const originalHeader = headers[index];
      const normalized = normalizeHeader(originalHeader);
      const canonical = headerAliases[normalized] || originalHeader;
      data[canonical] = value;
    }
  });

  const required = ["className", "classCode"];
  required.forEach((field) => {
    if (!data[field] || !data[field].trim()) {
      errors.push(`Row ${rowIndex}: Field "${field}" is required`);
    }
  });

  if (data["maxStudents"]) {
    const ms = parseInt(data["maxStudents"], 10);
    if (isNaN(ms) || ms < 1) {
      errors.push(`Row ${rowIndex}: maxStudents must be a positive number`);
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    data: {
      className: data["className"],
      classCode: data["classCode"],
      maxStudents: data["maxStudents"] || undefined,
      startDate: data["startDate"] || undefined,
      endDate: data["endDate"] || undefined,
      description: data["description"] || undefined,
    },
    errors: [],
  };
};
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate CSV template for teacher import
 */
export const generateTeacherImportTemplate = (): string => {
  const headers = [
    "username",
    "email",
    "firstName",
    "lastName",
    "teacherId",
    "password",
    "dob",
    "departmentId",
    "description",
    "socialUrl",
    "bankAccountNumber",
  ];

  // Use semicolon delimiter for better Excel compatibility in many locales
  const template = headers.join(";");
  const example = `john_doe;john.doe@example.com;John;Doe;T001;${DEFAULT_USER_PASSWORD};1990-01-15;1;"Senior Teacher";"https://example.com";`;

  // Use CRLF for line ending
  return `${template}\r\n${example}`;
};

/**
 * Download template as CSV file
 */
export const downloadTeacherTemplate = (): void => {
  const template = generateTeacherImportTemplate();

  // Prepend BOM to help Excel detect UTF-8, and keep .csv extension
  const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
  const blob = new Blob([bom, template], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "teacher_import_template.csv";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Download XLSX template with department dropdown using ExcelJS
 * @param departments - Array of departments from API
 */
export const downloadTeacherTemplateXLSX = async (
  departments: Array<{ id?: string | number; name?: string; departmentId?: string | number; departmentName?: string }> = []
): Promise<void> => {
  const workbook = new ExcelJS.Workbook();

  // Update department map with real data
  updateDepartmentMap(departments);

  // Create Teachers sheet
  const teachersSheet = workbook.addWorksheet("Teachers");

  // Add headers (Vietnamese display, canonical keys preserved via mapping)
  teachersSheet.columns = [
    { header: "Tên đăng nhập", key: "username", width: 18 },
    { header: "Email", key: "email", width: 28 },
    { header: "Tên", key: "firstName", width: 15 },
    { header: "Họ", key: "lastName", width: 15 },
    { header: "Mã giảng viên", key: "teacherId", width: 14 },
    { header: "Mật khẩu", key: "password", width: 15 },
    { header: "Ngày sinh", key: "dob", width: 15 },
    { header: "Khoa/Phòng ban", key: "department", width: 30 },
    { header: "Mô tả", key: "description", width: 20 },
    { header: "Số tài khoản ngân hàng", key: "bankAccountNumber", width: 26 },
  ];

  // Add example row
  const exampleDept = departments.length > 0 ? (departments[0].name || departments[0].departmentName) : "Khoa Công nghệ Thông tin";
  teachersSheet.addRow({
    username: "john_doe",
    email: "john.doe@example.com",
    firstName: "John",
    lastName: "Doe",
    teacherId: "T001",
    password: DEFAULT_USER_PASSWORD,
    dob: "1990-01-15",
    department: exampleDept,
    description: "Giảng viên cao cấp",
    bankAccountNumber: "",
  });

  // Create Departments reference sheet
  const deptSheet = workbook.addWorksheet("Departments");
  deptSheet.columns = [
    { header: "Mã phòng ban", key: "departmentId", width: 18 },
    { header: "Tên phòng ban", key: "departmentName", width: 32 },
  ];

  // Add real departments from API
  departments.forEach((dept) => {
    deptSheet.addRow({
      departmentId: dept.id || dept.departmentId,
      departmentName: dept.name || dept.departmentName,
    });
  });

  // Add data validation for department column (column H)
  const deptNames = departments.map((d) => (d.name || d.departmentName) as string).filter(Boolean);
  const deptDropdownFormula = deptNames.length ? `"${deptNames.join(",")}"` : undefined;

  // Add data validation for rows 2-1001
  for (let row = 2; row <= 1001; row++) {
    // Department dropdown (column H)
    const deptCell = teachersSheet.getCell(`H${row}`);
    if (deptDropdownFormula) {
      deptCell.dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [deptDropdownFormula],
        showErrorMessage: true,
        errorStyle: "error",
        errorTitle: "Giá trị không hợp lệ",
        error: "Vui lòng chọn department từ danh sách",
        showInputMessage: true,
        promptTitle: "Chọn Department",
        prompt: "Nhấn vào mũi tên để chọn department từ danh sách",
      };
    }

    // DOB formatting + gentle validation (column G)
    const dobCell = teachersSheet.getCell(`G${row}`);
    dobCell.numFmt = "yyyy-mm-dd";
    dobCell.dataValidation = {
      type: "date",
      operator: "between",
      allowBlank: true,
      formulae: ["1900-01-01", "9999-12-31"],
      showInputMessage: true,
      promptTitle: "Chọn ngày sinh",
      prompt: "Chọn từ lịch hoặc nhập YYYY-MM-DD",
    };
  }

  // Style headers
  teachersSheet.getRow(1).font = { bold: true };
  teachersSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  deptSheet.getRow(1).font = { bold: true };
  deptSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  // Generate buffer and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "teacher_import_template.xlsx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Download XLSX template for expert import
 */
export const downloadExpertTemplateXLSX = async (): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Experts");

  sheet.columns = [
    { header: "Tên đăng nhập", key: "username", width: 18 },
    { header: "Email", key: "email", width: 28 },
    { header: "Tên", key: "firstName", width: 15 },
    { header: "Họ", key: "lastName", width: 15 },
    { header: "Mã chuyên gia", key: "expertId", width: 14 },
    { header: "Mật khẩu", key: "password", width: 15 },
    { header: "Ngày sinh", key: "dob", width: 15 },
    { header: "Số điện thoại", key: "phoneNumber", width: 15 },
    { header: "Mô tả", key: "description", width: 20 },
    { header: "Tiểu sử", key: "bio", width: 20 },
  ];

  sheet.addRow({
    username: "alex_expert",
    email: "alex.expert@example.com",
    firstName: "Alex",
    lastName: "Taylor",
    expertId: "E001",
    password: DEFAULT_USER_PASSWORD,
    dob: "1985-05-20",
    phoneNumber: "0901234567",
    description: "Chuyên gia AI",
    bio: "Tiến sĩ KHMT",
  });

  for (let row = 2; row <= 1001; row++) {
    const dobCell = sheet.getCell(`G${row}`);
    dobCell.numFmt = "yyyy-mm-dd";
    dobCell.dataValidation = {
      type: "date",
      operator: "between",
      allowBlank: true,
      formulae: ["1900-01-01", "9999-12-31"],
      showInputMessage: true,
      promptTitle: "Chọn ngày sinh",
      prompt: "Chọn từ lịch hoặc nhập YYYY-MM-DD",
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "expert_import_template.xlsx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Download XLSX template for student import with department dropdown using ExcelJS
 * @param departments - Array of departments from API
 */
export const downloadStudentTemplateXLSX = async (
  departments: Array<{ id?: string | number; name?: string; departmentId?: string | number; departmentName?: string }> = []
): Promise<void> => {
  const workbook = new ExcelJS.Workbook();

  // Update department map with real data
  updateDepartmentMap(departments);

  // Create Students sheet
  const studentsSheet = workbook.addWorksheet("Students");

  // Add headers (Vietnamese display, canonical keys preserved via mapping)
  studentsSheet.columns = [
    { header: "Tên đăng nhập", key: "username", width: 18 },
    { header: "Email", key: "email", width: 28 },
    { header: "Tên", key: "firstName", width: 15 },
    { header: "Họ", key: "lastName", width: 15 },
    { header: "Mã sinh viên", key: "studentId", width: 14 },
    { header: "Mật khẩu", key: "password", width: 15 },
    { header: "Ngày sinh", key: "dob", width: 15 },
    { header: "Khoa/Phòng ban", key: "department", width: 30 },
    { header: "Mô tả", key: "description", width: 20 },
    { header: "Lớp", key: "className", width: 20 },
  ];

  // Add example row
  const exampleDept = departments.length > 0 ? (departments[0].name || departments[0].departmentName) : "Khoa Công nghệ Thông tin";
  studentsSheet.addRow({
    username: "jane_doe",
    email: "jane.doe@example.com",
    firstName: "Jane",
    lastName: "Doe",
    studentId: "S001",
    password: DEFAULT_USER_PASSWORD,
    dob: "2000-01-15",
    department: exampleDept,
    description: "Sinh viên xuất sắc",
    className: "CNTT-K15",
  });

  // Create Departments reference sheet
  const deptSheet = workbook.addWorksheet("Departments");
  deptSheet.columns = [
    { header: "Mã phòng ban", key: "departmentId", width: 18 },
    { header: "Tên phòng ban", key: "departmentName", width: 32 },
  ];

  // Add real departments from API
  departments.forEach((dept) => {
    deptSheet.addRow({
      departmentId: dept.id || dept.departmentId,
      departmentName: dept.name || dept.departmentName,
    });
  });

  // Add data validation for department column (column H)
  const deptNames = departments.map((d) => (d.name || d.departmentName) as string).filter(Boolean);
  const deptDropdownFormula = deptNames.length ? `"${deptNames.join(",")}"` : undefined;

  // Add data validation for rows 2-1001
  for (let row = 2; row <= 1001; row++) {
    // Department dropdown (column H)
    const deptCell = studentsSheet.getCell(`H${row}`);
    if (deptDropdownFormula) {
      deptCell.dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [deptDropdownFormula],
        showErrorMessage: true,
        errorStyle: "error",
        errorTitle: "Giá trị không hợp lệ",
        error: "Vui lòng chọn department từ danh sách",
        showInputMessage: true,
        promptTitle: "Chọn Department",
        prompt: "Nhấn vào mũi tên để chọn department từ danh sách",
      };
    }

    // DOB formatting + gentle validation (column G)
    const dobCell = studentsSheet.getCell(`G${row}`);
    dobCell.numFmt = "yyyy-mm-dd";
    dobCell.dataValidation = {
      type: "date",
      operator: "between",
      allowBlank: true,
      formulae: ["1900-01-01", "9999-12-31"],
      showInputMessage: true,
      promptTitle: "Chọn ngày sinh",
      prompt: "Chọn từ lịch hoặc nhập YYYY-MM-DD",
    };
  }

  // Style headers
  studentsSheet.getRow(1).font = { bold: true };
  studentsSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  deptSheet.getRow(1).font = { bold: true };
  deptSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  // Generate buffer and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "student_import_template.xlsx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Download XLSX template for class import
 */
export const downloadClassTemplateXLSX = async (): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Classes");

  sheet.columns = [
    { header: "Tên lớp học", key: "className", width: 22 },
    { header: "Mã lớp học", key: "classCode", width: 18 },
    { header: "Sĩ số tối đa", key: "maxStudents", width: 16 },
    { header: "Ngày bắt đầu", key: "startDate", width: 16 },
    { header: "Ngày kết thúc", key: "endDate", width: 16 },
    { header: "Mô tả", key: "description", width: 28 },
  ];

  sheet.addRow({
    className: "Lớp Sáng A",
    classCode: "CNTT101-A1",
    maxStudents: 30,
    startDate: "2026-02-01",
    endDate: "2026-06-01",
    description: "Lớp học buổi sáng cho khóa CNTT 101",
  });

  for (let row = 2; row <= 1001; row++) {
    const startCell = sheet.getCell(`D${row}`);
    startCell.numFmt = "yyyy-mm-dd";
    startCell.dataValidation = {
      type: "date",
      operator: "between",
      allowBlank: true,
      formulae: ["1900-01-01", "9999-12-31"],
      showInputMessage: true,
      promptTitle: "Chọn ngày bắt đầu",
      prompt: "Chọn từ lịch hoặc nhập YYYY-MM-DD",
    };

    const endCell = sheet.getCell(`E${row}`);
    endCell.numFmt = "yyyy-mm-dd";
    endCell.dataValidation = {
      type: "date",
      operator: "between",
      allowBlank: true,
      formulae: ["1900-01-01", "9999-12-31"],
      showInputMessage: true,
      promptTitle: "Chọn ngày kết thúc",
      prompt: "Chọn từ lịch hoặc nhập YYYY-MM-DD",
    };
  }

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "class_import_template.xlsx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
