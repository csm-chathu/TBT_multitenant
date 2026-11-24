import { DataTypes, Model, type Sequelize } from "sequelize"
import { AuthKeyAttributes } from "src/intertfaces/auth-key.interface"

export class AuthKey extends Model<AuthKeyAttributes> implements AuthKeyAttributes {
  declare id: number
  declare secret_key?: string
  declare name?: string
  declare status?: boolean
  declare description?: string
  declare remarks?: string
  declare data?: string
  declare organization_id: number
}

export const initAuthKey = (sequelize: Sequelize): typeof AuthKey => {
  AuthKey.init(
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      secret_key: { type: DataTypes.STRING, unique: true },
      name: DataTypes.STRING,
      status: DataTypes.BOOLEAN,
      description: DataTypes.TEXT("long"),
      remarks: DataTypes.TEXT("long"),
      data: DataTypes.TEXT("long"),
      organization_id: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      sequelize,
      tableName: "auth_keys",
      timestamps: true,
    },
  )

  return AuthKey
}
