import { DataTypes, Model, type Sequelize } from "sequelize"
import { IncidentAttributes } from "src/intertfaces/incident.interface"

export class Incident extends Model<IncidentAttributes> implements IncidentAttributes {
  // Remove public field declarations to avoid shadowing Sequelize's getters/setters
  declare id: number
  declare type?: string
}

export const initIncident = (sequelize: Sequelize): typeof Incident => {
  Incident.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      type: DataTypes.STRING,
    },
    {
      sequelize,
      tableName: "incident",
      timestamps: true,
    },
  )

  return Incident
}
