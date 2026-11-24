import { DataTypes, Model, type Sequelize } from "sequelize"
import { AdminAttributes } from "src/intertfaces/admin.interface"

export class Admin extends Model<AdminAttributes> implements AdminAttributes {
  declare id: number
  declare first_name: string
  declare last_name: string
  declare email: string
  declare mobile_number?: string
  declare phone_number?: string
  declare address_line1?: string
  declare address_line2?: string
  declare city?: string
  declare dob?: Date
  declare sex?: string
  declare status: string
  declare hash: string
  declare salutation_id?: number
  declare user_id?: number
  declare country_id?: number
  declare state_id?: number
}

export const initAdmin = (sequelize: Sequelize): typeof Admin => {
  Admin.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      first_name: { type: DataTypes.STRING, allowNull: false },
      last_name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, unique: true, allowNull: false },
      mobile_number: DataTypes.STRING,
      phone_number: DataTypes.STRING,
      address_line1: DataTypes.STRING,
      address_line2: DataTypes.STRING,
      city: DataTypes.STRING,
      dob: DataTypes.DATE,
      sex: DataTypes.STRING,
      status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'inactive' },
      hash: { type: DataTypes.STRING, allowNull: false },
      salutation_id: DataTypes.INTEGER,
      user_id: DataTypes.BIGINT,
      country_id: DataTypes.INTEGER,
      state_id: DataTypes.INTEGER,
    },
    {
      sequelize,
      tableName: "admins",
      timestamps: true,
    },
  )

  return Admin
}
