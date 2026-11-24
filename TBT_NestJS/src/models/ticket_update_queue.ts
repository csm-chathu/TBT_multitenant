import { DataTypes, Model, type Sequelize } from "sequelize";

export class TicketUpdateQueue extends Model {
  declare id: number;
  declare ticket_id?: number | null;
  declare event_type: string;
  declare status: boolean;
  declare priority: string;
  declare payload?: string | object | null;
  declare error_message?: string | null;
  declare processed_at?: Date | null;
  declare created_by?: number | null;
  declare createdAt?: Date;
  declare updatedAt?: Date;
  declare deletedAt?: Date | null;
}

export const initTicketUpdateQueue = (sequelize: Sequelize): typeof TicketUpdateQueue => {
  TicketUpdateQueue.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ticket_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      event_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      priority: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'medium',
      },
      payload: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
        get() {
          const raw = this.getDataValue('payload');
          if (!raw) return null;
          if (typeof raw === 'object') return raw;
          try {
            return JSON.parse(raw);
          } catch {
            return raw;
          }
        },
        set(value: any) {
          if (value === null || value === undefined) {
            this.setDataValue('payload', null as any);
          } else if (typeof value === 'object') {
            this.setDataValue('payload', JSON.stringify(value));
          } else {
            this.setDataValue('payload', value);
          }
        },
      },
      error_message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      processed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "ticket_update_queue",
      timestamps: true,
      paranoid: true,
    },
  );

  return TicketUpdateQueue;
};
