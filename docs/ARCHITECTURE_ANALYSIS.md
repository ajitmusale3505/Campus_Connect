# Campus Connect Architecture Analysis

This note documents the pre-implementation findings requested by the CMS upgrade specification.

## Current Stack

- Next.js 14 App Router with TypeScript and Tailwind CSS.
- MongoDB through Mongoose models in `src/models`.
- Cookie-based JWT authentication in `src/lib/auth.ts`.
- Role model currently uses `student`, `teacher`, `hod`, and `principal` as the admin-equivalent role.
- UI is built from local reusable components in `src/components` plus Radix/shadcn primitives.

## Existing API Surface

- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`.
- Users/profile: `/api/users`, `/api/users/profile`, `/api/users/change-password`, `/api/students`.
- Academics: `/api/curriculum`, `/api/materials`, `/api/assignments`, `/api/marks`.
- Operations: `/api/attendance`, `/api/notices`, `/api/events`, `/api/notifications`, `/api/upload`.
- Engagement/support: `/api/chat`, `/api/chat/[roomId]`, `/api/doubts`, `/api/grievances`, `/api/leaves`, `/api/escalations`, `/api/projects`, `/api/library`.
- Principal/admin: `/api/admin/stats`.

## Data Model Findings

- Existing models were feature-specific and did not yet represent the full SPPU hierarchy.
- `User` stored simple department/semester fields but did not include university, college, department, batch, subject, enrollment, QR, active, or verification references.
- `Attendance` stored simple user/date/subject data and had a user/date index, but not the subject/batch/teacher relationship or duplicate-prevention index required by the spec.
- `ChatMessage` already stored `isAnonymous`, but populated sender data was still returned by APIs.
- `Notice` was a close match for announcements, but needed college/department scope for future ticker and HOD filtering.

## Implemented Foundation

- Added SPPU hierarchy models: `University`, `College`, `Department`, `Subject`, and `Batch`.
- Extended `User`, `Attendance`, and `Notice` with backward-compatible fields from the upgrade specification.
- Added SPPU seed data helper for the university, five colleges, four branches, and all provided FE/CE/AIML/AIDS/ENTC subjects.
- Added master data endpoints:
  - `GET /api/universities`
  - `GET /api/colleges?universityId=`
  - `GET /api/departments?collegeId=`
  - `GET /api/subjects?departmentId=&collegeId=&branchCode=&year=&semester=`
- Fixed anonymous chat serialization so anonymous messages do not expose sender ids, names, emails, or real avatars.
- Added the announcement ticker to the top header using active notices with five-minute polling.

## Known Gaps For Later Phases

- Registration UI still needs the multi-step University -> College -> Department -> Year -> Semester flow.
- Student registration should generate QR codes and auto-assign batches once active batch creation exists.
- Dedicated `/api/attendance/scan`, `/api/attendance/manual`, and summary endpoints still need QR/session-token logic.
- Redis-backed attendance session tokens and aggregate caching are not yet implemented.
- HOD analytics and department-scoped curriculum management need deeper query updates across pages.
- Security hardening still needs rate limiting, request validation coverage, production CORS/helmet handling, and bcrypt cost review.

## Compatibility Notes

The schema changes were additive where possible so existing pages using simple fields like `department`, `semester`, `avatarUrl`, and `subject` continue to work while the richer SPPU hierarchy is introduced.
