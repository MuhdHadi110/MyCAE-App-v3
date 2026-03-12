# MyCaeTracker Project Context

## Current Feature: Project Team Management

### Goal
Implement a comprehensive Project Team feature that allows:
1. Assigning multiple engineers to projects (Lead + Contributors)
2. Manager visibility into who is available vs assigned to projects
3. Improved Team Workload dashboard showing all engineers with their assignment status

### Key Decisions
- **Keep timesheets unchanged**: Any engineer can still log time to any project
- **Lead Engineer via dropdown only**: Not through team member promotion
- **Team roles**: 'lead_engineer' and 'engineer' only
- **Remove "Make Lead" button**: From engineer cards in team list
- **Workload visibility**: Show ALL engineers (assigned + available) with clear status indicators
- **Filter options**: All / Assigned / Available engineers
- **Availability calculation**: Only count active (non-completed) projects - engineers with only completed projects are "Available"

### Discoveries
- The existing timesheet system already supports multiple engineers per project
- Project team data is stored in new `project_team_members` table
- The API returns team member data with `name`, `email`, `avatar` fields directly (not nested under `user`)
- Current Team Workload only shows engineers with active assignments, missing available engineers
- Engineers with 0 project assignments should be marked as "Available" for new work
- Projects are marked as 'completed' when 100% invoiced (automatic) or manually set (project.routes.ts)
- ProjectTeamMember records persist after project completion (historical data preserved)

## Completed Work

### Database & Backend
- Migration: `1770800000000-CreateProjectTeamMembers.ts`
- Entity: `ProjectTeamMember.ts`
- API routes: `projectTeam.routes.ts` (GET, POST, PUT, DELETE)
- Updated `database.ts` and `server.ts`

### Frontend - Project Team Management
- Service: `projectTeam.service.ts`
- Component: `ProjectTeam.tsx` with add/remove functionality
- Updated `EditProjectModal.tsx` with team section
- Updated `ProjectDetailModal.tsx` with team display
- Created `Avatar.tsx` component

### Team Workload Dashboard
- Updated `TeamWorkloadHeatmap.tsx` to show all engineers with availability status
- Filter options: All / Assigned / Available
- Statistics cards showing total, assigned, available, and total assignments
- Expandable rows to view project details per engineer
- Fixed TypeScript errors (removed `user` property references)
- **Availability Logic**: Engineers are "Available" when they have 0 active projects (completed projects excluded)
- **Action Column Removed**: Clean interface focused on workload visibility

### Bug Fixes
- Fixed engineer name showing as "Unknown" in dropdown
- Removed "Make Lead" button from engineer cards
- Removed "Lead Engineer" radio option from add member modal

## Relevant Files

### Backend
- `backend/src/migrations/1770800000000-CreateProjectTeamMembers.ts`
- `backend/src/entities/ProjectTeamMember.ts`
- `backend/src/routes/projectTeam.routes.ts`
- `backend/src/config/database.ts`
- `backend/src/server.ts`

### Frontend Services
- `src/services/projectTeam.service.ts`

### Frontend Components
- `src/components/projects/ProjectTeam.tsx`
- `src/components/modals/EditProjectModal.tsx`
- `src/components/modals/ProjectDetailModal.tsx`
- `src/components/charts/TeamWorkloadHeatmap.tsx`
- `src/components/ui/Avatar.tsx`

### Types
- `src/types/team.types.ts`
- `src/types/project.types.ts`

## Verification Steps
- TypeScript build: `npx tsc -b` ✓ (passed)
- Lint: `npm run lint` ✓ (passed - only pre-existing backend/dist errors)

## Implementation Complete

The Project Team feature is complete. The Team Workload Heatmap now shows:
1. All engineers with their availability status
2. Filterable by All / Assigned / Available
3. Expandable project details for each engineer (active projects only)
4. Engineers with only completed projects appear as "Available"

### Key Behavior
When a project is 100% invoiced or marked as completed:
- Engineers assigned only to that project automatically become "Available"
- The project assignment record is preserved (for historical data)
- Completed projects are excluded from the availability calculation
