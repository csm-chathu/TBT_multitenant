import { DataTypes, Model, type Sequelize } from "sequelize"
import { InventoryItemBrandAttributes } from "src/intertfaces/inventory-item-brand.interface"

export class InventoryItemBrand extends Model<InventoryItemBrandAttributes> implements InventoryItemBrandAttributes {
  declare id: number
  declare name?: string
  declare label?: string
  declare description?: string
  declare remarks?: string
  declare hash?: string
  declare data?: string
  declare deletedAt?: Date
}

export const initInventoryItemBrand = (sequelize: Sequelize): typeof InventoryItemBrand => {
  InventoryItemBrand.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, unique: true },
      label: DataTypes.STRING,
      description: DataTypes.TEXT("long"),
      remarks: DataTypes.TEXT("long"),
      hash: { type: DataTypes.STRING, unique: true },
      data: DataTypes.TEXT("long"),
      deletedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: "inventory_item_brand",
      timestamps: true,
      paranoid: true,
      deletedAt: 'deletedAt',
    },
  )

  return InventoryItemBrand
}
