import { DataTypes, Model, type Sequelize } from "sequelize"
import { TicketTemplateAttributes } from "src/intertfaces/ticket-template.interface"

export class TicketTemplate extends Model<TicketTemplateAttributes> implements TicketTemplateAttributes {
  declare id: number
  declare name?: string
  declare label?: string
  declare description?: string
}

export const initTicketTemplate = (sequelize: Sequelize): typeof TicketTemplate => {
  TicketTemplate.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: DataTypes.STRING,
      label: DataTypes.STRING,
      description: DataTypes.STRING,
    },
    {
      sequelize,
      tableName: "ticket_template",
      timestamps: true,
    },
  )

  return TicketTemplate
}
