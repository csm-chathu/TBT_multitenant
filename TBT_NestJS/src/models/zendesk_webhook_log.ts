import { DataTypes, Model, type Sequelize } from "sequelize"

export interface ZendeskWebhookLogAttributes {
  id?: number
  zendesk_ticket_id?: string
  email?: string
  payload: object
  created_ticket_id?: number
  createdAt?: Date
  updatedAt?: Date
}

export class ZendeskWebhookLog extends Model<ZendeskWebhookLogAttributes> implements ZendeskWebhookLogAttributes {
  declare id?: number
  declare zendesk_ticket_id?: string
  declare email?: string
  declare payload: object
  declare created_ticket_id?: number
  declare createdAt?: Date
  declare updatedAt?: Date
}

export const initZendeskWebhookLog = (sequelize: Sequelize): typeof ZendeskWebhookLog => {
  ZendeskWebhookLog.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      zendesk_ticket_id: { type: DataTypes.STRING, allowNull: true },
      email: { type: DataTypes.STRING, allowNull: true },
      payload: { type: DataTypes.JSON, allowNull: false },
      created_ticket_id: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      sequelize,
      tableName: "zendesk_webhook_logs",
      timestamps: true,
    },
  )

  return ZendeskWebhookLog
}
