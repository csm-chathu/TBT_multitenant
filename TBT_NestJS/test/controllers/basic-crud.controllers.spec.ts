import { Test, TestingModule } from '@nestjs/testing';
import { ArgumentMetadata, BadRequestException, NotFoundException, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { InventoryItemBrandController } from 'src/controllers/inventory-item-brand.controller';
import { InventoryItemBrandService } from 'src/services/inventory-item-brand.service';
import { InventoryItemCategoryController } from 'src/controllers/inventory-item-category.controller';
import { InventoryItemCategoryService } from 'src/services/inventory-item-category.service';
import { InventoryItemLocationController } from 'src/controllers/inventory-item-location.controller';
import { InventoryItemLocationService } from 'src/services/inventory-item-location.service';
import { InventoryItemController } from 'src/controllers/inventory-item.controller';
import { InventoryItemService } from 'src/services/inventory-item.service';
import { CustomerController } from 'src/controllers/customer.controller';
import { CustomerService } from 'src/services/customer.service';
import { OrganizationController } from 'src/controllers/organization.controller';
import { OrganizationService } from 'src/services/organization.service';
import { CountryController } from 'src/controllers/country.controller';
import { CountryService } from 'src/services/country.service';
import { StateController } from 'src/controllers/state.controller';
import { StateService } from 'src/services/state.service';
import { IncidentController } from 'src/controllers/incident.controller';
import { IncidentService } from 'src/services/incident.service';
import { BaseOrganizationDto } from 'src/dto/organization/organization.dto';

type CrudConfig = {
  name: string;
  controller: new (...args: any[]) => any;
  service: new (...args: any[]) => any;
  idForCall: number | string;
  idForController?: number | string;
  sampleEntity: any;
  createDto: any;
  updateDto: any;
};

const configs: CrudConfig[] = [
  {
    name: 'InventoryItemBrandController',
    controller: InventoryItemBrandController,
    service: InventoryItemBrandService,
    idForCall: 1,
    sampleEntity: { id: 1, name: 'Brand' },
    createDto: { name: 'Brand' },
    updateDto: { name: 'Brand Updated' },
  },
  {
    name: 'InventoryItemCategoryController',
    controller: InventoryItemCategoryController,
    service: InventoryItemCategoryService,
    idForCall: 2,
    sampleEntity: { id: 2, name: 'Category' },
    createDto: { name: 'Category' },
    updateDto: { name: 'Category Updated' },
  },
  {
    name: 'InventoryItemLocationController',
    controller: InventoryItemLocationController,
    service: InventoryItemLocationService,
    idForCall: 3,
    sampleEntity: { id: 3, name: 'Location' },
    createDto: { name: 'Location' },
    updateDto: { name: 'Location Updated' },
  },
  {
    name: 'InventoryItemController',
    controller: InventoryItemController,
    service: InventoryItemService,
    idForCall: 4,
    sampleEntity: { id: 4, name: 'Item' },
    createDto: { name: 'Item' },
    updateDto: { name: 'Item Updated' },
  },
  {
    name: 'CustomerController',
    controller: CustomerController,
    service: CustomerService,
    idForCall: 5,
    idForController: '5',
    sampleEntity: { id: 5, name: 'Customer' },
    createDto: { name: 'Customer' },
    updateDto: { name: 'Customer Updated' },
  },
  {
    name: 'OrganizationController',
    controller: OrganizationController,
    service: OrganizationService,
    idForCall: 6,
    idForController: '6',
    sampleEntity: { id: 6, name: 'Organization' },
    createDto: { name: 'Organization' },
    updateDto: { name: 'Organization Updated' },
  },
  {
    name: 'CountryController',
    controller: CountryController,
    service: CountryService,
    idForCall: 7,
    sampleEntity: { id: 7, name: 'Country' },
    createDto: { name: 'Country' },
    updateDto: { name: 'Country Updated' },
  },
  {
    name: 'StateController',
    controller: StateController,
    service: StateService,
    idForCall: 8,
    sampleEntity: { id: 8, name: 'State' },
    createDto: { name: 'State' },
    updateDto: { name: 'State Updated' },
  },
  {
    name: 'IncidentController',
    controller: IncidentController,
    service: IncidentService,
    idForCall: 9,
    sampleEntity: { id: 9, name: 'Incident' },
    createDto: { name: 'Incident' },
    updateDto: { name: 'Incident Updated' },
  },
];

describe('CRUD Controllers', () => {
  configs.forEach((cfg) => {
    describe(cfg.name, () => {
      let controller: any;
      let serviceMock: Record<string, jest.Mock>;

      beforeEach(async () => {
        serviceMock = {
          findAll: jest.fn(),
          findOne: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          remove: jest.fn(),
        };

        const countryServiceMock = cfg.service === CountryService ? serviceMock : { findAll: jest.fn() };
        const stateServiceMock = cfg.service === StateService ? serviceMock : { findAll: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
          controllers: [cfg.controller],
          providers: [
            { provide: cfg.service, useValue: serviceMock },
            ...(cfg.service !== CountryService ? [{ provide: CountryService, useValue: countryServiceMock }] : []),
            ...(cfg.service !== StateService ? [{ provide: StateService, useValue: stateServiceMock }] : []),
          ],
        })
          .overrideGuard(JwtAuthGuard)
          .useValue({ canActivate: () => true })
          .compile();

        controller = module.get(cfg.controller);
        jest.clearAllMocks();
      });

      it('returns all resources', async () => {
        serviceMock.findAll.mockResolvedValue([cfg.sampleEntity]);

        await expect(controller.findAll()).resolves.toEqual([cfg.sampleEntity]);
        expect(serviceMock.findAll).toHaveBeenCalledTimes(1);
      });

      it('returns a single resource when found', async () => {
        serviceMock.findOne.mockResolvedValue(cfg.sampleEntity);

        const idForCall = cfg.idForController ?? cfg.idForCall;
        await expect(controller.findOne(idForCall)).resolves.toEqual(cfg.sampleEntity);
        expect(serviceMock.findOne).toHaveBeenCalledWith(cfg.idForCall);
      });

      it('throws NotFoundException when resource missing', async () => {
        serviceMock.findOne.mockResolvedValue(undefined);

        const idForCall = cfg.idForController ?? cfg.idForCall;
        await expect(controller.findOne(idForCall)).rejects.toBeInstanceOf(NotFoundException);
      });

      it('creates a resource', async () => {
        serviceMock.create.mockResolvedValue(cfg.sampleEntity);

        await expect(controller.create(cfg.createDto)).resolves.toEqual(cfg.sampleEntity);
        expect(serviceMock.create).toHaveBeenCalledWith(cfg.createDto);
      });

      it('updates a resource', async () => {
        serviceMock.update.mockResolvedValue(cfg.sampleEntity);

        const idForCall = cfg.idForController ?? cfg.idForCall;
        await expect(controller.update(idForCall, cfg.updateDto)).resolves.toEqual(cfg.sampleEntity);
        expect(serviceMock.update).toHaveBeenCalledWith(cfg.idForCall, cfg.updateDto);
      });

      it('removes a resource', async () => {
        serviceMock.remove.mockResolvedValue(undefined);

        const idForCall = cfg.idForController ?? cfg.idForCall;
        await expect(controller.remove(idForCall)).resolves.toEqual({ deleted: true });
        if (cfg.name === 'CustomerController') {
          expect(serviceMock.remove).toHaveBeenCalledWith(cfg.idForCall, undefined);
        } else {
          expect(serviceMock.remove).toHaveBeenCalledWith(cfg.idForCall);
        }
      });
    });
  });
});

describe('Organization DTO validation', () => {
  const metadata: ArgumentMetadata = { type: 'body', metatype: BaseOrganizationDto };
  const basePayload = {
    name: 'Acme Org',
    status: 'ACTIVE',
    hash: 'acme-hash',
  };
  const invalidEmails = [
    'plainaddress',
    '@missing-local.com',
    'user@.invalid.com',
    'user@domain..com',
    'user@@domain.com',
  ];
  const validEmails = [
    'primary.user@example.com',
    'support+alerts@tbt.io',
    'first.last@company.co.uk',
  ];
  let validationPipe: ValidationPipe;

  beforeEach(() => {
    validationPipe = new ValidationPipe();
  });

  it.each(invalidEmails)('rejects invalid organization email "%s"', async invalidEmail => {
    await expect(
      validationPipe.transform({ ...basePayload, email: invalidEmail }, metadata),
    ).rejects.toThrow(BadRequestException);
  });

  it.each(validEmails)('accepts valid organization email "%s"', async validEmail => {
    await expect(
      validationPipe.transform({ ...basePayload, email: validEmail }, metadata),
    ).resolves.toEqual(expect.objectContaining({ email: validEmail }));
  });
});
