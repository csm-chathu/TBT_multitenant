import { DataTypes, Model, type Sequelize } from "sequelize"
import { TicketStatsAttributes } from "src/intertfaces/ticket-stats.interface"

export class TicketStats extends Model<TicketStatsAttributes> implements TicketStatsAttributes {
  declare id: number
  declare date?: string
  declare type?: string
  declare role_user_id?: number
  declare day_stats?: string
  declare week_stats?: string
  declare month_stats?: string
  declare year_stats?: string
  declare all_stats?: string
  declare hash?: string
  declare remarks?: string
}

export const initTicketStats = (sequelize: Sequelize): typeof TicketStats => {
  TicketStats.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      date: DataTypes.STRING,
      type: DataTypes.STRING,
      role_user_id: DataTypes.DOUBLE,
      day_stats: DataTypes.TEXT("long"),
      week_stats: DataTypes.TEXT("long"),
      month_stats: DataTypes.TEXT("long"),
      year_stats: DataTypes.TEXT("long"),
      all_stats: DataTypes.TEXT("long"),
      hash: { type: DataTypes.STRING, unique: true },
      remarks: DataTypes.TEXT("long"),
    },
    {
      sequelize,
      tableName: "ticket_stats",
      timestamps: true,
    },
  )

  return TicketStats
}
