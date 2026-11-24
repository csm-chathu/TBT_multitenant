import { DataTypes, Model, type Sequelize } from "sequelize"
import { ApplicationAttributes } from "src/intertfaces/application.interface"

export class Application extends Model<ApplicationAttributes> implements ApplicationAttributes {
  declare id: number
  declare name?: string
  declare service_email?: string
  declare service_phone_number?: string
  declare status?: string
  declare description?: string
  declare remarks?: string
  declare hash?: string
  declare organization_id: number
}

export const initApplication = (sequelize: Sequelize): typeof Application => {
  Application.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: DataTypes.STRING,
      service_email: { type: DataTypes.STRING, unique: true },
      service_phone_number: DataTypes.STRING,
      status: { type: DataTypes.STRING, defaultValue: 'inactive' },
      description: DataTypes.TEXT("long"),
      remarks: DataTypes.TEXT("long"),
      hash: { type: DataTypes.STRING, unique: true },
      organization_id: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      sequelize,
      tableName: "applications",
      timestamps: true,
    },
  )

  return Application
}
