# Team Agent Assignment Implementation Guide

This guide explains how to automatically assign agents to teams when creating a team from the frontend.

## Overview

When you submit the "add team" form from your frontend, the system will now automatically store the team-agent relationships in the `team_agent` table with proper role assignments.

**Key Features:**
- **Automatic Role Assignment**: Agents get `role_id: 2` (Agent) by default
- **Team Leader Support**: Use `role_id: 1` for team leadership positions
- **Role-based Structure**: Uses numeric role IDs instead of string-based roles
- **Rich Data**: Includes role details, team information, and agent metadata

## API Endpoints

### 1. Create Team with Agent Assignments
**Endpoint**: `POST /teams/with-agents`

**Request Body**:
```json
{
  "name": "Development Team Alpha",
  "email": "dev-alpha@company.com",
  "phone_number": "+1234567890",
  "address_line1": "123 Main St",
  "city": "New York",
  "status": "active",
  "hash": "team-alpha-hash-123",
  "description": "Main development team for core features",
  "remarks": "High priority team",
  "application_id": 1,
  "agents": [
    {
      "agent_id": 1,
      "role_id": 1,
      "data": "{\"level\": \"senior\", \"permissions\": [\"admin\", \"deploy\"]}",
      "remarks": "Senior team lead with 5+ years experience"
    },
    {
      "agent_id": 2,
      "role_id": 2,
      "data": "{\"level\": \"mid\", \"permissions\": [\"read\", \"write\"]}",
      "remarks": "Full-stack developer"
    },
    {
      "agent_id": 3,
      "role_id": 2,
      "data": "{\"level\": \"junior\", \"permissions\": [\"read\"]}",
      "remarks": "QA tester"
    }
  ]
}
```

**Response**:
```json
{
  "id": 1,
  "name": "Development Team Alpha",
  "email": "dev-alpha@company.com",
  "phone_number": "+1234567890",
  "address_line1": "123 Main St",
  "city": "New York",
  "status": "active",
  "hash": "team-alpha-hash-123",
  "description": "Main development team for core features",
  "remarks": "High priority team",
  "application_id": 1,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
        "agents": [
        {
          "id": 1,
          "username": "john_doe",
          "TeamAgent": {
            "role_id": 1,
            "data": "{\"level\": \"senior\", \"permissions\": [\"admin\", \"deploy\"]}",
            "remarks": "Senior team lead with 5+ years experience"
          }
        },
        {
          "id": 2,
          "username": "jane_smith",
          "TeamAgent": {
            "role_id": 2,
            "data": "{\"level\": \"mid\", \"permissions\": [\"read\", \"write\"]}",
            "remarks": "Full-stack developer"
          }
        },
        {
          "id": 3,
          "username": "bob_wilson",
          "TeamAgent": {
            "role_id": 2,
            "data": "{\"level\": \"junior\", \"permissions\": [\"read\"]}",
            "remarks": "QA tester"
          }
        }
      ],
  "applications": [],
  "roles": []
}
```

### 2. Regular Team Creation (without agents)
**Endpoint**: `POST /teams`

This endpoint remains unchanged for backward compatibility.

## Frontend Implementation Examples

### React/JavaScript Example

```javascript
// Frontend form submission
const createTeamWithAgents = async (formData) => {
  const teamData = {
    name: formData.teamName,
    email: formData.teamEmail,
    phone_number: formData.phoneNumber,
    address_line1: formData.address,
    city: formData.city,
    status: formData.status,
    hash: generateTeamHash(formData.teamName),
    description: formData.description,
    remarks: formData.remarks,
    application_id: formData.applicationId,
          agents: formData.selectedAgents.map(agent => ({
        agent_id: agent.id,
        role_id: agent.role_id || 2,
        data: JSON.stringify({
          level: agent.level || 'junior',
          permissions: agent.permissions || ['read']
        }),
        remarks: agent.remarks || ''
      }))
  };

  try {
    const response = await fetch('/api/teams/with-agents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(teamData)
    });

    if (response.ok) {
      const createdTeam = await response.json();
      console.log('Team created successfully:', createdTeam);
      // Handle success (redirect, show message, etc.)
    } else {
      throw new Error('Failed to create team');
    }
  } catch (error) {
    console.error('Error creating team:', error);
    // Handle error
  }
};
```

### Angular/TypeScript Example

```typescript
// team.service.ts
@Injectable()
export class TeamService {
  constructor(private http: HttpClient) {}

  createTeamWithAgents(teamData: CreateTeamWithAgentsDto): Observable<TeamAttributes> {
    return this.http.post<TeamAttributes>('/api/teams/with-agents', teamData);
  }
}

// team.component.ts
export class TeamComponent {
  selectedAgents: Agent[] = [];

  onSubmit() {
    const teamData: CreateTeamWithAgentsDto = {
      name: this.teamForm.value.name,
      email: this.teamForm.value.email,
      phone_number: this.teamForm.value.phoneNumber,
      address_line1: this.teamForm.value.address,
      city: this.teamForm.value.city,
      status: this.teamForm.value.status,
      hash: this.generateTeamHash(this.teamForm.value.name),
      description: this.teamForm.value.description,
      remarks: this.teamForm.value.remarks,
      application_id: this.teamForm.value.applicationId,
      agents: this.selectedAgents.map(agent => ({
        agent_id: agent.id,
        role_id: agent.role_id || 2,
        data: JSON.stringify({
          level: agent.level || 'junior',
          permissions: agent.permissions || ['read']
        }),
        remarks: agent.remarks || ''
      }))
    };

    this.teamService.createTeamWithAgents(teamData).subscribe({
      next: (createdTeam) => {
        console.log('Team created successfully:', createdTeam);
        // Handle success
      },
      error: (error) => {
        console.error('Error creating team:', error);
        // Handle error
      }
    });
  }
}
```

### Vue.js Example

```javascript
// team-form.vue
export default {
  data() {
    return {
      teamForm: {
        name: '',
        email: '',
        phoneNumber: '',
        address: '',
        city: '',
        status: 'active',
        description: '',
        remarks: '',
        applicationId: null
      },
      selectedAgents: []
    }
  },
  methods: {
    async submitForm() {
      const teamData = {
        ...this.teamForm,
        hash: this.generateTeamHash(this.teamForm.name),
        agents: this.selectedAgents.map(agent => ({
          agent_id: agent.id,
          role_id: agent.role_id || 2,
          data: JSON.stringify({
            level: agent.level || 'junior',
            permissions: agent.permissions || ['read']
          }),
          remarks: agent.remarks || ''
        }))
      };

      try {
        const response = await this.$http.post('/api/teams/with-agents', teamData);
        console.log('Team created successfully:', response.data);
        // Handle success
      } catch (error) {
        console.error('Error creating team:', error);
        // Handle error
      }
    }
  }
}
```

## Form Structure Example

```html
<!-- Example HTML form structure -->
<form @submit.prevent="submitForm">
  <!-- Team basic information -->
  <div class="form-group">
    <label for="teamName">Team Name</label>
    <input type="text" id="teamName" v-model="teamForm.name" required>
  </div>

  <div class="form-group">
    <label for="teamEmail">Team Email</label>
    <input type="email" id="teamEmail" v-model="teamForm.email" required>
  </div>

  <!-- Agent selection -->
  <div class="form-group">
    <label>Select Agents</label>
    <div v-for="agent in availableAgents" :key="agent.id">
      <input 
        type="checkbox" 
        :id="'agent-' + agent.id"
        :value="agent"
        v-model="selectedAgents"
      >
      <label :for="'agent-' + agent.id">{{ agent.username }}</label>
      
      <!-- Agent role selection (when agent is selected) -->
      <div v-if="selectedAgents.includes(agent)" class="agent-details">
        <select v-model="agent.role_id">
          <option value="1">Team Lead</option>
          <option value="2">Agent</option>
          <option value="3">Developer</option>
          <option value="4">Manager</option>
          <option value="5">Customer</option>
        </select>
        
        <input 
          type="text" 
          placeholder="Remarks" 
          v-model="agent.remarks"
        >
      </div>
    </div>
  </div>

  <button type="submit">Create Team</button>
</form>
```

## Key Features

### 1. **Automatic Team-Agent Relationship Creation**
- When you submit the form, the system automatically creates records in the `team_agent` table
- Each agent assignment includes optional metadata (role_id, data, remarks)
- **Auto-role assignment**: If no role_id is specified, agents automatically get `role_id: 2` (Agent role)

### 2. **Flexible Agent Assignment**
- You can assign multiple agents to a team in one request
- Each agent can have different roles (specified by role_id)
- **Team Leaders**: Use `role_id: 1` for team leadership positions
- **Regular Agents**: Use `role_id: 2` or omit for default agent role
- Additional metadata can be stored as JSON in the `data` field

### 3. **Validation**
- All input is validated using class-validator decorators
- Agent IDs are validated to ensure they exist
- Required fields are enforced

### 4. **Backward Compatibility**
- The original `POST /teams` endpoint still works for teams without agents
- Existing code will continue to work without changes

## Database Changes

The system uses the updated `team_agent` table structure with role IDs:

```sql
CREATE TABLE team_agent (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT,
  agent_id INT,
  role_id INT,
  data TEXT,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id),
  FOREIGN KEY (agent_id) REFERENCES agents(id),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);
```

## Role Reference

Available roles for assignment:
- `role_id: 1` → Team Lead
- `role_id: 2` → Agent (default)
- `role_id: 3` → Developer
- `role_id: 4` → Manager
- `role_id: 5` → Customer

## Error Handling

The API will return appropriate error messages for:
- Invalid agent IDs
- Missing required fields
- Validation errors
- Database constraint violations

Example error response:
```json
{
  "statusCode": 400,
  "message": [
    "agents.0.agent_id must be a number",
    "name should not be empty"
  ],
  "error": "Bad Request"
}
```

## Testing

You can test the endpoint using tools like Postman or curl:

```bash
curl -X POST http://localhost:3000/teams/with-agents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Test Team",
    "email": "test@example.com",
    "status": "active",
    "hash": "test-hash",
    "agents": [
      {
        "agent_id": 1,
        "role_id": 1,
        "remarks": "Team leader"
      }
    ]
  }'
```

This implementation provides a seamless way to create teams with agent assignments directly from your frontend form submission.


