import { DataTypes, Model, type Sequelize } from "sequelize"
import { TeamAttributes } from "src/intertfaces/team.interface"

export class Team extends Model<TeamAttributes> implements TeamAttributes {
  declare id: number
  declare name: string
  declare email: string
  declare phone_number?: string
  declare address_line1?: string
  declare address_line2?: string
  declare city?: string
  declare status: string
  declare hash: string
  declare data?: string
  declare description?: string
  declare remarks?: string
  declare application_id?: number
  declare deletedAt?: Date | null
  declare deletedReason?: string | null
}

export const initTeam = (sequelize: Sequelize): typeof Team => {
  Team.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, unique: true, allowNull: false },
      email: { type: DataTypes.STRING, unique: true, allowNull: false },
      phone_number: DataTypes.STRING,
      address_line1: DataTypes.STRING,
      address_line2: DataTypes.STRING,
      city: DataTypes.STRING,
      status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'inactive' },
      hash: { type: DataTypes.STRING, unique: true, allowNull: false },
      data: DataTypes.TEXT("long"),
      description: DataTypes.TEXT("long"),
      remarks: DataTypes.TEXT("long"),
      deletedAt: DataTypes.DATE,
      deletedReason: { type: DataTypes.TEXT, field: 'deleted_reason' },
      application_id: DataTypes.INTEGER,
    },
    {
      sequelize,
      tableName: "teams",
      timestamps: true,
      paranoid: true,
      deletedAt: 'deletedAt',
    },
  )

  return Team
}
