import { DataTypes, Model, type Sequelize } from "sequelize"
import { UserSettingsAttributes } from "src/intertfaces/user-setting.interface"

export class UserSettings extends Model<UserSettingsAttributes> implements UserSettingsAttributes {
  declare id: number
  declare settings?: string
  declare user_id: number
  declare organization_id: number
  declare application_id?: number
}

export const initUserSettings = (sequelize: Sequelize): typeof UserSettings => {
  UserSettings.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      settings: DataTypes.STRING,
      user_id: DataTypes.BIGINT,
      organization_id: { type: DataTypes.INTEGER, allowNull: false },
      application_id: DataTypes.INTEGER,
    },
    {
      sequelize,
      tableName: "user_settings",
      timestamps: true,
    },
  )

  return UserSettings
}
