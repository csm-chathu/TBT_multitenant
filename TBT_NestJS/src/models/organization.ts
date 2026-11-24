import { DataTypes, Model, type Sequelize } from "sequelize"
import { OrganizationAttributes } from "src/intertfaces/organization.interface"

export class Organization extends Model<OrganizationAttributes> implements OrganizationAttributes {
  declare id: number
  declare name: string
  declare email: string
  declare phone_number?: string
  declare address_line1?: string
  declare address_line2?: string
  declare city?: string
  declare status: string
  declare hash: string
  declare country_id?: number
  declare state_id?: number
  declare user_id?: number
}

export const initOrganization = (sequelize: Sequelize): typeof Organization => {
  Organization.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, unique: true, allowNull: false },
      email: { type: DataTypes.STRING, unique: true, allowNull: false },
      phone_number: DataTypes.STRING,
      address_line1: DataTypes.STRING,
      address_line2: DataTypes.STRING,
      city: DataTypes.STRING,
      status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'inactive' },
      hash: { type: DataTypes.STRING, unique: true, allowNull: false },
      country_id: DataTypes.INTEGER,
      state_id: DataTypes.INTEGER,
      user_id: DataTypes.BIGINT,
    },
    {
      sequelize,
      tableName: "organizations",
      timestamps: true,
    },
  )

  return Organization
}
