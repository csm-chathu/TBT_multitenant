import { Controller, Post, Res, Query } from '@nestjs/common';
import { Response } from 'express';
import { sequelize } from '../models';

@Controller('migrate')
export class MigrateController {
  @Post()
  async migrate(@Res() res: Response, @Query('alter') alter?: string) {
    try {
      const doAlter = String(alter).toLowerCase() === 'true'
      await sequelize.sync({ force: false, alter: doAlter });
      // Drop legacy ticket_reads table if it still exists
      await sequelize.query('DROP TABLE IF EXISTS `ticket_reads`').catch(() => null);
      res.json({ success: true, message: 'Database migrated successfully.', alter: doAlter });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}


export default MigrateController;

