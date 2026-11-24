import { DataTypes, Model, type Sequelize } from "sequelize"
import { InventoryItemUserLogAttributes } from "src/intertfaces/inventory-item-user-log.interface"

export class InventoryItemUserLog
  extends Model<InventoryItemUserLogAttributes>
  implements InventoryItemUserLogAttributes
{
  declare id: number
  declare user?: string
  declare status?: string
  declare name?: string
  declare description?: string
  declare condition?: string
  declare ownership?: string
  declare serialNo?: string
  declare purchasedAt?: number
  declare data?: string
  declare remarks?: string
  declare item_id?: number
  declare user_id?: number
}

export const initInventoryItemUserLog = (sequelize: Sequelize): typeof InventoryItemUserLog => {
  InventoryItemUserLog.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user: DataTypes.STRING,
      status: { type: DataTypes.STRING, defaultValue: 'inactive' },
      name: DataTypes.STRING,
      description: DataTypes.STRING,
      condition: DataTypes.STRING,
      ownership: DataTypes.STRING,
      serialNo: DataTypes.STRING,
      purchasedAt: DataTypes.BIGINT,
      data: DataTypes.TEXT("long"),
      remarks: DataTypes.STRING,
      item_id: DataTypes.INTEGER,
      user_id: DataTypes.BIGINT,
    },
    {
      sequelize,
      tableName: "inventory_item_user_log",
      timestamps: true,
    },
  )

  return InventoryItemUserLog
}
