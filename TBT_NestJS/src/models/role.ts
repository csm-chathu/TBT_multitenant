import { DataTypes, Model, type Sequelize } from "sequelize"
import { RoleAttributes } from "src/intertfaces/role.interface"

export class Role extends Model<RoleAttributes> implements RoleAttributes {
  declare id: number
  declare name?: string
  declare label?: string
}

export const initRole = (sequelize: Sequelize): typeof Role => {
  Role.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, unique: true },
      label: DataTypes.STRING,
    },
    {
      sequelize,
      tableName: "roles",
      timestamps: true,
    },
  )

  return Role
}
