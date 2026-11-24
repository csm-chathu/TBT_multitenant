import { sequelize } from '../config/database';
import * as bcrypt from 'bcrypt';
import { Op } from 'sequelize';

// Import and initialize all models
import { initCountry } from '../models/country';
import { initState } from '../models/state';
import { initSalutation } from '../models/salutation';
import { initPrivilege } from '../models/privilege';
import { initRole } from '../models/role';
import { initOrganization } from '../models/organization';
import { initTeam } from '../models/team';
import { initUser } from '../models/user';
import { initUserRole } from '../models/user_role';
import { initAgent } from '../models/agent';
import { initCustomer } from '../models/customer';
import { initInventoryItemCategory } from '../models/inventory_item_category';
import { initInventoryItemBrand } from '../models/inventory_item_brand';
import { initInventoryItemLocation } from '../models/inventory_item_location';
import { initInventoryItem } from '../models/inventory_item';
import { initInventoryItemUserLog } from '../models/inventory_item_user_log';
import { initTicketTemplate } from '../models/ticket_template';
import { initTicketStats } from '../models/ticket_stats';
import { initWhitelistedDomain } from '../models/whitelisted_domain';
import { initAdmin } from '../models/admin';
import { initApplication } from '../models/application';
import { initAuthKey } from '../models/auth_key';
import { initIncident } from '../models/incident';
import { initMessage } from '../models/message';
import { initNotification } from '../models/notification';
import { initTeamRoles } from '../models/team_roles';
import { initTeamAgent } from '../models/team_agent';
import { initTeamApplication } from '../models/team_application';
import { initTicket } from '../models/ticket';
import { initTicketHistory } from '../models/ticket_history';
import { initTicketComment } from '../models/ticket_comment';
import { initTicketsResource } from '../models/tickets_resource';
import { initUserSettings } from '../models/user_settings';
import { initArchive } from '../models/archive';

export async function seedKTMG() {
  try {
    console.log('Starting KTMG database seeding...');

    // Initialize all models first (to create all tables)
    console.log('Initializing all models...');
    const CountryModel = initCountry(sequelize);
    const StateModel = initState(sequelize);
    const SalutationModel = initSalutation(sequelize);
    const PrivilegeModel = initPrivilege(sequelize);
    const RoleModel = initRole(sequelize);
    const OrganizationModel = initOrganization(sequelize);
    const TeamModel = initTeam(sequelize);
    const UserModel = initUser(sequelize);
    const UserRoleModel = initUserRole(sequelize);
    const AgentModel = initAgent(sequelize);
    const CustomerModel = initCustomer(sequelize);
    const InventoryItemCategoryModel = initInventoryItemCategory(sequelize);
    const InventoryItemBrandModel = initInventoryItemBrand(sequelize);
    const InventoryItemLocationModel = initInventoryItemLocation(sequelize);
    const InventoryItemModel = initInventoryItem(sequelize);
    const InventoryItemUserLogModel = initInventoryItemUserLog(sequelize);
    const TicketTemplateModel = initTicketTemplate(sequelize);
    const TicketStatsModel = initTicketStats(sequelize);
    const WhitelistedDomainModel = initWhitelistedDomain(sequelize);
    const AdminModel = initAdmin(sequelize);
    const ApplicationModel = initApplication(sequelize);
    const AuthKeyModel = initAuthKey(sequelize);
    const IncidentModel = initIncident(sequelize);
    const MessageModel = initMessage(sequelize);
    const NotificationModel = initNotification(sequelize);
    const TeamRolesModel = initTeamRoles(sequelize);
    const TeamAgentModel = initTeamAgent(sequelize);
    const TeamApplicationModel = initTeamApplication(sequelize);
    const TicketModel = initTicket(sequelize);
    const TicketHistoryModel = initTicketHistory(sequelize);
    const TicketCommentModel = initTicketComment(sequelize);
    const TicketsResourceModel = initTicketsResource(sequelize);
    const UserSettingsModel = initUserSettings(sequelize);
    const ArchiveModel = initArchive(sequelize);

    // Sync all models (create tables if they don't exist)
    console.log('Syncing database tables...');
    await sequelize.sync({ alter: false });
    console.log('Database tables synced successfully');

    // Create Countries
    const countries = await CountryModel.bulkCreate([
      { name: 'United States', label: 'US', createdAt: new Date() },
      { name: 'Sri Lanka', label: 'LK', createdAt: new Date() },
    ]);
    console.log('Countries created:', countries.length);

    // Create States
    const states = await StateModel.bulkCreate([
      // ======================
      // USA States
      // ======================
      { name: 'Alabama', label: 'AL', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Alaska', label: 'AK', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Arizona', label: 'AZ', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Arkansas', label: 'AR', country_id: countries[0].id, createdAt: new Date() },
      { name: 'California', label: 'CA', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Colorado', label: 'CO', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Connecticut', label: 'CT', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Delaware', label: 'DE', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Florida', label: 'FL', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Georgia', label: 'GA', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Hawaii', label: 'HI', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Idaho', label: 'ID', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Illinois', label: 'IL', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Indiana', label: 'IN', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Iowa', label: 'IA', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Kansas', label: 'KS', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Kentucky', label: 'KY', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Louisiana', label: 'LA', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Maine', label: 'ME', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Maryland', label: 'MD', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Massachusetts', label: 'MA', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Michigan', label: 'MI', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Minnesota', label: 'MN', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Mississippi', label: 'MS', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Missouri', label: 'MO', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Montana', label: 'MT', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Nebraska', label: 'NE', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Nevada', label: 'NV', country_id: countries[0].id, createdAt: new Date() },
      { name: 'New Hampshire', label: 'NH', country_id: countries[0].id, createdAt: new Date() },
      { name: 'New Jersey', label: 'NJ', country_id: countries[0].id, createdAt: new Date() },
      { name: 'New Mexico', label: 'NM', country_id: countries[0].id, createdAt: new Date() },
      { name: 'New York', label: 'NY', country_id: countries[0].id, createdAt: new Date() },
      { name: 'North Carolina', label: 'NC', country_id: countries[0].id, createdAt: new Date() },
      { name: 'North Dakota', label: 'ND', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Ohio', label: 'OH', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Oklahoma', label: 'OK', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Oregon', label: 'OR', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Pennsylvania', label: 'PA', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Rhode Island', label: 'RI', country_id: countries[0].id, createdAt: new Date() },
      { name: 'South Carolina', label: 'SC', country_id: countries[0].id, createdAt: new Date() },
      { name: 'South Dakota', label: 'SD', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Tennessee', label: 'TN', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Texas', label: 'TX', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Utah', label: 'UT', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Vermont', label: 'VT', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Virginia', label: 'VA', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Washington', label: 'WA', country_id: countries[0].id, createdAt: new Date() },
      { name: 'West Virginia', label: 'WV', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Wisconsin', label: 'WI', country_id: countries[0].id, createdAt: new Date() },
      { name: 'Wyoming', label: 'WY', country_id: countries[0].id, createdAt: new Date() },
      { name: 'District of Columbia', label: 'DC', country_id: countries[0].id, createdAt: new Date() },

      // ======================
      // Sri Lanka Provinces
      // ======================
      { name: 'Western Province', label: 'WP', country_id: countries[1].id, createdAt: new Date() },
      { name: 'Central Province', label: 'CP', country_id: countries[1].id, createdAt: new Date() },
      { name: 'Southern Province', label: 'SP', country_id: countries[1].id, createdAt: new Date() },
      { name: 'Northern Province', label: 'NP', country_id: countries[1].id, createdAt: new Date() },
      { name: 'Eastern Province', label: 'EP', country_id: countries[1].id, createdAt: new Date() },
      { name: 'North Western Province', label: 'NWP', country_id: countries[1].id, createdAt: new Date() },
      { name: 'North Central Province', label: 'NCP', country_id: countries[1].id, createdAt: new Date() },
      { name: 'Uva Province', label: 'UP', country_id: countries[1].id, createdAt: new Date() },
      { name: 'Sabaragamuwa Province', label: 'SGP', country_id: countries[1].id, createdAt: new Date() },
    ]);

    console.log('States created:', states.length);

    const defaultCountry = countries.find((c: any) => c.label === 'US' || c.name === 'United States')
    if (!defaultCountry) {
      throw new Error('Default country United States not found after seeding')
    }

    const defaultState = states.find((s: any) => s.label === 'CA' || s.name === 'California')
    if (!defaultState) {
      throw new Error('Default state California not found after seeding')
    }


    // Create Salutations (if they don't exist)
    const [salutation] = await SalutationModel.findOrCreate({
      where: { name: 'Mr.' },
      defaults: {
        name: 'Mr.',
        createdAt: new Date(),
      },
    });
    console.log('Salutation created/verified: Mr.');

    // Create Roles (if they don't exist)
    const [superAdminRole] = await RoleModel.findOrCreate({
      where: { name: 'super_admin' },
      defaults: {
        name: 'super_admin',
        label: 'Super Admin',
        createdAt: new Date(),
      },
    });

    const [adminRole] = await RoleModel.findOrCreate({
      where: { name: 'admin' },
      defaults: {
        name: 'admin',
        label: 'Admin',
        createdAt: new Date(),
      },
    });

    const [organizationRole] = await RoleModel.findOrCreate({
      where: { name: 'organization' },
      defaults: {
        name: 'organization',
        label: 'Organization',
        createdAt: new Date(),
      },
    });

    const [customerRole] = await RoleModel.findOrCreate({
      where: { name: 'customer' },
      defaults: {
        name: 'customer',
        label: 'Customer',
        createdAt: new Date(),
      },
    });

    const [agentRole] = await RoleModel.findOrCreate({
      where: { name: 'agent' },
      defaults: {
        name: 'agent',
        label: 'Agent',
        createdAt: new Date(),
      },
    });

    const [cSuiteRole] = await RoleModel.findOrCreate({
      where: { name: 'c_suite' },
      defaults: {
        name: 'c_suite',
        label: 'C Suite',
        createdAt: new Date(),
      },
    });

    console.log('Roles created/verified: Super Admin, Admin, Organization, Customer, Agent, C Suite');

    // Create Organization: KTMG
    const [ktmgOrg, orgCreated] = await OrganizationModel.findOrCreate({
      where: { hash: 'KTMG-ORG-001' },
      defaults: {
        name: 'KTMG',
        address_line1: '123 KTMG Street',
        city: 'San Francisco',
        state_id: defaultState.id,
        country_id: defaultCountry.id,
        phone_number: '+1-626-263-4999',
        email: 'info@ktmg.com',
        hash: 'KTMG-ORG-001',
        status: 'Active',
      },
    });
    console.log(`Organization ${orgCreated ? 'created' : 'already exists'}: KTMG`);

    // Create Application: KTMG Support
    const [ktmgApp, appCreated] = await ApplicationModel.findOrCreate({
      where: { hash: 'KTMG-APP-001' },
      defaults: {
        name: 'KTMG Support',
        service_email: 'support@ktmg.com',
        service_phone_number: '+1-626-263-4999',
        status: 'Active',
        description: 'Support application for KTMG',
        remarks: 'KTMG Support Application',
        hash: 'KTMG-APP-001',
        organization_id: ktmgOrg.id,
      },
    });
    console.log(`Application ${appCreated ? 'created' : 'already exists'}: KTMG Support`);

    // Create Team: KTMG Support Team
    const [ktmgTeam, teamCreated] = await TeamModel.findOrCreate({
      where: { hash: 'KTMG-TEAM-001' },
      defaults: {
        name: 'KTMG Support Team',
        email: 'ktmg.support.team@ktmg.com',
        phone_number: '+1 626-263-4999',
        address_line1: '123 KTMG Street',
        address_line2: 'Suite 100',
        city: 'San Francisco',
        status: 'Active',
        hash: 'KTMG-TEAM-001',
        data: JSON.stringify({}),
        description: 'KTMG Support Team',
        remarks: 'Main support team for KTMG',
        application_id: ktmgApp.id,
      },
    });
    console.log(`Team ${teamCreated ? 'created' : 'already exists'}: KTMG Support Team`);

    // Create Team Roles specific to KTMG Support Team
    const [teamAdminRole] = await TeamRolesModel.findOrCreate({
      where: { name: 'team_lead' },
      defaults: {
        name: 'team_lead',
        label: 'Team Lead',
        team_id: ktmgTeam.id,
      },
    });

    const [teamAgentRole] = await TeamRolesModel.findOrCreate({
      where: { name: 'agent' },
      defaults: {
        name: 'agent',
        label: 'agent',
        team_id: ktmgTeam.id,
      },
    });

    const [teamObserverRole] = await TeamRolesModel.findOrCreate({
      where: { name: 'observer' },
      defaults: {
        name: 'observer',
        label: 'Observer',
        team_id: ktmgTeam.id,
      },
    });

    if (!teamAdminRole || !teamAgentRole || !teamObserverRole) {
      throw new Error('Failed to create required team roles');
    }

    // Create password hash
    const hashedPassword = await bcrypt.hash('KTMG355Tbt$', 12);

    // Create Users
    const [adminUser] = await UserModel.findOrCreate({
      where: { hash: 'KTMG-ADMIN-USER-001' },
      defaults: {
        name: 'Super Admin',
        email: 'admin@ktmg.com',
        username: 'ktmg.admin',
        password: hashedPassword,
        status: 'Active',
        hash: 'KTMG-ADMIN-USER-001',
        emailStatus: 'verified',
        phoneStatus: 'verified',
        isPasswordSet: true,
        mobile_number: '+1 626-263-4999',
      },
    });

    const [agent1User] = await UserModel.findOrCreate({
      where: { hash: 'KTMG-AGENT-USER-001' },
      defaults: {
        name: 'Agent 1',
        email: 'agent1@ktmg.com',
        username: 'ktmg.agent1',
        password: hashedPassword,
        status: 'Active',
        hash: 'KTMG-AGENT-USER-001',
        emailStatus: 'verified',
        phoneStatus: 'verified',
        isPasswordSet: true,
        mobile_number: '+1 626-263-4999',
      },
    });

    const [agent2User] = await UserModel.findOrCreate({
      where: { hash: 'KTMG-AGENT-USER-002' },
      defaults: {
        name: 'Agent 2',
        email: 'agent2@ktmg.com',
        username: 'ktmg.agent2',
        password: hashedPassword,
        status: 'Active',
        hash: 'KTMG-AGENT-USER-002',
        emailStatus: 'verified',
        phoneStatus: 'verified',
        isPasswordSet: true,
        mobile_number: '+1 626-263-4999',
      },
    });

    const [agent3User] = await UserModel.findOrCreate({
      where: { hash: 'KTMG-AGENT-USER-003' },
      defaults: {
        name: 'Agent 3',
        email: 'agent3@ktmg.com',
        username: 'ktmg.agent3',
        password: hashedPassword,
        status: 'Active',
        hash: 'KTMG-AGENT-USER-003',
        emailStatus: 'verified',
        phoneStatus: 'verified',
        isPasswordSet: true,
        mobile_number: '+1 626-263-4999',
      },
    });

    console.log('Users created/verified');

    // Assign roles to users
    // Super Admin gets Super Admin role
    await UserRoleModel.findOrCreate({
      where: {
        user_id: adminUser.id,
        role_id: superAdminRole.id,
      },
      defaults: {
        user_id: adminUser.id,
        role_id: superAdminRole.id,
      },
    });

    // Agents get Agent role
    await UserRoleModel.findOrCreate({
      where: {
        user_id: agent1User.id,
        role_id: agentRole.id,
      },
      defaults: {
        user_id: agent1User.id,
        role_id: agentRole.id,
      },
    });

    await UserRoleModel.findOrCreate({
      where: {
        user_id: agent2User.id,
        role_id: agentRole.id,
      },
      defaults: {
        user_id: agent2User.id,
        role_id: agentRole.id,
      },
    });

    await UserRoleModel.findOrCreate({
      where: {
        user_id: agent3User.id,
        role_id: agentRole.id,
      },
      defaults: {
        user_id: agent3User.id,
        role_id: agentRole.id,
      },
    });

    console.log('User roles assigned');

    // Create Agents
    const [agent1, agent1Created] = await AgentModel.findOrCreate({
      where: { hash: 'KTMG-AGENT-001' },
      defaults: {
        first_name: 'Agent',
        last_name: '1',
        nickname: 'Agent1',
        email: 'agent1@ktmg.com',
        status: 'Active',
        hash: 'KTMG-AGENT-001',
        user_id: agent1User.id,
        salutation_id: salutation.id,
        country_id: defaultCountry.id,
        state_id: defaultState.id,
        city: 'San Francisco',
        description: 'Agent 1 for KTMG',
        mobile_number: '+1 626-263-4999',
        phone_number: '+1 626-263-4999',
        address_line1: '123 KTMG Street',
        address_line2: 'Suite 101',
        sex: 'Female',
        remarks: 'Agent 1',
      },
    });

    const [agent2, agent2Created] = await AgentModel.findOrCreate({
      where: { hash: 'KTMG-AGENT-002' },
      defaults: {
        first_name: 'Agent',
        last_name: '2',
        nickname: 'Agent2',
        email: 'agent2@ktmg.com',
        status: 'Active',
        hash: 'KTMG-AGENT-002',
        user_id: agent2User.id,
        salutation_id: salutation.id,
        country_id: defaultCountry.id,
        state_id: defaultState.id,
        city: 'San Francisco',
        description: 'Agent 2 for KTMG',
        mobile_number: '+1 626-263-4999',
        phone_number: '+1 626-263-4999',
        address_line1: '123 KTMG Street',
        address_line2: 'Suite 102',
        sex: 'Male',
        remarks: 'Agent 2',
      },
    });

    const [agent3, agent3Created] = await AgentModel.findOrCreate({
      where: { hash: 'KTMG-AGENT-003' },
      defaults: {
        first_name: 'Agent',
        last_name: '3',
        nickname: 'Agent3',
        email: 'agent3@ktmg.com',
        status: 'Active',
        hash: 'KTMG-AGENT-003',
        user_id: agent3User.id,
        salutation_id: salutation.id,
        country_id: defaultCountry.id,
        state_id: defaultState.id,
        city: 'San Francisco',
        description: 'Agent 3 for KTMG',
        mobile_number: '+1 626-263-4999',
        phone_number: '+1 626-263-4999',
        address_line1: '123 KTMG Street',
        address_line2: 'Suite 103',
        sex: 'Female',
        remarks: 'Agent 3',
      },
    });

    console.log(`Agent 1 ${agent1Created ? 'created' : 'already exists'}`);
    console.log(`Agent 2 ${agent2Created ? 'created' : 'already exists'}`);
    console.log(`Agent 3 ${agent3Created ? 'created' : 'already exists'}`);

    // Link Agents to Team via TeamAgent
    // Agents - use Agent role
    await TeamAgentModel.findOrCreate({
      where: {
        team_id: ktmgTeam.id,
        agent_id: agent1.id,
      },
      defaults: {
        team_id: ktmgTeam.id,
        agent_id: agent1.id,
        role_id: teamAdminRole.id, // single team leader/admin
        remarks: 'Agent 1 (Team Admin) for KTMG Support Team',
      },
    });

    await TeamAgentModel.findOrCreate({
      where: {
        team_id: ktmgTeam.id,
        agent_id: agent2.id,
      },
      defaults: {
        team_id: ktmgTeam.id,
        agent_id: agent2.id,
        role_id: teamAgentRole.id,
        remarks: 'Agent 2 for KTMG Support Team',
      },
    });

    await TeamAgentModel.findOrCreate({
      where: {
        team_id: ktmgTeam.id,
        agent_id: agent3.id,
      },
      defaults: {
        team_id: ktmgTeam.id,
        agent_id: agent3.id,
        role_id: teamObserverRole.id,
        remarks: 'Agent 3 (Observer) for KTMG Support Team',
      },
    });

    console.log('Team agents linked successfully');

    console.log('\nKTMG Database seeding completed successfully!');
    console.log('\nKTMG Login credentials:');
    console.log('\nSuper Admin:');
    console.log('  Username: ktmg.admin');
    console.log('  Password: KTMG355Tbt$');
    console.log('  Email: admin@ktmg.com');
    console.log('\nAgent 1:');
    console.log('  Username: ktmg.agent1');
    console.log('  Password: KTMG355Tbt$');
    console.log('  Email: agent1@ktmg.com');
    console.log('\nAgent 2:');
    console.log('  Username: ktmg.agent2');
    console.log('  Password: KTMG355Tbt$');
    console.log('  Email: agent2@ktmg.com');
    console.log('\nAgent 3:');
    console.log('  Username: ktmg.agent3');
    console.log('  Password: KTMG355Tbt$');
    console.log('  Email: agent3@ktmg.com');
  } catch (error) {
    console.error('Error during KTMG seeding:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedKTMG()
    .then(() => {
      console.log('KTMG Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('KTMG Seeding failed:', error);
      process.exit(1);
    });
}
