# Team Agent Assignment Implementation

This document describes the frontend implementation of the team-agent assignment functionality that integrates with the backend API.

## Overview

The implementation allows users to create teams and assign multiple agents to those teams with specific roles, permissions, and metadata in a single form submission.

## Key Components

### 1. Updated Types (`src/redux/team/teamTypes.tsx`)

- **`TeamAgent`**: Interface for team-agent relationship data
- **`AgentRef`**: Interface for agent references in team responses
- **`CreateTeamWithAgentsDto`**: DTO for creating teams with agent assignments
- **Updated `Team`**: Extended to include agent-related fields

### 2. Service Layer (`src/services/teamService.tsx`)

- **`createTeamWithAgents`**: New function to call the `/teams/with-agents` endpoint

### 3. Redux Integration (`src/redux/team/teamSlice.tsx`)

- **`createNewTeamWithAgents`**: New async thunk for team creation with agents
- Updated state management to handle the new action

### 4. Agent Selection Component (`src/components/Molecules/AgentSelection.tsx`)

A comprehensive component that provides:
- Multi-select agent functionality
- Role assignment (member, lead, developer, tester, admin, manager)
- Permission management (read, write, admin, deploy, manage)
- Level assignment (junior, mid-level, senior, lead)
- Remarks for each agent
- Expandable configuration panels
- Selected agents summary

### 5. Updated Add Team Form (`src/pages/Dashboard/Team/AddTeam.tsx`)

- Integrated the new `AgentSelection` component
- Updated to use `CreateTeamWithAgentsDto` type
- Added team hash generation
- Uses the new `createNewTeamWithAgents` action

## Usage Example

```typescript
// The form automatically handles agent selection and configuration
const teamData = {
  name: "Development Team Alpha",
  email: "dev-alpha@company.com",
  phone_number: "+1234567890",
  address_line1: "123 Main St",
  city: "New York",
  status: "Active",
  description: "Main development team for core features",
  remarks: "High priority team",
  application_id: 1,
  agents: [
    {
      agent_id: 1,
      roles: "team_lead,developer",
      data: JSON.stringify({
        level: "senior",
        permissions: ["admin", "deploy"]
      }),
      remarks: "Senior team lead with 5+ years experience"
    },
    {
      agent_id: 2,
      roles: "developer",
      data: JSON.stringify({
        level: "mid",
        permissions: ["read", "write"]
      }),
      remarks: "Full-stack developer"
    }
  ]
};
```

## Features

### Agent Selection
- Checkbox-based multi-select interface
- Real-time agent list with names and details
- Expandable configuration for each selected agent

### Role Management
- Predefined role options: member, lead, developer, tester, admin, manager
- Custom role support through the roles field

### Permission System
- Granular permission control: read, write, admin, deploy, manage
- Multiple permissions per agent
- Visual checkbox interface

### Level Assignment
- Junior, mid-level, senior, lead levels
- Stored in the data field as JSON

### Metadata Support
- Remarks field for additional notes
- JSON data field for custom metadata
- Flexible structure for future extensions

## API Integration

The frontend sends data to the backend endpoint `POST /teams/with-agents` with the following structure:

```json
{
  "name": "Team Name",
  "email": "team@example.com",
  "phone_number": "+1234567890",
  "address_line1": "123 Main St",
  "city": "New York",
  "status": "Active",
  "hash": "generated-hash",
  "description": "Team description",
  "remarks": "Additional remarks",
  "application_id": 1,
  "agents": [
    {
      "agent_id": 1,
      "roles": "lead,developer",
      "data": "{\"level\": \"senior\", \"permissions\": [\"admin\", \"deploy\"]}",
      "remarks": "Team leader"
    }
  ]
}
```

## Error Handling

The implementation includes comprehensive error handling:
- Form validation
- API error responses
- Loading states
- User feedback

## Styling

The components use the existing design system:
- Tailwind CSS classes
- Consistent with existing form components
- Responsive design
- Accessible interface

## Testing

To test the implementation:

1. Navigate to the "Add Team" page
2. Fill in the basic team information
3. Select agents from the available list
4. Configure roles, permissions, and other details for each agent
5. Submit the form
6. Verify the team is created with agent assignments

## Future Enhancements

Potential improvements:
- Bulk agent operations
- Agent search and filtering
- Role templates
- Permission inheritance
- Team hierarchy support
- Agent availability status








