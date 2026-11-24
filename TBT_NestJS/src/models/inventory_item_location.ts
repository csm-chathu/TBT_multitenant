import { DataTypes, Model, type Sequelize } from "sequelize"
import { InventoryItemLocationAttributes } from "src/intertfaces/inventory-item-location.interface"

export class InventoryItemLocation
  extends Model<InventoryItemLocationAttributes>
  implements InventoryItemLocationAttributes
{
  declare id: number
  declare name?: string
  declare label?: string
  declare description?: string
  declare remarks?: string
  declare address?: string
  declare hash?: string
  declare data?: string
  declare country_id?: number
  declare organization_id: number
  declare deletedAt?: Date
}

export const initInventoryItemLocation = (sequelize: Sequelize): typeof InventoryItemLocation => {
  InventoryItemLocation.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, unique: true },
      label: DataTypes.STRING,
      description: DataTypes.TEXT("long"),
      remarks: DataTypes.TEXT("long"),
      address: DataTypes.TEXT("long"),
      hash: { type: DataTypes.STRING, unique: true },
      data: DataTypes.TEXT("long"),
      country_id: DataTypes.INTEGER,
      organization_id: { type: DataTypes.INTEGER, allowNull: true },
      deletedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: "inventory_item_location",
      timestamps: true,
      paranoid: true,
      deletedAt: 'deletedAt',
    },
  )

  return InventoryItemLocation
}
