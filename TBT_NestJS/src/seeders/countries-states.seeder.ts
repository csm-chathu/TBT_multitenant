import { sequelize } from '../config/database';
// Import only country/state models
import { initCountry } from '../models/country';
import { initState } from '../models/state';

export async function seedCountriesStates() {
  try {
    console.log('Seeding countries and states (countries-states.seeder.ts)...');

    const CountryModel = initCountry(sequelize);
    const StateModel = initState(sequelize);

    // Ensure tables exist (non-destructive)
    await sequelize.sync({ alter: false });

    const countries = await CountryModel.bulkCreate(
      [
        { name: 'United States', label: 'US', createdAt: new Date() },
        { name: 'Sri Lanka', label: 'LK', createdAt: new Date() },
      ],
      { ignoreDuplicates: true }
    );

    console.log('Countries seeded (may be ignored if duplicates):', countries.length || 2);

    // If bulkCreate returns empty array because of ignoreDuplicates, try to fetch countries
    let usCountry = countries && countries.find((c: any) => c.label === 'US');
    let lkCountry = countries && countries.find((c: any) => c.label === 'LK');
    if (!usCountry || !lkCountry) {
      const all = await CountryModel.findAll({ where: { label: ['US', 'LK'] } });
      usCountry = all.find((c: any) => c.label === 'US');
      lkCountry = all.find((c: any) => c.label === 'LK');
    }

    if (!usCountry || !lkCountry) {
      throw new Error('Failed to ensure countries exist');
    }

    const statesSeed = [
      // US (a representative full list)
      { name: 'Alabama', label: 'AL', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Alaska', label: 'AK', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Arizona', label: 'AZ', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Arkansas', label: 'AR', country_id: usCountry.id, createdAt: new Date() },
      { name: 'California', label: 'CA', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Colorado', label: 'CO', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Connecticut', label: 'CT', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Delaware', label: 'DE', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Florida', label: 'FL', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Georgia', label: 'GA', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Hawaii', label: 'HI', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Idaho', label: 'ID', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Illinois', label: 'IL', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Indiana', label: 'IN', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Iowa', label: 'IA', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Kansas', label: 'KS', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Kentucky', label: 'KY', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Louisiana', label: 'LA', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Maine', label: 'ME', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Maryland', label: 'MD', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Massachusetts', label: 'MA', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Michigan', label: 'MI', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Minnesota', label: 'MN', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Mississippi', label: 'MS', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Missouri', label: 'MO', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Montana', label: 'MT', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Nebraska', label: 'NE', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Nevada', label: 'NV', country_id: usCountry.id, createdAt: new Date() },
      { name: 'New Hampshire', label: 'NH', country_id: usCountry.id, createdAt: new Date() },
      { name: 'New Jersey', label: 'NJ', country_id: usCountry.id, createdAt: new Date() },
      { name: 'New Mexico', label: 'NM', country_id: usCountry.id, createdAt: new Date() },
      { name: 'New York', label: 'NY', country_id: usCountry.id, createdAt: new Date() },
      { name: 'North Carolina', label: 'NC', country_id: usCountry.id, createdAt: new Date() },
      { name: 'North Dakota', label: 'ND', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Ohio', label: 'OH', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Oklahoma', label: 'OK', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Oregon', label: 'OR', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Pennsylvania', label: 'PA', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Rhode Island', label: 'RI', country_id: usCountry.id, createdAt: new Date() },
      { name: 'South Carolina', label: 'SC', country_id: usCountry.id, createdAt: new Date() },
      { name: 'South Dakota', label: 'SD', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Tennessee', label: 'TN', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Texas', label: 'TX', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Utah', label: 'UT', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Vermont', label: 'VT', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Virginia', label: 'VA', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Washington', label: 'WA', country_id: usCountry.id, createdAt: new Date() },
      { name: 'West Virginia', label: 'WV', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Wisconsin', label: 'WI', country_id: usCountry.id, createdAt: new Date() },
      { name: 'Wyoming', label: 'WY', country_id: usCountry.id, createdAt: new Date() },
      { name: 'District of Columbia', label: 'DC', country_id: usCountry.id, createdAt: new Date() },

      // Sri Lanka Provinces
      { name: 'Western Province', label: 'WP', country_id: lkCountry.id, createdAt: new Date() },
      { name: 'Central Province', label: 'CP', country_id: lkCountry.id, createdAt: new Date() },
      { name: 'Southern Province', label: 'SP', country_id: lkCountry.id, createdAt: new Date() },
      { name: 'Northern Province', label: 'NP', country_id: lkCountry.id, createdAt: new Date() },
      { name: 'Eastern Province', label: 'EP', country_id: lkCountry.id, createdAt: new Date() },
      { name: 'North Western Province', label: 'NWP', country_id: lkCountry.id, createdAt: new Date() },
      { name: 'North Central Province', label: 'NCP', country_id: lkCountry.id, createdAt: new Date() },
      { name: 'Uva Province', label: 'UP', country_id: lkCountry.id, createdAt: new Date() },
      { name: 'Sabaragamuwa Province', label: 'SGP', country_id: lkCountry.id, createdAt: new Date() },
    ];

    const createdStates = await StateModel.bulkCreate(statesSeed, { ignoreDuplicates: true });
    console.log('States seeded (may be ignored if duplicates):', createdStates.length || statesSeed.length);

    console.log('countries-states seeding finished.');
  } catch (err) {
    console.error('Error in countries-states seeder:', err);
    throw err;
  }
}

// Allow running directly with ts-node
if (require.main === module) {
  seedCountriesStates()
    .then(() => {
      console.log('Done');
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
