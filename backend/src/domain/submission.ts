const MS_PER_HOUR = 3_600_000;
export type SubmissionTiming = "ON_TIME" | "LATE";
export type SubmissionStatus = "NOT_SUBMITTED" | "SUBMITTED_ON_TIME" | "SUBMITTED_LATE";

/** Submitting exactly at the deadline counts as on time. */
export function evaluateSubmission(due: Date, submittedAt: Date): { timing: SubmissionTiming; lateByHours: number } {
  const lateMs = submittedAt.getTime() - due.getTime();
  return lateMs <= 0
    ? { timing: "ON_TIME", lateByHours: 0 }
    : { timing: "LATE", lateByHours: Math.ceil(lateMs / MS_PER_HOUR) };
}

const STATUS_BY_TIMING: Record<SubmissionTiming, SubmissionStatus> = {
  ON_TIME: "SUBMITTED_ON_TIME",
  LATE: "SUBMITTED_LATE",
};

/** Derived only from submittedAt, so completing a task never counts as submitting it. */
export function submissionStatus(t: { dueDate: Date; submittedAt?: Date | null }): SubmissionStatus {
  return t.submittedAt ? STATUS_BY_TIMING[evaluateSubmission(t.dueDate, t.submittedAt).timing] : "NOT_SUBMITTED";
}
