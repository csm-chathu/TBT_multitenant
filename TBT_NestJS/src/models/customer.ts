import { DataTypes, Model, type Sequelize } from "sequelize"
import { CustomerAttributes } from "src/intertfaces/customer.interface"

export class Customer extends Model<CustomerAttributes> implements CustomerAttributes {
  declare id: number
  declare first_name: string
  declare last_name?: string
  declare email: string
  declare mobile_number?: string
  declare phone_number?: string
  declare address_line1?: string
  declare address_line2?: string
  declare city?: string
  declare dob?: string
  declare sex?: string
  declare status: string
  declare hash: string
  declare description?: string
  declare remarks?: string
  declare data?: string
  declare salutation_id?: number
  declare user_id?: number
  declare country_id?: number
  declare state_id?: number
  declare deletedAt?: Date | null
  declare deletedReason?: string | null
  declare tag?: string | null
}

export const initCustomer = (sequelize: Sequelize): typeof Customer => {
  Customer.init(
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      first_name: { type: DataTypes.STRING, allowNull: false },
      last_name: DataTypes.STRING,
      email: { type: DataTypes.STRING, unique: true, allowNull: false },
      mobile_number: DataTypes.STRING,
      phone_number: DataTypes.STRING,
      address_line1: DataTypes.STRING,
      address_line2: DataTypes.STRING,
      city: DataTypes.STRING,
      dob: DataTypes.STRING,
      sex: DataTypes.STRING,
      status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'inactive' },
      hash: { type: DataTypes.STRING, unique: true, allowNull: false },
      description: DataTypes.TEXT("long"),
      remarks: DataTypes.TEXT("long"),
      data: DataTypes.TEXT("long"),
      salutation_id: DataTypes.INTEGER,
      user_id: DataTypes.BIGINT,
      country_id: DataTypes.INTEGER,
      state_id: DataTypes.INTEGER,
      deletedAt: DataTypes.DATE,
      deletedReason: { type: DataTypes.TEXT, field: 'deleted_reason' },
      tag: { type: DataTypes.STRING, allowNull: true },
    },
    {
      sequelize,
      tableName: "customers",
      timestamps: true,
      paranoid: true,
      deletedAt: 'deletedAt',
    },
  )

  return Customer
}
