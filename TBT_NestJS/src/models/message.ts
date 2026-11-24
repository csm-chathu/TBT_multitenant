import { DataTypes, Model, type Sequelize } from "sequelize"
import { MessageAttributes } from "src/intertfaces/message.interface"

export class Message extends Model<MessageAttributes> implements MessageAttributes {
  declare id: number
  declare from: string
  declare to: string
  declare message: string
  declare message_data?: string
  declare type?: string
  declare direction: string
  declare customer_id?: number
  declare application_id?: number
  declare ticket_id?: number
}

export const initMessage = (sequelize: Sequelize): typeof Message => {
  Message.init(
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      from: { type: DataTypes.STRING, allowNull: false },
      to: { type: DataTypes.STRING, allowNull: false },
      message: { type: DataTypes.TEXT("long"), allowNull: false },
      message_data: DataTypes.TEXT("long"),
      type: DataTypes.STRING,
      direction: DataTypes.STRING,
      customer_id: DataTypes.BIGINT,
      application_id: DataTypes.INTEGER,
      ticket_id: DataTypes.INTEGER,
    },
    {
      sequelize,
      tableName: "messages",
      timestamps: true,
    },
  )

  return Message
}
