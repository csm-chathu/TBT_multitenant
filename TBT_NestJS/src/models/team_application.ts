import { DataTypes, Model, type Sequelize } from "sequelize"
import { TeamApplicationAttributes } from "src/intertfaces/team-application.interface"

export class TeamApplication extends Model<TeamApplicationAttributes> implements TeamApplicationAttributes {
  declare id: number
  declare data?: string
  declare remarks?: string
  declare team_id?: number
  declare application_id?: number
}

export const initTeamApplication = (sequelize: Sequelize): typeof TeamApplication => {
  TeamApplication.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      data: DataTypes.TEXT("long"),
      remarks: DataTypes.TEXT("long"),
      team_id: DataTypes.INTEGER,
      application_id: DataTypes.INTEGER,
    },
    {
      sequelize,
      tableName: "team_application",
      timestamps: true,
    },
  )

  return TeamApplication
}
