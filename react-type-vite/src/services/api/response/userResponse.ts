interface UserResponse {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  dob: string;
  roles: string[];
}

export type { UserResponse };
