import { Sequelize, type Options } from 'sequelize';
import * as dotenv from 'dotenv';

dotenv.config();

const config: Options = {
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT as any,
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,
};

const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD as string,
  config,
);

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (err) {
    console.error('Unable to connect to the database:', err);
    throw err;
  }
};

export { sequelize };
export default sequelize;
