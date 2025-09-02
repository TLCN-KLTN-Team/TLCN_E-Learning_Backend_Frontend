export const UserRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  TRAINING_UNIT: "ADMIN",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
  USER: "USER",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
