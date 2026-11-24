import { DataTypes, Model, type Sequelize } from 'sequelize';
import { InventoryItemCategoryAttributes } from 'src/intertfaces/inventory-item-category.interface';

export class InventoryItemCategory
  extends Model<InventoryItemCategoryAttributes>
  implements InventoryItemCategoryAttributes
{
  declare id: number;
  declare name?: string;
  declare label?: string;
  declare description?: string;
  declare remarks?: string;
  declare hash?: string;
  declare data?: string;
  declare deletedAt?: Date;
}

export const initInventoryItemCategory = (
  sequelize: Sequelize,
): typeof InventoryItemCategory => {
  InventoryItemCategory.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, unique: true },
      label: DataTypes.STRING,
      description: DataTypes.TEXT('long'),
      remarks: DataTypes.TEXT('long'),
      hash: { type: DataTypes.STRING, unique: true },
      data: DataTypes.TEXT('long'),
      deletedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: 'inventory_item_category',
      timestamps: true,
      paranoid: true,
      deletedAt: 'deletedAt',
    },
  );

  return InventoryItemCategory;
};
