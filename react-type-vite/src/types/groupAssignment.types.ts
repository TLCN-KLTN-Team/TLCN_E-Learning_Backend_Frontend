export const GroupAssignmentStatus = {
  SUBMISSION: "SUBMISSION",
  CROSS_REVIEW: "CROSS_REVIEW",
  COLLECTING: "COLLECTING",
  COMPLETED: "COMPLETED",
  NO_SUBMISSION: "NO_SUBMISSION",
  NO_PEERS: "NO_PEERS",
} as const;

export type GroupAssignmentStatus =
  (typeof GroupAssignmentStatus)[keyof typeof GroupAssignmentStatus];

export interface GroupAssignmentResponse {
  id: number;
  sessionId: string;
  channelId: string;
  classId: number;
  courseId: number;
  title: string;
  description: string;
  submissionDeadline: string | null;
  crossReviewDeadline: string | null;
  maxScore: number;
  status: GroupAssignmentStatus;
  finalScore: number | null;
  evaluations: string[];
}
