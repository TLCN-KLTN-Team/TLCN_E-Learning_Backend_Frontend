export const unitStatus = (status: string) => {
  switch (status.toUpperCase()) {
    case "ACTIVE":
      return "Đang hoạt động";
    case "PENDING":
      return "Chờ duyệt";
    case "REJECTED":
      return "Bị từ chối";
    case "SUSPENDED":
      return "Tạm dừng";
    default:
      return status;
  }
};

export const getStatusStyle = (status: string) => {
  switch (status.toUpperCase()) {
    case "ACTIVE":
      return "bg-green-100 text-green-800";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    case "REJECTED":
      return "bg-red-100 text-red-800";
    case "SUSPENDED":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getUnitTypeLabel = (type: string): string => {
  switch (type?.toUpperCase()) {
    case "UNIVERSITY":
      return "Đại học";
    case "COLLEGE":
      return "Cao đẳng";
    case "INTERMEDIATE":
      return "Trung cấp";
    default:
      return type || "—";
  }
};

export const getUnitTypeStyle = (type: string): string => {
  switch (type?.toUpperCase()) {
    case "UNIVERSITY":
      return "bg-blue-100 text-blue-800 border border-blue-200";
    case "COLLEGE":
      return "bg-violet-100 text-violet-800 border border-violet-200";
    case "INTERMEDIATE":
      return "bg-teal-100 text-teal-800 border border-teal-200";
    default:
      return "bg-gray-100 text-gray-600 border border-gray-200";
  }
};

export const unitData = [
  {
    id: 1,
    name: "Trung tâm Công nghệ Thông tin",
    code: "CNTT001",
    status: "active",
    students: 1250,
    courses: 45,
    revenue: 2500000,
    representative: "Nguyễn Văn Anh",
    email: "cntt@university.edu.vn",
    type: "Trung tâm đào tạo",
    phone: "024.1234.5678",
    address: "123 Đường Láng, Đống Đa, Hà Nội",
    establishedDate: "2015-03-15",
    documents: [
      {
        name: "Giấy phép hoạt động",
        status: "approved",
        url: "/documents/license1.pdf",
      },
      {
        name: "Bằng cấp đại diện",
        status: "approved",
        url: "/documents/degree1.pdf",
      },
      {
        name: "Chứng chỉ ISO",
        status: "pending",
        url: "/documents/iso1.pdf",
      },
    ],
  },
  {
    id: 2,
    name: "Học viện Kinh doanh",
    code: "KD002",
    status: "pending",
    students: 890,
    courses: 32,
    revenue: 1800000,
    representative: "Trần Thị Bình",
    email: "kinhdoanh@business.edu.vn",
    type: "Học viện",
    phone: "028.9876.5432",
    address: "456 Nguyễn Huệ, Quận 1, TP.HCM",
    establishedDate: "2018-07-20",
    documents: [
      {
        name: "Giấy phép hoạt động",
        status: "approved",
        url: "/documents/license2.pdf",
      },
      {
        name: "Bằng cấp đại diện",
        status: "approved",
        url: "/documents/degree2.pdf",
      },
      {
        name: "Báo cáo tài chính",
        status: "pending",
        url: "/documents/financial2.pdf",
      },
    ],
  },
  {
    id: 3,
    name: "Trường Ngoại ngữ",
    code: "NN003",
    status: "suspended",
    students: 650,
    courses: 28,
    revenue: 1200000,
    representative: "Lê Văn Cường",
    email: "ngoaingu@language.edu.vn",
    type: "Trường đào tạo",
    phone: "0236.555.1234",
    address: "789 Trần Phú, Hải Châu, Đà Nẵng",
    establishedDate: "2020-01-10",
    documents: [
      {
        name: "Giấy phép hoạt động",
        status: "expired",
        url: "/documents/license3.pdf",
      },
      {
        name: "Bằng cấp đại diện",
        status: "approved",
        url: "/documents/degree3.pdf",
      },
      {
        name: "Chứng nhận chất lượng",
        status: "rejected",
        url: "/documents/quality3.pdf",
      },
    ],
  },
  {
    id: 4,
    name: "Viện Thiết kế Đồ họa",
    code: "DH004",
    status: "reject",
    students: 420,
    courses: 18,
    revenue: 950000,
    representative: "Phạm Thị Dung",
    email: "thietke@design.edu.vn",
    type: "Viện nghiên cứu",
    phone: "0274.777.8888",
    address: "321 Lê Lợi, Ninh Kiều, Cần Thơ",
    establishedDate: "2021-09-05",
    documents: [
      {
        name: "Giấy phép hoạt động",
        status: "rejected",
        url: "/documents/license4.pdf",
      },
      {
        name: "Bằng cấp đại diện",
        status: "pending",
        url: "/documents/degree4.pdf",
      },
      {
        name: "Portfolio mẫu",
        status: "approved",
        url: "/documents/portfolio4.pdf",
      },
    ],
  },
];
