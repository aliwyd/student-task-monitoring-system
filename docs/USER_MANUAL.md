# Taskwell — User Manual

## 1. Purpose

Taskwell helps students organize assignments and projects by class, follow deadlines, record submissions, and monitor progress. This application is a **tracking tool**, not an official university learning management system (LMS).

## 2. Before using the system

You need a working local backend and frontend, a modern browser, and a registered user account. For complete installation instructions, follow the **Quick start** in the root `README.md`.

On Windows, first verify the backend from the project root:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\verify-on-windows.ps1
```

Then install the frontend with `cd frontend; npm install`, start `npm run dev` in separate backend and frontend terminals, and open `http://localhost:5173`.

## 3. Register and sign in

1. On the sign-in page, click **Create an account**.
2. Enter your full name, a valid email address, and an 8–72 character password with a letter and a number.
3. Click **Create my account**. You are taken to the dashboard.
4. On subsequent visits, sign in with your email and password.
5. Use **Sign out** from the navigation to clear your browser's login cookie.

## 4. Main pages (10 routes)

| Page | Route | What you can do |
|---|---|---|
| Login | `/login` | Sign into an existing account |
| Register | `/register` | Create an account |
| Overview | `/dashboard` | Review tasks, deadlines, recent activity and weekly progress |
| My tasks | `/tasks` | Add, edit, delete, search, filter, sort and update tasks |
| Subjects | `/subjects` | Manage courses, their colors and details |
| Calendar | `/calendar` | Browse deadline dates and tasks by day |
| Submissions | `/submissions` | Submit completed tasks and review timing |
| Notifications | `/notifications` | View active deadline/completion alerts and mark them read |
| Reports | `/reports` | Review progress and download CSV |
| Settings | `/settings` | Update account details and change password |

## 5. Add a subject

Open **Subjects** and choose **Add subject**. Enter the subject name (required), optional course code/description, and a color. Save it to view its progress card. Use the pencil icon to edit or the trash icon to delete. **Deleting a subject does not delete its tasks**; they become unassigned.

## 6. Create and manage tasks

Open **My tasks** and click **New task**. Enter a title and due date/time (both required); optionally add a description, subject, priority and notes. Save the task. Use filters at the top of the task table for status, priority, subject, text search and due-date sort.

Use **Move to…** to update a task's status. The allowed sequence is:

```text
PENDING <-> IN_PROGRESS
   |           |
   +----> COMPLETED ----> SUBMITTED (through Submissions)
                |
                +----> IN_PROGRESS (reopen)
```

`SUBMITTED` is final. The pencil icon edits a task; the trash icon deletes it (along with associated submission details). A completed task will appear as ready on the Submissions page.

## 7. Record a submission

1. First mark the task **Completed** in My tasks.
2. Open **Submissions** and select **Ready to submit**.
3. Click **Submit** beside the task. Optionally add an HTTP/HTTPS link to your work and remarks.
4. Click **Confirm submission**. The system records the time and marks the task `SUBMITTED`.
5. Later, use the pencil icon to change the submission link or remarks. The original timestamp does not change.

The **On time** label means submitted at or before the stored due instant. **Late** means after that instant; hours late are rounded up to whole hours. The app does not upload files, send them to a professor, or confirm that an LMS accepted the work.

## 8. Calendar, notifications and reports

**Calendar:** use previous/next month arrows, select a day, and inspect the tasks due then. Colored dots are associated with subject colors.

**Notifications:** opening the page triggers checks for tasks that are overdue, due soon or recently completed. Mark a notification read to remove its unread count. These are in-app alerts only; there is no scheduled push/email reminder when the page is closed.

**Reports:** see completion rates (completed plus submitted), eight weeks of task creation/completion, progress by subject, and separate on-time/late submission metrics. **Export CSV** downloads a `tasks.csv` file for spreadsheet tools; user-supplied formula-like text is escaped by the backend.

## 9. Account settings and dark mode

In **Settings**, change your name or email and save. Change your password with your current password, new password and confirmation. To switch appearance, use the sun/moon control in the navigation/top bar. Theme choice is saved **only in the current browser**.

## 10. Common problems

| Problem | What to check |
|---|---|
| Browser says it cannot reach the API | Both `npm run dev` processes should be running; ports 4000/5173 should be free |
| Prisma reports a missing table | Run `scripts\verify-on-windows.ps1` from the project root to generate/apply migrations |
| Registration fails | Confirm name, valid unique email and password with at least 8 characters, a letter and number |
| Task cannot be submitted | Set its status to `COMPLETED` first; a previously submitted task cannot be submitted again |
| Unable to mark task submitted using Move to | Use the dedicated **Submissions** page |
| A deadline looks different by one day | Due times are stored as UTC instants, and the browser displays local times (e.g., Philippine time) |
| No notification appeared while app was closed | Alerts are calculated when the notifications endpoint is opened, not in the background |
| Changes vanish after reinstall | Protect `backend/prisma/dev.db` and `.env` during backups; a newly created database is empty |

## 11. Data safety

Do not share your passwords, `backend/.env`, `backend/prisma/*.db`, or Postman exports containing live tokens. Back up the project folder and database before replacing files. For submitting coursework, always check the official class/LMS instructions separately.
