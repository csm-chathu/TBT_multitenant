import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
  NotFoundException,
  UseGuards,
  ConflictException,
  InternalServerErrorException,
  Query,
} from '@nestjs/common';
import {
  BaseCustomerDto,
  UpdateCustomerDto,
} from '../dto/customer/customer.dto';
import { CustomerService } from 'src/services/customer.service';
import { CountryService } from 'src/services/country.service';
import { StateService } from 'src/services/state.service';
import { CustomerAttributes } from 'src/intertfaces/customer.interface';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
    private readonly countryService: CountryService,
    private readonly stateService: StateService,
  ) {}

  // GET /customers/create - Get form data for customer creation
  @Get('create')
  async getCreateFormData() {
    const [countries, states] = await Promise.all([
      this.countryService.findAll(),
      this.stateService.findAll(),
    ]);

    return {
      countries,
      states,
    };
  }

  // GET /customers/edit/:id - Get form data + selected customer data for editing
  @Get('edit/:id')
  async getEditFormData(
    @Param('id', ParseIntPipe) id: number,
  ) {
    const [countries, states, customer] = await Promise.all([
      this.countryService.findAll(),
      this.stateService.findAll(),
      this.customerService.findOne(id),
    ]);

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return {
      countries,
      states,
      selectedCustomer: customer,
    };
  }

  @Post()
  @UsePipes(new ValidationPipe())
  async create(
    @Body() createCustomerDto: BaseCustomerDto,
  ): Promise<CustomerAttributes> {
    return this.customerService.create(createCustomerDto);
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.customerService.findAll(
      page ? parseInt(page) : undefined,
      limit ? parseInt(limit) : undefined,
      search,
    );
  }

  @Get(':id/sms-count')
  async getSmsCount(@Param('id', ParseIntPipe) id: number) {
    return this.customerService.getSmsCount(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CustomerAttributes> {
    const customer = await this.customerService.findOne(Number(id));
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
    return customer;
  }

  @Put(':id')
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ): Promise<CustomerAttributes> {
    return this.customerService.update(Number(id), updateCustomerDto);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ): Promise<{ deleted: boolean }> {
    try {
      await this.customerService.remove(Number(id), reason);
      return { deleted: true };
    } catch (err: any) {
      const msg = err?.message || '';
      if (/not found/i.test(msg)) {
        throw new NotFoundException(msg);
      }
      if (/cannot be deleted|has tickets|assigned to/i.test(msg)) {
        throw new ConflictException(msg);
      }
      throw new InternalServerErrorException(msg);
    }
  }
}
