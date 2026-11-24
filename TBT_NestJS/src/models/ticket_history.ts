import { DataTypes, Model, type Sequelize } from "sequelize"
import { TicketHistoryAttributes } from "src/intertfaces/ticket-history.interface"

export class TicketHistory extends Model<TicketHistoryAttributes> implements TicketHistoryAttributes {
  declare id: number
  declare message: string
  declare type: string
  declare action?: string
  declare status: string
  declare user_id?: number
  declare user_data?: string
  declare previous_data?: string
  declare new_data?: string
  declare data?: string
  declare remarks?: string
  declare ticket_id: number
  declare role_id?: number
}

export const initTicketHistory = (sequelize: Sequelize): typeof TicketHistory => {
  TicketHistory.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      message: { type: DataTypes.TEXT("long"), allowNull: false },
      type: { type: DataTypes.STRING, allowNull: false, defaultValue: 'SMS' },
      action: DataTypes.STRING,
      status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'inactive' },
      user_id: DataTypes.BIGINT,
      user_data: DataTypes.TEXT("long"),
      previous_data: DataTypes.TEXT("long"),
      new_data: DataTypes.TEXT("long"),
      data: DataTypes.TEXT("long"),
      remarks: DataTypes.TEXT("long"),
      ticket_id: { type: DataTypes.INTEGER, allowNull: false },
      role_id: DataTypes.INTEGER,
    },
    {
      sequelize,
      tableName: "ticket_history",
      timestamps: true,
    },
  )

  return TicketHistory
}
