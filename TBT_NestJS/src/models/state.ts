import { DataTypes, Model, type Sequelize } from "sequelize"
import { StateAttributes } from "src/intertfaces/state.interface"

export class State extends Model<StateAttributes> implements StateAttributes {
  declare id: number
  declare name?: string
  declare label?: string
  declare country_id?: number
}

export const initState = (sequelize: Sequelize): typeof State => {
  State.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, unique: true },
      label: DataTypes.STRING,
      country_id: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      sequelize,
      tableName: "states",
      timestamps: true,
    },
  )

  return State
}
