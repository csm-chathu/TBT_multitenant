import { DataTypes, Model, type Sequelize } from "sequelize"
import { WhitelistedDomainAttributes } from "src/intertfaces/whitelisted-domain.interface"

export class WhitelistedDomain extends Model<WhitelistedDomainAttributes> implements WhitelistedDomainAttributes {
  declare id: number
  declare domain?: string
  declare status?: boolean
  declare description?: string
  declare remarks?: string
  declare data?: string
}

export const initWhitelistedDomain = (sequelize: Sequelize): typeof WhitelistedDomain => {
  WhitelistedDomain.init(
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      domain: { type: DataTypes.STRING, unique: true },
      status: DataTypes.BOOLEAN,
      description: DataTypes.TEXT("long"),
      remarks: DataTypes.TEXT("long"),
      data: DataTypes.TEXT("long"),
    },
    {
      sequelize,
      tableName: "whitelisted_domains",
      timestamps: true,
    },
  )

  return WhitelistedDomain
}
