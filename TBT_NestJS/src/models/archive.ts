import { DataTypes, Model, type Sequelize } from "sequelize"
import { ArchiveAttributes } from "src/intertfaces/archive.interface"

export class Archive extends Model<ArchiveAttributes> implements ArchiveAttributes {
  declare id: number
  declare fromModel?: string
  declare originalRecord?: string
  declare originalRecordId?: string
}

export const initArchive = (sequelize: Sequelize): typeof Archive => {
  Archive.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      fromModel: DataTypes.STRING,
      originalRecord: DataTypes.TEXT("long"),
      originalRecordId: DataTypes.TEXT("long"),
    },
    {
      sequelize,
      tableName: "archive",
      timestamps: true,
    },
  )

  return Archive
}
