import { DataTypes, Model, type Sequelize } from "sequelize"

export interface CannedReplyAttributes {
  id?: number
  text: string
  application_id?: number | null
  status?: 'pending' | 'approved'
  verification_count?: number
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export class CannedReply extends Model<CannedReplyAttributes> implements CannedReplyAttributes {
  declare id: number
  declare text: string
  declare application_id: number | null
  declare status: 'pending' | 'approved'
  declare verification_count: number
}

export const initCannedReply = (sequelize: Sequelize): typeof CannedReply => {
  CannedReply.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      text: { type: DataTypes.TEXT, allowNull: false },
      application_id: { type: DataTypes.INTEGER, allowNull: true },
      status: { type: DataTypes.ENUM('pending', 'approved'), defaultValue: 'pending', allowNull: false },
      verification_count: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
      deletedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: "canned_reply",
      timestamps: true,
      paranoid: true,
      deletedAt: "deletedAt",
    },
  )

  return CannedReply
}
