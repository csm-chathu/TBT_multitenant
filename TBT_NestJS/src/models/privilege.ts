import { DataTypes, Model, type Sequelize } from "sequelize"
import { PrivilegeAttributes } from "src/intertfaces/privilege.interface"

export class Privilege extends Model<PrivilegeAttributes> implements PrivilegeAttributes {
  declare id: number
}

export const initPrivilege = (sequelize: Sequelize): typeof Privilege => {
  Privilege.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    },
    {
      sequelize,
      tableName: "privileges",
      timestamps: true,
    },
  )

  return Privilege
}
