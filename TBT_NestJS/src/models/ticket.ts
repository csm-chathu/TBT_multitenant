import { DataTypes, Model, type Sequelize } from "sequelize"
import { TicketAttributes } from "src/intertfaces/ticket.interface"

export class Ticket extends Model<TicketAttributes> implements TicketAttributes {
  // Use declare instead of public to avoid shadowing Sequelize's getters/setters
  declare id: number
  declare title: string
  declare body?: string
  declare init_message?: number
  declare ticket_template_id?: number
  declare device_id?: number
  declare status?: string
  declare priority: string
  declare data?: string
  declare additinal_data?: string
  declare hash: string
  declare remarks?: string
  declare customer_id?: number
  declare agent_id?: number
  declare application_id: number
  declare alert_id?: number
  declare serialNo?: string
  declare ticketType?: string | undefined
  declare attachments?: string[]
  declare reporter_id?: number
  declare multiple_assignees?: number[]
  declare action_types?: number[] | string[]
  declare read_at?: Date | null
  declare createdAt?: Date | number
  declare updatedAt?: Date | number
}

export const initTicket = (sequelize: Sequelize): typeof Ticket => {
  Ticket.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: DataTypes.TEXT("long"), allowNull: false },
      body: DataTypes.TEXT("long"),
      init_message: DataTypes.INTEGER,
      ticket_template_id: DataTypes.INTEGER,
      device_id: DataTypes.INTEGER,
      status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'inactive' },
      priority: { type: DataTypes.STRING, allowNull: false, defaultValue: 'medium' },
      data: DataTypes.TEXT("long"),
      additinal_data: DataTypes.TEXT("long"),
      hash: { type: DataTypes.STRING, unique: true, allowNull: false },
      remarks: DataTypes.TEXT("long"),
      customer_id: DataTypes.BIGINT,
      agent_id: DataTypes.INTEGER,
      application_id: { type: DataTypes.INTEGER, allowNull: false },
      alert_id: DataTypes.INTEGER,
      serialNo: DataTypes.STRING,
      ticketType: DataTypes.STRING,
      attachments: DataTypes.JSON,
      reporter_id: DataTypes.INTEGER,
      multiple_assignees: DataTypes.JSON,
      action_types: DataTypes.JSON,
      read_at: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    },
    {
      sequelize,
      tableName: "tickets",
      timestamps: true,
    },
  )

  return Ticket
}
