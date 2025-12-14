export const AccountStatus = {
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  BANNED: "BANNED",
} as const;

export type AccountStatus =
  typeof AccountStatus[keyof typeof AccountStatus];

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  [AccountStatus.PENDING_VERIFICATION]: "Chờ xác thực",
  [AccountStatus.ACTIVE]: "Hoạt động",
  [AccountStatus.INACTIVE]: "Không hoạt động",
  [AccountStatus.BANNED]: "Bị khóa",
};

export const ACCOUNT_STATUS_COLORS: Record<AccountStatus, string> = {
  [AccountStatus.PENDING_VERIFICATION]: "bg-yellow-100 text-yellow-800",
  [AccountStatus.ACTIVE]: "bg-green-100 text-green-800",
  [AccountStatus.INACTIVE]: "bg-gray-100 text-gray-800",
  [AccountStatus.BANNED]: "bg-red-100 text-red-800",
};
