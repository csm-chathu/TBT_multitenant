import { DataTypes, Model, type Sequelize } from "sequelize"
import { TeamRolesAttributes } from "src/intertfaces/team-roles.interface"

export class TeamRoles extends Model<TeamRolesAttributes> implements TeamRolesAttributes {
  declare id: number
  declare name?: string
  declare label?: string
  declare data?: string
  declare remarks?: string
  declare team_id?: number
  declare role_id?: number
}

export const initTeamRoles = (sequelize: Sequelize): typeof TeamRoles => {
  TeamRoles.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, unique: true },
      label: DataTypes.STRING,
      data: DataTypes.TEXT("long"),
      remarks: DataTypes.STRING,
      team_id: DataTypes.INTEGER,
      role_id: DataTypes.INTEGER,
    },
    {
      sequelize,
      tableName: "team_roles",
      timestamps: true,
    },
  )

  return TeamRoles
}
