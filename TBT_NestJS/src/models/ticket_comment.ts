import { DataTypes, Model, type Sequelize } from "sequelize"
import { TicketCommentAttributes } from "src/intertfaces/ticket-comment.interface"

export class TicketComment extends Model<TicketCommentAttributes> implements TicketCommentAttributes {
  declare id: number
  declare comment: string
  declare data?: string
  declare remarks?: string
  declare type?: string
  declare resources?: string
  declare ticket_id: number
  declare parent_id?: number
  declare from?: number
  declare to?: number
}

export const initTicketComment = (sequelize: Sequelize): typeof TicketComment => {
  TicketComment.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      comment: DataTypes.TEXT("long"),
      data: DataTypes.TEXT("long"),
      remarks: DataTypes.TEXT("long"),
      type: DataTypes.STRING,
      resources: DataTypes.TEXT("long"),
      ticket_id: DataTypes.INTEGER,
      parent_id: DataTypes.INTEGER,
      from: DataTypes.BIGINT,
      to: DataTypes.BIGINT,
    },
    {
      sequelize,
      tableName: "ticket_comments",
      timestamps: true,
    },
  )

  return TicketComment
}
