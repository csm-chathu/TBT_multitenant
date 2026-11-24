import { DataTypes, Model, type Sequelize } from "sequelize"
import { InventoryItemAttributes } from "src/intertfaces/inventory-item.interface"

export class InventoryItem extends Model<InventoryItemAttributes> implements InventoryItemAttributes {
  declare id: number
  declare user?: string
  declare name?: string
  declare description?: string
  declare condition?: string
  declare ownership?: string
  declare serialNo?: string
  declare hash?: string
  declare ipAddress?: string
  declare purchasedAt?: string
  declare data?: string
  declare remarks?: string
  declare category_id: number
  declare brand_id?: number
  declare location_id?: number
  declare user_id?: number
  declare deletedAt?: Date
}

export const initInventoryItem = (sequelize: Sequelize): typeof InventoryItem => {
  InventoryItem.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user: DataTypes.STRING,
      name: DataTypes.STRING,
      description: DataTypes.TEXT("long"),
      condition: DataTypes.STRING,
      ownership: DataTypes.STRING,
      serialNo: DataTypes.STRING,
      hash: DataTypes.STRING,
      ipAddress: DataTypes.STRING,
      purchasedAt: DataTypes.STRING,
      data: DataTypes.TEXT("long"),
      remarks: DataTypes.TEXT("long"),
      category_id: DataTypes.INTEGER,
      brand_id: DataTypes.INTEGER,
      location_id: DataTypes.INTEGER,
      user_id: DataTypes.BIGINT,
      deletedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: "inventory_item",
      timestamps: true,
      paranoid: true,
      deletedAt: 'deletedAt',
    },
  )

  return InventoryItem
}
