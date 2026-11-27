export function evaluateSubmission(due: Date, submittedAt: Date) {
  const late = submittedAt.getTime() - due.getTime();
  if (late <= 0) return { timing: "ON_TIME" as const, lateByHours: 0 };
  return { timing: "LATE" as const, lateByHours: Math.ceil(late / 3600000) };
}
export function submissionStatus(t: { dueDate: Date; submittedAt?: Date | null }) {
  if (!t.submittedAt) return "NOT_SUBMITTED" as const;
  return evaluateSubmission(t.dueDate, t.submittedAt).timing === "ON_TIME" ? ("SUBMITTED_ON_TIME" as const) : ("SUBMITTED_LATE" as const);
}
