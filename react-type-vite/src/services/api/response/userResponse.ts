import type { AccountStatus } from "@/types/account.enum";

interface UserResponse {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  dob: string;
  roles: string[];
  accountStatus: AccountStatus;
}

export type { UserResponse };
