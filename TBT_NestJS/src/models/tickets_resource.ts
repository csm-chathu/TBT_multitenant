import { DataTypes, Model, type Sequelize } from "sequelize"
import { TicketsResourceAttributes } from "src/intertfaces/tickets-resource.interface"

export class TicketsResource extends Model<TicketsResourceAttributes> implements TicketsResourceAttributes {
  declare id: number
  declare file_mime_type: string
  declare file_path: string
  declare thumb_path?: string
  declare data?: string
  declare hash: string
  declare remarks?: string
  declare deletedAt?: boolean
  declare ticket_id: number
}

export const initTicketsResource = (sequelize: Sequelize): typeof TicketsResource => {
  TicketsResource.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      file_mime_type: { type: DataTypes.STRING, allowNull: false },
      file_path: { type: DataTypes.STRING, allowNull: false },
      thumb_path: DataTypes.STRING,
      data: DataTypes.TEXT("long"),
      hash: { type: DataTypes.STRING, unique: true, allowNull: false },
      remarks: DataTypes.TEXT("long"),
      deletedAt: DataTypes.BOOLEAN,
      ticket_id: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      sequelize,
      tableName: "tickets_resource",
      timestamps: true,
    },
  )

  return TicketsResource
}
