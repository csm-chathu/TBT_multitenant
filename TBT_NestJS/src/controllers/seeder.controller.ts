import { Controller, Post, HttpStatus, HttpException } from '@nestjs/common';
import { seed } from '../seeders/database.seeder';
import { seedKTMG } from '../seeders/ktmg-seeder';

@Controller('seeder')
export class SeederController {
  @Post('run')
  async runSeeder() {
    try {
      console.log('Starting database seeding via HTTP endpoint...');
      await seed();
      return {
        success: true,
        message: 'Database seeding completed successfully!',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error during seeding:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Database seeding failed',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('run-ktmg')
  async runKTMGSeeder() {
    try {
      console.log('Starting KTMG database seeding via HTTP endpoint...');
      await seedKTMG();
      return {
        success: true,
        message: 'KTMG database seeding completed successfully!',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error during KTMG seeding:', error);
      throw new HttpException(
        {
          success: false,
          message: 'KTMG database seeding failed',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

