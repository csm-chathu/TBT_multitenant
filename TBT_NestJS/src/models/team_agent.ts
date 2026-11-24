import { DataTypes, Model, type Sequelize } from "sequelize"
import { TeamAgentAttributes } from "src/intertfaces/team-agent.interface"

export class TeamAgent extends Model<TeamAgentAttributes> implements TeamAgentAttributes {
  declare id: number
  declare role_id?: number
  declare data?: string
  declare remarks?: string
  declare team_id?: number
  declare agent_id?: number
}

export const initTeamAgent = (sequelize: Sequelize): typeof TeamAgent => {
  TeamAgent.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      role_id: DataTypes.INTEGER,
      data: DataTypes.TEXT("long"),
      remarks: DataTypes.TEXT("long"),
      team_id: DataTypes.INTEGER,
      agent_id: DataTypes.INTEGER,
    },
    {
      sequelize,
      tableName: "team_agent",
      timestamps: true,
    },
  )

  return TeamAgent
}
