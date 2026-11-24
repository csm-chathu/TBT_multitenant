import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as csv from 'csv-parser';
import { InventoryItemService } from './inventory-item.service';
import { InventoryItemCategoryService } from './inventory-item-category.service';
import { InventoryItemBrandService } from './inventory-item-brand.service';
import { InventoryItemLocationService } from './inventory-item-location.service';
import { CountryRepository } from '../repositories/country.repository';
import { InventoryItemCategoryRepository } from '../repositories/inventory-item-category.repository';
import { InventoryItemBrandRepository } from '../repositories/inventory-item-brand.repository';
import { InventoryItemLocationRepository } from '../repositories/inventory-item-location.repository';
import { InventoryItemRepository } from '../repositories/inventory-item.repository';
import { normalizeName } from '../util/helper/name.helper';
import { generateHash } from '../util/helper/hash.helper';
import { BaseInventoryItemDto } from '../dto/inventory-item/inventory-item.dto';
import { BaseInventoryItemCategoryDto } from '../dto/inventory-item-category/inventory-item-category.dto';
import { BaseInventoryItemBrandDto } from '../dto/inventory-item-brand/inventory-item-brand.dto';
import { BaseInventoryItemLocationDto } from '../dto/inventory-item-location/inventory-item-location.dto';

export interface CsvRowError {
  index: number;
  field: string;
  message: string;
}

export interface CsvUploadResult {
  errors: CsvRowError[];
  totalRecords: number;
  errorRecords: number;
  successRecords: number;
  errorRows?: any[];
}

@Injectable()
export class InventoryCsvService {
  private readonly logger = new Logger(InventoryCsvService.name);

  constructor(
    private readonly inventoryItemService: InventoryItemService,
    private readonly inventoryItemCategoryService: InventoryItemCategoryService,
    private readonly inventoryItemBrandService: InventoryItemBrandService,
    private readonly inventoryItemLocationService: InventoryItemLocationService,
    private readonly countryRepository: CountryRepository,
    private readonly inventoryItemCategoryRepository: InventoryItemCategoryRepository,
    private readonly inventoryItemBrandRepository: InventoryItemBrandRepository,
    private readonly inventoryItemLocationRepository: InventoryItemLocationRepository,
    private readonly inventoryItemRepository: InventoryItemRepository,
  ) {}

  /**
   * Parse CSV file from buffer
   */
  async parseCsvFile(file: Express.Multer.File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      let stream: NodeJS.ReadableStream;

      // Prefer path (disk storage), fallback to buffer
      if (file.path) {
        stream = fs.createReadStream(file.path);
      } else if (file.buffer) {
        stream = Readable.from(file.buffer);
      } else {
        reject(new Error('No file data to parse'));
        return;
      }

      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  }

  /**
   * Process CSV data and create inventory items
   * @param data CSV row data
   * @param defaultOrganizationId Optional default organization ID for location creation
   */
  async processCsvData(data: any[], defaultOrganizationId?: number): Promise<CsvUploadResult> {
    const errors: CsvRowError[] = [];
    let successCount = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const index = i;
      const rowErrors: CsvRowError[] = [];

      let categoryId: number | undefined;
      let brandId: number | undefined;
      let locationId: number | undefined;

      // Validate and process Category
      if (row.Category && row.Category.trim().length > 0) {
        try {
          const categoryName = normalizeName(row.Category);
          
          // Check if category already exists (non-deleted)
          let existingCategories = await this.inventoryItemCategoryRepository.findByName(categoryName);
          
          if (existingCategories.length > 0) {
            // Category exists and is active - use existing ID
            categoryId = existingCategories[0].id;
          } else {
            // Check if category was soft-deleted
            const deletedCategories = await this.inventoryItemCategoryRepository.findByNameIncludingDeleted(categoryName);
            const deletedCategory = deletedCategories.find((cat: any) => cat.deletedAt !== null);
            
            if (deletedCategory) {
              // Category was deleted - restore it
              await deletedCategory.restore();
              categoryId = deletedCategory.id;
            } else {
              // Category doesn't exist - create new one
              try {
                const categoryDto: BaseInventoryItemCategoryDto = {
                  name: categoryName,
                  label: row.Category.trim(),
                  hash: generateHash('cat'),
                };
                const newCategory = await this.inventoryItemCategoryService.create(categoryDto);
                categoryId = newCategory.id;
              } catch (error: any) {
                // Handle race condition: category was created by another process
                if (
                  error?.name === 'SequelizeUniqueConstraintError' ||
                  error?.original?.code === 'ER_DUP_ENTRY'
                ) {
                  // Find the existing category that was just created
                  const categories = await this.inventoryItemCategoryRepository.findByNameIncludingDeleted(categoryName);
                  const found = categories.find((cat: any) => cat.deletedAt === null);
                  if (found) {
                    categoryId = found.id;
                  } else {
                    // Try to restore if it was just created as deleted
                    const deleted = categories.find((cat: any) => cat.deletedAt !== null);
                    if (deleted) {
                      await deleted.restore();
                      categoryId = deleted.id;
                    } else {
                      this.logger.error(`Error creating category for row ${index}: Category already exists but could not be found`, error);
                      rowErrors.push({
                        index,
                        field: 'category',
                        message: `Error creating category: Category already exists but could not be retrieved.`,
                      });
                    }
                  }
                } else {
                  this.logger.error(`Error creating category for row ${index}:`, error);
                  rowErrors.push({
                    index,
                    field: 'category',
                    message: `Error creating category: ${error.message}`,
                  });
                }
              }
            }
          }
        } catch (error) {
          this.logger.error(`Error processing category for row ${index}:`, error);
          rowErrors.push({
            index,
            field: 'category',
            message: `Error processing category: ${error.message}`,
          });
        }
      } else {
        rowErrors.push({
          index,
          field: 'category',
          message: 'Category is not defined.',
        });
      }

      // Validate and process Location and Country
      const locationValue = row.Location || row.location;
      const countryValue = row.Country || row.country;

      if (locationValue && locationValue.trim().length > 0 && countryValue && countryValue.trim().length > 0) {
        try {
          const locationName = normalizeName(locationValue);
          const countryName = normalizeName(countryValue);

          const country = await this.countryRepository.findByName(countryName);

          if (!country) {
            rowErrors.push({
              index,
              field: 'country',
              message: `Invalid Country name(${row.Country}).`,
            });
          } else {
            // Check if location already exists (non-deleted)
            let existingLocation = await this.inventoryItemLocationRepository.findByNameAndCountry(
              locationName,
              country.id,
            );

            if (existingLocation) {
              // Location exists and is active - use existing ID
              locationId = existingLocation.id;
            } else {
              // Check if location was soft-deleted
              const deletedLocation = await this.inventoryItemLocationRepository.findByNameAndCountryIncludingDeleted(
                locationName,
                country.id,
              );
              
              if (deletedLocation && deletedLocation.deletedAt) {
                // Location was deleted - restore it
                await deletedLocation.restore();
                locationId = deletedLocation.id;
              } else {
                // Location doesn't exist - create new one
                try {
                  const locationDto: BaseInventoryItemLocationDto = {
                    name: locationName,
                    label: locationValue.trim(),
                    country_id: country.id,
                    hash: generateHash('loc'),
                  };

                  // If a default organization was provided, attach it; otherwise leave undefined
                  if (defaultOrganizationId) {
                    locationDto.organization_id = defaultOrganizationId;
                  }

                  const newLocation = await this.inventoryItemLocationService.create(locationDto);
                  locationId = newLocation.id;
                } catch (error: any) {
                  // Handle race condition: location was created by another process
                  if (
                    error?.name === 'SequelizeUniqueConstraintError' ||
                    error?.original?.code === 'ER_DUP_ENTRY'
                  ) {
                    // Find the existing location that was just created
                    const location = await this.inventoryItemLocationRepository.findByNameAndCountryIncludingDeleted(
                      locationName,
                      country.id,
                    );
                    if (location) {
                      if (location.deletedAt) {
                        // Restore if it was deleted
                        await location.restore();
                      }
                      locationId = location.id;
                    } else {
                      this.logger.error(`Error creating location for row ${index}: Location already exists but could not be found`, error);
                      rowErrors.push({
                        index,
                        field: 'location',
                        message: `Error creating location: Location already exists but could not be retrieved.`,
                      });
                    }
                  } else {
                    this.logger.error(`Error creating location for row ${index}:`, error);
                    rowErrors.push({
                      index,
                      field: 'location',
                      message: `Error creating location: ${error.message}`,
                    });
                  }
                }
              }
            }
          }
        } catch (error) {
          this.logger.error(`Error processing location for row ${index}:`, error);
          rowErrors.push({
            index,
            field: 'location',
            message: `Error processing location: ${error.message}`,
          });
        }
      } else {
        if (!(row.Country && row.Country.trim().length > 0)) {
          rowErrors.push({
            index,
            field: 'country',
            message: 'Country is not defined.',
          });
        }
        if (!(row.Location && row.Location.trim().length > 0)) {
          rowErrors.push({
            index,
            field: 'location',
            message: 'Location is not defined.',
          });
        }
      }

      // Validate and process Brand
      if (row.Brand && row.Brand.trim().length > 0) {
        try {
          const brandName = normalizeName(row.Brand);
          
          // Check if brand already exists (non-deleted)
          let existingBrands = await this.inventoryItemBrandRepository.findByName(brandName);
          
          if (existingBrands.length > 0) {
            // Brand exists and is active - use existing ID
            brandId = existingBrands[0].id;
          } else {
            // Check if brand was soft-deleted
            const deletedBrands = await this.inventoryItemBrandRepository.findByNameIncludingDeleted(brandName);
            const deletedBrand = deletedBrands.find((brand: any) => brand.deletedAt !== null);
            
            if (deletedBrand) {
              // Brand was deleted - restore it
              await deletedBrand.restore();
              brandId = deletedBrand.id;
            } else {
              // Brand doesn't exist - create new one
              try {
                const brandDto: BaseInventoryItemBrandDto = {
                  name: brandName,
                  label: row.Brand.trim(),
                  hash: generateHash('brand'),
                };
                const newBrand = await this.inventoryItemBrandService.create(brandDto);
                brandId = newBrand.id;
              } catch (error: any) {
                // Handle race condition: brand was created by another process
                if (
                  error?.name === 'SequelizeUniqueConstraintError' ||
                  error?.original?.code === 'ER_DUP_ENTRY'
                ) {
                  // Find the existing brand that was just created
                  const brands = await this.inventoryItemBrandRepository.findByNameIncludingDeleted(brandName);
                  const found = brands.find((brand: any) => brand.deletedAt === null);
                  if (found) {
                    brandId = found.id;
                  } else {
                    // Try to restore if it was just created as deleted
                    const deleted = brands.find((brand: any) => brand.deletedAt !== null);
                    if (deleted) {
                      await deleted.restore();
                      brandId = deleted.id;
                    } else {
                      this.logger.error(`Error creating brand for row ${index}: Brand already exists but could not be found`, error);
                      rowErrors.push({
                        index,
                        field: 'brand',
                        message: `Error creating brand: Brand already exists but could not be retrieved.`,
                      });
                    }
                  }
                } else {
                  this.logger.error(`Error creating brand for row ${index}:`, error);
                  rowErrors.push({
                    index,
                    field: 'brand',
                    message: `Error creating brand: ${error.message}`,
                  });
                }
              }
            }
          }
        } catch (error) {
          this.logger.error(`Error processing brand for row ${index}:`, error);
          rowErrors.push({
            index,
            field: 'brand',
            message: `Error processing brand: ${error.message}`,
          });
        }
      } else {
        rowErrors.push({
          index,
          field: 'brand',
          message: 'Brand is not defined.',
        });
      }

      // Validate Item Name
      if (!(row.Name && row.Name.trim().length > 0)) {
        rowErrors.push({
          index,
          field: 'name',
          message: 'Item name is not defined.',
        });
      }

      // Validate Serial Number uniqueness
      if (row.SerialNo && row.SerialNo.trim().length > 0) {
        try {
          const itemsWithSerialNo = await this.inventoryItemRepository.findBySerialNo(row.SerialNo.trim());
          if (itemsWithSerialNo.length > 0) {
            rowErrors.push({
              index,
              field: 'SerialNo',
              message: `Item serial No(${row.SerialNo}) is already exist.`,
            });
          }
        } catch (error) {
          this.logger.error(`Error checking serial number for row ${index}:`, error);
        }
      }

      // Create inventory item if no errors
      if (rowErrors.length === 0 && categoryId && locationId) {
        try {
          const itemDto: BaseInventoryItemDto = {
            category_id: categoryId,
            brand_id: brandId,
            location_id: locationId,
            hash: generateHash('item'),
            user: row.User ? row.User.trim() : undefined,
            name: row.Name.trim(),
            description: row.Description ? row.Description.trim() : undefined,
            condition: row.Condition ? row.Condition.trim() : undefined,
            ownership: row.Ownership ? row.Ownership.trim() : undefined,
            serialNo: row.SerialNo ? row.SerialNo.trim() : undefined,
            ipAddress: row.IpAddress ? row.IpAddress.trim() : undefined,
            purchasedAt: row.PurchasedDate ? row.PurchasedDate.trim() : undefined,
            remarks: row.Remarks ? row.Remarks.trim() : undefined,
            data: row.Data ? row.Data.trim() : undefined,
          };

          await this.inventoryItemService.create(itemDto);
          successCount++;
        } catch (error) {
          this.logger.error(`Error creating inventory item for row ${index}:`, error);
          rowErrors.push({
            index,
            field: 'item',
            message: `Error creating item: ${error.message}`,
          });
        }
      }

      // Add row errors to main errors array
      errors.push(...rowErrors);
    }

    // Build error rows for response
    const errorRows: any[] = [];
    const errorIndices = new Set(errors.map((e) => e.index));
    errorIndices.forEach((index) => {
      const rowErrors = errors.filter((e) => e.index === index);
      const errorRow = { ...data[index] };
      errorRow.id = index + 1;
      errorRow.errors = rowErrors.map((e) => e.message).join('; ');
      errorRows.push(errorRow);
    });

    return {
      errors,
      totalRecords: data.length,
      errorRecords: errorIndices.size,
      successRecords: successCount,
      errorRows,
    };
  }

  /**
   * Main method to handle CSV upload
   * @param file CSV file to upload
   * @param defaultOrganizationId Optional default organization ID for location creation
   */
  async uploadCsv(file: Express.Multer.File, defaultOrganizationId?: number): Promise<CsvUploadResult> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type
    const ext = (file.originalname || '').toLowerCase();
    if (file.mimetype !== 'text/csv' && !ext.endsWith('.csv')) {
      throw new BadRequestException('Invalid file type. Only CSV files are allowed.');
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds maximum limit of 10MB');
    }

    // Parse CSV
    const csvData = await this.parseCsvFile(file);

    if (csvData.length === 0) {
      throw new BadRequestException('CSV file is empty');
    }

    // Process CSV data
    return await this.processCsvData(csvData, defaultOrganizationId);
  }
}

