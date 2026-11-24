import { DataTypes, Model, type Sequelize } from "sequelize"
import { AgentAttributes } from "src/intertfaces/agent.interface"

export class Agent extends Model<AgentAttributes> implements AgentAttributes {
  declare id: number
  declare nickname?: string
  declare first_name: string
  declare last_name?: string
  declare email: string
  declare mobile_number?: string
  declare phone_number?: string
  declare address_line1?: string
  declare address_line2?: string
  declare city?: string
  declare dob?: string
  declare sex?: string
  declare status: string
  declare hash: string
  declare description?: string
  declare remarks?: string
  declare data?: string
  declare salutation_id?: number
  declare user_id?: number
  declare country_id?: number
  declare state_id?: number
  declare deletedAt?: Date | null
  declare deletedReason?: string | null
}

export const initAgent = (sequelize: Sequelize): typeof Agent => {
  Agent.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nickname: { type: DataTypes.STRING, unique: true },
      first_name: { type: DataTypes.STRING, allowNull: false },
      last_name: DataTypes.STRING,
      email: { type: DataTypes.STRING, unique: true, allowNull: false },
      mobile_number: DataTypes.STRING,
      phone_number: DataTypes.STRING,
      address_line1: DataTypes.STRING,
      address_line2: DataTypes.STRING,
      city: DataTypes.STRING,
      dob: DataTypes.STRING,
      sex: DataTypes.STRING,
      status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'inactive' },
      hash: { type: DataTypes.STRING, unique: true, allowNull: false },
      description: DataTypes.TEXT("long"),
      remarks: DataTypes.TEXT("long"),
      data: DataTypes.TEXT("long"),
      salutation_id: DataTypes.INTEGER,
      user_id: DataTypes.BIGINT,
      country_id: DataTypes.INTEGER,
      state_id: DataTypes.INTEGER,
      deletedAt: DataTypes.DATE,
      deletedReason: { type: DataTypes.TEXT, field: 'deleted_reason' },
    },
    {
      sequelize,
      tableName: "agents",
      timestamps: true,
      paranoid: true,
      deletedAt: 'deletedAt',
    },
  )

  return Agent
}
