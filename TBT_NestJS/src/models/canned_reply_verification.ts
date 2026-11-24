import { DataTypes, Model, type Sequelize } from "sequelize"

export interface CannedReplyVerificationAttributes {
  id?: number
  canned_reply_id: number
  user_id: number
  createdAt?: Date
}

export class CannedReplyVerification extends Model<CannedReplyVerificationAttributes> implements CannedReplyVerificationAttributes {
  declare id: number
  declare canned_reply_id: number
  declare user_id: number
}

export const initCannedReplyVerification = (sequelize: Sequelize): typeof CannedReplyVerification => {
  CannedReplyVerification.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      canned_reply_id: { type: DataTypes.INTEGER, allowNull: false },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      sequelize,
      tableName: "canned_reply_verification",
      timestamps: true,
      updatedAt: false,
    },
  )

  return CannedReplyVerification
}
