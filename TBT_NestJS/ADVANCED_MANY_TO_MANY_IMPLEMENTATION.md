# Advanced Many-to-Many Implementation

This document explains the implementation of advanced many-to-many relationships in your NestJS application, based on the [Sequelize Advanced Many-to-Many documentation](https://sequelize.org/docs/v6/advanced-association-concepts/advanced-many-to-many/).

## Overview

We've implemented **Super Many-to-Many relationships** that provide the best of both worlds:
- The convenience of many-to-many associations
- The flexibility of direct access to junction tables
- Additional attributes on through tables for enhanced data modeling

## Implemented Relationships

### 1. Team-Agent Relationship
- **Junction Table**: `TeamAgent`
- **Additional Fields**: `role_id`, `data`, `remarks`
- **Use Case**: Track what role an agent has within a specific team

### 2. Team-Application Relationship  
- **Junction Table**: `TeamApplication`
- **Additional Fields**: `data`, `remarks`
- **Use Case**: Track team access levels and permissions for applications

### 3. Team-Role Relationship
- **Junction Table**: `TeamRole` (newly created)
- **Additional Fields**: `data`, `remarks`
- **Use Case**: Assign roles to teams with additional metadata

## Key Features Implemented

### Super Many-to-Many Pattern
Each relationship includes:
- `belongsToMany` associations for convenient many-to-many operations
- `hasMany` associations for direct junction table access
- `belongsTo` associations on junction tables

### Enhanced Repository Methods
The `TeamRepository` now includes:

#### Basic Operations
- `findAll()` - Includes all related data with through table attributes
- `findOne()` - Enhanced with through table data
- `create()`, `update()`, `remove()` - Standard CRUD operations

#### Advanced Operations
- `addAgentToTeam()` - Add agent with through table data
- `addApplicationToTeam()` - Add application with through table data  
- `addRoleToTeam()` - Add role with through table data
- `createWithAssociations()` - Create team with all associations in one call
- `findTeamsByAgent()` - Query teams by agent with through table filtering
- `findTeamWithNestedAssociations()` - Complex nested queries

## Usage Examples

### Adding an Agent to a Team with Through Data
```typescript
await teamRepository.addAgentToTeam(1, 2, {
  role_id: 1, // TEAM_LEAD
  data: '{"permissions": ["read", "write"]}',
  remarks: 'Senior team member'
});
```

### Creating a Team with All Associations
```typescript
const team = await teamRepository.createWithAssociations({
  name: 'Development Team',
  email: 'dev@company.com',
  status: 'active',
  hash: 'team-hash'
}, {
  agents: [{
    agentId: 1,
    through: { role_id: 1, data: '{"level": "senior"}' }
  }],
  applications: [{
    applicationId: 1,
    through: { data: '{"access_level": "full"}' }
  }],
  roles: [{
    roleId: 1,
    through: { data: '{"permissions": ["admin"]}' }
  }]
});
```

### Advanced Querying with Through Table Conditions
```typescript
// Find teams where the agent has TEAM_LEAD role (role_id: 1)
const teams = await teamRepository.findTeamsByAgent(1, { role_id: 1 });

// Find teams with full access applications
const teamsWithFullAccess = await Team.findAll({
  include: [{
    model: Application,
    as: 'applications',
    through: {
      where: { data: { [Op.like]: '%full%' } },
      attributes: ['data', 'remarks']
    }
  }]
});
```

## Frontend API Guide

### Create Team with Agent Assignments (and Leader)
- **Endpoint**: `POST /api/v1/teams/with-agents`
- **Auth**: Requires valid JWT
- **Behavior**:
  - If `leader_agent_id` is provided, that agent will be saved with `role_id = 1` (TEAM_LEAD)
  - All other agents default to `role_id = 2` (AGENT) unless explicitly set in the payload

#### Request Body
```json
{
  "name": "Team X",
  "email": "teamx@company.com",
  "status": "active",
  "hash": "teamx-001",
  "leader_agent_id": 42,
  "agents": [
    { "agent_id": 42 },
    { "agent_id": 11 },
    { "agent_id": 12, "remarks": "new member" }
  ]
}
```

#### Notes for Frontend
- Ensure `leader_agent_id` is one of the `agents[*].agent_id`
- Ensure every `agent_id` exists in the database; otherwise the API will return 500 with "Agent not found"
- Required fields for team: `name`, `email`, `status`, `hash`


## Benefits of This Implementation

### 1. **Flexibility**
- Can store additional metadata in junction tables
- Direct access to junction tables for complex queries
- Support for many-to-many-to-many relationships

### 2. **Performance**
- Efficient queries with proper indexing
- Ability to filter by through table attributes
- Optimized includes with specific attribute selection

### 3. **Maintainability**
- Clear separation of concerns
- Type-safe operations with proper error handling
- Comprehensive documentation and examples

### 4. **Scalability**
- Supports complex business logic
- Easy to extend with additional through table fields
- Compatible with advanced Sequelize features

## Files Modified/Created

### Modified Files
- `models/index.ts` - Added Super Many-to-Many associations
- `src/repositories/team.repository.ts` - Enhanced with advanced methods

### New Files
- `models/team_role.ts` - New junction table for Team-Role relationships
- `examples/advanced-many-to-many-examples.ts` - Comprehensive usage examples
- `ADVANCED_MANY_TO_MANY_IMPLEMENTATION.md` - This documentation

## Next Steps

1. **Database Migration**: Create migration for the new `team_role` table
2. **Testing**: Add unit tests for the new repository methods
3. **API Endpoints**: Create REST endpoints that leverage these advanced features
4. **Documentation**: Update API documentation with new capabilities

## References

- [Sequelize Advanced Many-to-Many Documentation](https://sequelize.org/docs/v6/advanced-association-concepts/advanced-many-to-many/)
- [Sequelize Association Basics](https://sequelize.org/docs/v6/core-concepts/assocs/)
- [Sequelize Querying with Associations](https://sequelize.org/docs/v6/core-concepts/assocs/#fetching-associations---eager-loading-vs-lazy-loading)

## Example Output

When querying a team with all associations, you'll get structured data like:

```json
{
  "id": 1,
  "name": "Development Team",
  "email": "dev@company.com",
  "agents": [
    {
      "id": 1,
      "username": "john_doe",
      "TeamAgent": {
        "roles": "lead,developer",
        "data": "{\"permissions\": [\"read\", \"write\"]}",
        "remarks": "Senior team member"
      }
    }
  ],
  "applications": [
    {
      "id": 1,
      "name": "Main App",
      "TeamApplication": {
        "data": "{\"access_level\": \"full\"}",
        "remarks": "Primary application"
      }
    }
  ],
  "roles": [
    {
      "id": 1,
      "name": "admin",
      "TeamRole": {
        "data": "{\"permissions\": [\"admin\"]}",
        "remarks": "Administrative role"
      }
    }
  ]
}
```

This implementation provides a robust foundation for complex many-to-many relationships while maintaining the flexibility and performance characteristics needed for enterprise applications.





