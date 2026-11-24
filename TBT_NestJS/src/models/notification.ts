import { DataTypes, Model, type Sequelize } from "sequelize"
import { NotificationAttributes } from "src/intertfaces/notification.interface"

export class Notification extends Model<NotificationAttributes> implements NotificationAttributes {
  declare id: number
  declare message?: string
  declare hash?: string
  declare data?: string
  declare status?: string
  declare level?: string
  declare type?: string
  declare createdAt?: Date
  declare updatedAt?: Date
  declare user_id?: number
  declare ticket_id?: number
  // Optional secondary target user (e.g. assigned agent user.id)
  declare target_user_id?: number
}

export const initNotification = (sequelize: Sequelize): typeof Notification => {
  Notification.init(
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      message: DataTypes.STRING,
      hash: DataTypes.STRING,
      data: DataTypes.TEXT("long"),
      status: DataTypes.STRING,
      level: DataTypes.STRING,
      type: DataTypes.STRING,
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      user_id: DataTypes.BIGINT,
      ticket_id: DataTypes.INTEGER,
      target_user_id: DataTypes.BIGINT,
    },
    {
      sequelize,
      tableName: "notifications",
      timestamps: true,
    },
  )

  return Notification
}
