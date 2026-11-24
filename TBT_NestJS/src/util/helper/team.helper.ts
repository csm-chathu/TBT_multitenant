import { TeamAttributes } from '../../intertfaces/team.interface';

/**
 * Extracts team leader information from team data
 * Team leader is identified by role_id: 1 (TEAM_LEAD) in the team_agent through table
 */
export const extractTeamLeader = (team: any): { leader_id?: number; leader_name?: string } => {
  if (!team) {
    return {};
  }

  try {
    // Handle Sequelize model instance
    const plainTeam = typeof team.toJSON === 'function' ? team.toJSON() : team;
    const agents = plainTeam?.agents || [];

    // Find the agent with role_id: 1 (TEAM_LEAD)
    // The through table data can be accessed via different property names depending on Sequelize version
    const leaderAgent = agents.find((agent: any) => {
      // Try different possible property names for the through table data
      const teamAgent = agent?.team_agent || agent?.TeamAgent || agent?.teamAgent;
      // Also check if role_id is directly on the agent object (some Sequelize configurations)
      const roleId = teamAgent?.role_id ?? agent?.role_id;
      return roleId === 1;
    });

    if (leaderAgent) {
      const leaderId = leaderAgent.id;
      const firstName = leaderAgent.first_name || '';
      const lastName = leaderAgent.last_name || '';
      const leaderName = `${firstName} ${lastName}`.trim() || leaderAgent.nickname || '';

      return {
        leader_id: leaderId,
        leader_name: leaderName || undefined,
      };
    }

    return {};
  } catch (error) {
    // Silently return empty object on error
    return {};
  }
};

/**
 * Transforms team data to include team leader information
 */
export const toPlainTeamWithLeader = (team: any): TeamAttributes & { leader_id?: number; leader_name?: string } => {
  if (!team) return team;

  try {
    const plain = typeof team.toJSON === 'function' ? team.toJSON() : team;
    const leaderInfo = extractTeamLeader(plain);
    // Avoid sending redundant `application_id` when application object is already included
    const { application_id: _omitApplicationId, ...teamWithoutAppId } = plain;

    return {
      ...teamWithoutAppId,
      ...leaderInfo,
    } as TeamAttributes & { leader_id?: number; leader_name?: string };
  } catch {
    const plain = typeof team.toJSON === 'function' ? team.toJSON() : team;
    const leaderInfo = extractTeamLeader(plain);
    const { application_id: _omitApplicationId, ...teamWithoutAppId } = plain;
    return {
      ...teamWithoutAppId,
      ...leaderInfo,
    } as TeamAttributes & { leader_id?: number; leader_name?: string };
  }
};

