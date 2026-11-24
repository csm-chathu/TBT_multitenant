import { DataTypes, Model, type Sequelize } from "sequelize";
import { NoteAttributes } from "src/intertfaces/note.interface";

export class Note extends Model<NoteAttributes> implements NoteAttributes {
  declare id: number;
  declare user_id?: number;
  declare title: string;
  declare content?: any;
  declare createdAt?: Date;
  declare updatedAt?: Date;
  declare deletedAt?: Date;
}

export const initNote = (sequelize: Sequelize): typeof Note => {
  Note.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Untitled',
      },
      content: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
        get() {
          const raw = this.getDataValue('content');
          if (!raw) return null;
          if (typeof raw === 'object') return raw;
          try {
            return JSON.parse(raw);
          } catch {
            return raw;
          }
        },
        set(value: any) {
          if (typeof value === 'object' && value !== null) {
            this.setDataValue('content', JSON.stringify(value));
          } else {
            this.setDataValue('content', value);
          }
        },
      },
      deletedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: 'notes',
      timestamps: true,
      paranoid: true,
      deletedAt: 'deletedAt',
    },
  );

  return Note;
};
