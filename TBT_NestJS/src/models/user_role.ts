import { DataTypes, Model, type Sequelize } from "sequelize"
import { UserRoleAttributes } from "src/intertfaces/user-role.interface"

export class UserRole extends Model<UserRoleAttributes> implements UserRoleAttributes {
  declare id: number
  declare user_id: number
  declare role_id: number
}

export const initUserRole = (sequelize: Sequelize): typeof UserRole => {
  UserRole.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.BIGINT, allowNull: false },
      role_id: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      sequelize,
      tableName: "user_role",
      timestamps: true,
    },
  )

  return UserRole
}

