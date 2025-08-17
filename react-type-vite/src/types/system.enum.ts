export const UserRole = {
  USER: "USER",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
  TRAINING_UNIT: "TRAINING_UNIT",
  ADMIN: "ADMIN",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
