import { DataTypes, Model, type Sequelize } from "sequelize"
import { UserAttributes } from "src/intertfaces/user.interface"

export class User extends Model<UserAttributes> implements UserAttributes {
  declare id: number
  declare name?: string
  declare email: string
  declare mobile_number?: string
  declare username?: string
  declare password?: any
  declare status: string
  declare hash: string
  declare remember_token?: string
  declare emailStatus?: string
  declare phoneStatus?: string
  declare email_verified_at?: number
  declare phone_verified_at?: number
  declare passwordResetToken?: string
  declare passwordResetTokenExpiresAt?: number
  declare emailProofToken?: string
  declare emailProofTokenExpiresAt?: number
  declare phoneProofToken?: string
  declare phoneProofTokenExpiresAt?: number
  declare lastSeenAt?: number
  declare isPasswordSet?: boolean
  declare tosAcceptedByIp?: string
}

export const initUser = (sequelize: Sequelize): typeof User => {
  User.init(
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      name: DataTypes.STRING,
      email: { type: DataTypes.STRING, unique: true, allowNull: false },
      mobile_number: DataTypes.STRING,
      username: { type: DataTypes.STRING, unique: true },
      password: DataTypes.STRING,
      status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'inactive' },
      hash: { type: DataTypes.STRING, unique: true, allowNull: false },
      remember_token: DataTypes.STRING,
      emailStatus: { type: DataTypes.STRING, defaultValue: 'unverified' },
      phoneStatus: { type: DataTypes.STRING, defaultValue: 'unverified' },
      email_verified_at: DataTypes.DOUBLE,
      phone_verified_at: DataTypes.DOUBLE,
      passwordResetToken: DataTypes.STRING,
      passwordResetTokenExpiresAt: DataTypes.DOUBLE,
      emailProofToken: DataTypes.STRING,
      emailProofTokenExpiresAt: DataTypes.DOUBLE,
      phoneProofToken: DataTypes.STRING,
      phoneProofTokenExpiresAt: DataTypes.DOUBLE,
      lastSeenAt: DataTypes.DOUBLE,
      isPasswordSet: { type: DataTypes.BOOLEAN, defaultValue: false },
      tosAcceptedByIp: DataTypes.STRING,
      deletedAt: DataTypes.DATE,
      deletedReason: DataTypes.TEXT,
    },
    {
      sequelize,
      tableName: "users",
      timestamps: true,
      paranoid: true,
      deletedAt: 'deletedAt',
    },
  )

  return User
}
