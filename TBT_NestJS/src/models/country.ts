import { DataTypes, Model, type Sequelize } from "sequelize"
import { CountryAttributes } from "src/intertfaces/country.inter"

export class Country extends Model<CountryAttributes> implements CountryAttributes {
  declare id: number
  declare name?: string
  declare label?: string
}

export const initCountry = (sequelize: Sequelize): typeof Country => {
  Country.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, unique: true },
      label: DataTypes.STRING,
    },
    {
      sequelize,
      tableName: "countries",
      timestamps: true,
    },
  )

  return Country
}
