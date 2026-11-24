import { DataTypes, Model, type Sequelize } from "sequelize"
import { TicketActionTypeAttributes } from "src/intertfaces/ticket-action-type.interface"

export class TicketActionType extends Model<TicketActionTypeAttributes> implements TicketActionTypeAttributes {
  declare id: number
  declare name: string
  declare application_id?: number
}

export const initTicketActionType = (sequelize: Sequelize): typeof TicketActionType => {
  TicketActionType.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
      application_id: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      sequelize,
      tableName: "action_types",
      timestamps: true,
    },
  )

  return TicketActionType
}
