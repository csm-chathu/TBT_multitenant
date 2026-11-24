import { DataTypes, Model, type Sequelize } from "sequelize"

export class TicketRead extends Model {
  declare id: number
  declare ticket_id: number
  declare user_id: number
  declare read_at: Date
  declare createdAt?: Date
  declare updatedAt?: Date
}

export const initTicketRead = (sequelize: Sequelize): typeof TicketRead => {
  TicketRead.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      ticket_id: { type: DataTypes.INTEGER, allowNull: false },
      user_id: { type: DataTypes.BIGINT, allowNull: false },
      read_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      tableName: "ticket_reads",
      timestamps: true,
    },
  )

  return TicketRead
}
