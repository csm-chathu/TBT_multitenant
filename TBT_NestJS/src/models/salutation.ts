import { DataTypes, Model, type Sequelize } from "sequelize"
import { SalutationAttributes } from "src/intertfaces/salutation.interface"

export class Salutation extends Model<SalutationAttributes> implements SalutationAttributes {
  declare id: number
  declare name: string
  declare label?: string
}

export const initSalutation = (sequelize: Sequelize): typeof Salutation => {
  Salutation.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, unique: true },
      label: DataTypes.STRING,
    },
    {
      sequelize,
      tableName: "salutations",
      timestamps: true,
    },
  )

  return Salutation
}
