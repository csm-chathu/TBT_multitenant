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

export async function seed() {
  try {
    console.log('Starting database seeding...');

    // Initialize all models first
    console.log('Initializing models...');
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

    // Disable foreign key checks temporarily for MySQL
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Sync all models (create tables)
    await sequelize.sync({ force: true });
    console.log('Database synced successfully');
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

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

    // Create Salutations
    const salutations = await SalutationModel.bulkCreate([
      { name: 'Mr.', createdAt: new Date() },
      { name: 'Mrs.', createdAt: new Date() },
      { name: 'Ms.', createdAt: new Date() },
      { name: 'Dr.', createdAt: new Date() },
      { name: 'Prof.', createdAt: new Date() },
      { name: 'Sir', createdAt: new Date() },
      { name: 'Madam', createdAt: new Date() },
    ]);
    console.log('Salutations created:', salutations.length);

    // Create Privileges
    const privileges = await PrivilegeModel.bulkCreate([
      { createdAt: new Date() },
      { createdAt: new Date() },
      { createdAt: new Date() },
      { createdAt: new Date() },
      { createdAt: new Date() },
      { createdAt: new Date() },
      { createdAt: new Date() },
      { createdAt: new Date() },
    ]);
    console.log('Privileges created:', privileges.length);

    // Create Roles
    // NOTE: order is important because some seed data refers to roles[0], roles[1], roles[2]
    const roles = await RoleModel.bulkCreate([
      {
        name: 'Agent',
        label: 'AGENT',
        createdAt: new Date(),
      },
      {
        name: 'Team Lead',
        label: 'TEAM_LEAD',
        createdAt: new Date(),
      },
      {
        name: 'Super Admin',
        label: 'SUPER_ADMIN',
        createdAt: new Date(),
      },
      {
        name: 'Customer',
        label: 'CUSTOMER',
        createdAt: new Date(),
      },
      {
        name: 'Ticket Tracker',
        label: 'TICKET_TRACKER',
        createdAt: new Date(),
      },
    ]);
    console.log('Roles created:', roles.length);

    // Create Organizations
    const organizations = await OrganizationModel.bulkCreate([
      {
        name: 'MDI Solutions',
        address_line1: '123 Tech Street',
        city: 'San Francisco',
        state_id: states[0].id,
        country_id: countries[0].id,
        phone_number: '+1-555-0123',
        email: 'info@mditbt.com',
        hash: 'TS-001',
        status: 'Active',
      },
      {
        name: 'Global Innovations Inc',
        address_line1: '456 Innovation Ave',
        city: 'New York',
        state_id: states[1].id,
        country_id: countries[0].id,
        phone_number: '+1-555-0456',
        email: 'contact@globalinnovations.com',
        hash: 'GI-002',
        status: 'Active',
      },
    ]);
    console.log('Organizations created:', organizations.length);

    // Create Teams
    const teams = await TeamModel.bulkCreate([
      {
        name: 'Support Team Alpha',
        email: 'supportteam@gmail.com',
        phone_number: '+1-555-0123',
        address_line1: '123 Support St',
        address_line2: 'Suite 100',
        city: 'San Francisco',
        status: 'Active',
        hash: 'STA-001',
        data: JSON.stringify({}),
        description: 'Primary customer support team',
        remarks: 'First team',
        // application_id will be linked after applications are created
      },
      {
        name: 'Technical Team Beta',
        description: 'Technical support and development team',
        email: 'technicalteam@gmail.com',
        phone_number: '+1-555-0456',
        address_line1: '456 Technical Ave',
        address_line2: 'Suite 200',
        city: 'San Francisco',
        status: 'Active',
        hash: 'TTB-002',
        data: JSON.stringify({}),
        remarks: 'Second team',
        // application_id will be linked after applications are created
      },
      {
        name: 'Sales Team Gamma',
        description: 'Sales and customer acquisition team',
        email: 'salesteam@gmail.com',
        phone_number: '+1-555-0789',
        address_line1: '789 Sales Blvd',
        address_line2: 'Suite 300',
        city: 'San Francisco',
        status: 'Active',
        hash: 'STG-003',
        data: JSON.stringify({}),
        remarks: 'Third team',
        // application_id will be linked after applications are created
      },
    ]);
    console.log('Teams created:', teams.length);

    // Fetch teams with IDs (MySQL bulkCreate may not return IDs)
    const supportTeam = await TeamModel.findOne({ where: { hash: 'STA-001' } });
    const technicalTeam = await TeamModel.findOne({ where: { hash: 'TTB-002' } });
    const salesTeam = await TeamModel.findOne({ where: { hash: 'STG-003' } });

    // Create Team Roles (single leader per team, agents, observers)
    const teamRolesSeed = [
      { name: 'team_lead', label: 'Team Lead', remarks: 'Leads the team' },
      { name: 'agent', label: 'Agent', remarks: 'Handles support tickets' },
      { name: 'observer', label: 'Observer', remarks: 'View-only role' },
    ];
    await TeamRolesModel.bulkCreate(teamRolesSeed, { ignoreDuplicates: true });
    const teamRoles = await TeamRolesModel.findAll({
      where: { name: { [Op.in]: teamRolesSeed.map((r) => r.name) } },
    });
    const teamRoleMap = Object.fromEntries(teamRoles.map((r) => [r.name, r]));
    console.log('Team roles created/verified:', teamRoles.length);

    // Create Incidents
    const incidents = await IncidentModel.bulkCreate([
      {
        type: 'System Outage',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        type: 'Security Breach',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        type: 'Performance Issue',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    console.log('Incidents created:', incidents.length);

    // Create Auth Keys
    const authKeys = await AuthKeyModel.bulkCreate([
      {
        secret_key: 'sk_live_1234567890abcdef',
        name: 'Primary API Key',
        status: true,
        description: 'Main API key for integrations',
        remarks: 'Auto-generated for initial setup',
        data: JSON.stringify({ permissions: ['read', 'write', 'delete'] }),
        createdAt: new Date(),
        updatedAt: new Date(),
        organization_id: organizations[0].id,
      },
      {
        secret_key: 'sk_test_abcdef1234567890',
        name: 'Test API Key',
        status: false,
        description: 'API key for testing purposes',
        remarks: 'Deactivated test key',
        data: JSON.stringify({ permissions: ['read'] }),
        createdAt: new Date(),
        updatedAt: new Date(),
        organization_id: organizations[1].id,
      },
    ]);
    console.log('AuthKeys created:', authKeys.length);

    // Create Users
    const hashedPassword = await bcrypt.hash('Mditbt345#', 12);
    const users = await UserModel.bulkCreate([
      {
        // Super Admin login (not an agent)
        name: 'Super Admin User',
        email: 'superadmin@mditbt.com',
        username: 'superadmin',
        password: hashedPassword,
        status: 'Active',
        hash: 'SUPER_ADMIN_USER_HASH_001',
        emailStatus: 'verified',
        phoneStatus: 'verified',
        isPasswordSet: true,
      },
      {
        // User record for Team Lead agent (matches agent details below)
        name: 'Team Lead',
        email: 'teamlead@mditbt.com',
        username: 'teamlead',
        password: hashedPassword,
        status: 'Active',
        hash: 'TEAM_LEAD_USER_HASH_002',
        emailStatus: 'verified',
        phoneStatus: 'verified',
        isPasswordSet: true,
        mobile_number: '+1-555-1111',
      },
      {
        // User record for Agent One (matches agent details below)
        name: 'Agent One',
        email: 'agent1@mditbt.com',
        username: 'agent1',
        password: hashedPassword,
        status: 'Active',
        hash: 'AGENT_USER_HASH_001',
        emailStatus: 'verified',
        phoneStatus: 'verified',
        isPasswordSet: true,
        mobile_number: '+1-555-3333',
      },
      {
        // User record for Agent Two (matches agent details below)
        name: 'Agent Two',
        email: 'agent2@mditbt.com',
        username: 'agent2',
        password: hashedPassword,
        status: 'Active',
        hash: 'AGENT_USER_HASH_002',
        emailStatus: 'verified',
        phoneStatus: 'verified',
        isPasswordSet: true,
        mobile_number: '+1-555-5555',
      },
      {
        name: 'Darryl Tracker',
        email: 'darryl@renewhealthcs.com',
        username: 'darryl',
        password: hashedPassword,
        status: 'Active',
        hash: 'USER_HASH_DARRYL_001',
        emailStatus: 'verified',
        phoneStatus: 'verified',
        isPasswordSet: true,
        mobile_number: '+1-555-7771',
      },
      {
        name: 'Janet Tracker',
        email: 'janet@renewhealthcs.com',
        username: 'janet',
        password: hashedPassword,
        status: 'Active',
        hash: 'USER_HASH_JANET_002',
        emailStatus: 'verified',
        phoneStatus: 'verified',
        isPasswordSet: true,
        mobile_number: '+1-555-7772',
      },
    ]);
    console.log('Users created:', users.length);

    const ticketTrackerRole = roles.find((r: any) => r.label === 'TICKET_TRACKER') || roles[0];

    // Map Users to Roles in user_role pivot table
    // roles: [0] Agent, [1] Team Lead, [2] Super Admin, [3] Customer, [4] Ticket Tracker]
    const userRoles = await UserRoleModel.bulkCreate([
      {
        user_id: users[0].id,
        role_id: roles[2].id, // Super Admin role
      },
      {
        user_id: users[1].id,
        role_id: roles[1].id, // Team Lead role
      },
      {
        user_id: users[2].id,
        role_id: roles[0].id, // Agent role
      },
      {
        user_id: users[3].id,
        role_id: roles[0].id, // Agent role
      },
      {
        user_id: users[4].id,
        role_id: ticketTrackerRole.id, // Ticket Tracker role
      },
      {
        user_id: users[5].id,
        role_id: ticketTrackerRole.id, // Ticket Tracker role
      },
    ]);
    console.log('User roles created:', userRoles.length);

    // Create Agents
    const agents = await AgentModel.bulkCreate([
      {
        first_name: 'Team',
        last_name: 'Lead',
        nickname: 'TeamLead',
        email: 'teamlead@mditbt.com',
        status: 'Active',
        hash: 'TEAM_LEAD_AGENT_HASH_001',
        user_id: users[1].id,
        salutation_id: salutations[0].id,
        country_id: countries[0].id,
        state_id: states[0].id,
        city: 'San Francisco',
        description: 'Team Lead for customer support',
        mobile_number: '+1-555-1111',
        phone_number: '+1-555-2222',
        address_line1: '123 Tech Street',
        address_line2: 'Suite 100',
        sex: 'Male',
        remarks: 'Team Lead agent'
      },
      {
        first_name: 'Agent',
        last_name: 'One',
        nickname: 'AgentOne',
        email: 'agent1@mditbt.com',
        status: 'Active',
        hash: 'AGENT_001_HASH',
        user_id: users[2].id,
        salutation_id: salutations[2].id,
        country_id: countries[0].id,
        state_id: states[0].id,
        city: 'San Francisco',
        description: 'Support Agent',
        mobile_number: '+1-555-3333',
        phone_number: '+1-555-4444',
        address_line1: '456 Tech Avenue',
        address_line2: 'Suite 200',
        sex: 'Female',
        remarks: 'First agent account'
      },
      {
        first_name: 'Agent',
        last_name: 'Two',
        nickname: 'AgentTwo',
        email: 'agent2@mditbt.com',
        status: 'Active',
        hash: 'AGENT_002_HASH',
        user_id: users[3].id,
        salutation_id: salutations[0].id,
        country_id: countries[0].id,
        state_id: states[0].id,
        city: 'San Francisco',
        description: 'Support Agent',
        mobile_number: '+1-555-5555',
        phone_number: '+1-555-6666',
        address_line1: '789 Tech Boulevard',
        address_line2: 'Suite 300',
        sex: 'Male',
        remarks: 'Second agent account'
      },
    ]);
    console.log('Agents created:', agents.length);

    // Fetch agents with IDs
    const teamLeadAgent = await AgentModel.findOne({ where: { hash: 'TEAM_LEAD_AGENT_HASH_001' } });
    const agentOne = await AgentModel.findOne({ where: { hash: 'AGENT_001_HASH' } });
    const agentTwo = await AgentModel.findOne({ where: { hash: 'AGENT_002_HASH' } });

    //Create Admin
    const Admin = await AdminModel.bulkCreate([
      {
        first_name: 'Super',
        last_name: 'Admin',
        email: 'superadmin@mditbt.com',
        mobile_number: '+1-555-9999',
        phone_number: '+1-555-8888',
        address_line1: '123 Tech Street',
        address_line2: 'Suite 100',
        city: 'San Francisco',
        dob: new Date('1980-01-01'),
        sex: 'M',
        status: 'Active',
        hash: 'SUPER_ADMIN_001_HASH',
        salutation_id: salutations[0].id,
        user_id: users[0].id,
        country_id: countries[0].id,
        state_id: states[0].id,
      },
    ]);
    console.log('Admins created:', Admin.length);

    // Assign Agents to Teams
    const teamAgents = await TeamAgentModel.bulkCreate([
      {
        team_id: supportTeam?.id,
        agent_id: teamLeadAgent?.id,
        role_id: teamRoleMap['team_lead']?.id,
        remarks: 'Team Lead of Support Alpha',
      },
      {
        team_id: technicalTeam?.id,
        agent_id: agentOne?.id,
        role_id: teamRoleMap['agent']?.id,
        remarks: 'Technical support agent',
      },
      {
        team_id: salesTeam?.id,
        agent_id: agentTwo?.id,
        role_id: teamRoleMap['observer']?.id,
        remarks: 'Sales support observer',
      },
    ]);
    console.log('Team agents created:', teamAgents.length);

    const applications = await ApplicationModel.bulkCreate([
      {
        name: 'Customer Portal',
        service_email: 'support@mditbt.com',
        service_phone_number: '+1-555-1000',
        status: 'Active',
        description: 'Portal for customers to submit and track tickets',
        remarks: 'Main customer-facing application',
        hash: 'APP-001',
        organization_id: organizations[0].id,
      },
      {
        name: 'Agent Dashboard',
        service_email: 'agents@mditbt.com',
        service_phone_number: '+1-555-2000',
        status: 'Active',
        description: 'Dashboard for agents to manage tickets',
        remarks: 'Internal tool for agents',
        hash: 'APP-002',
        organization_id: organizations[1].id,
      },
      {
        name: 'Admin Console',
        service_email: 'admin@mditbt.com',
        service_phone_number: '+1-555-3000',
        status: 'Active',
        description: 'Console for administrators to manage the system',
        remarks: 'Admin-only application',
        hash: 'APP-003',
        organization_id: organizations[0].id,
      },
    ]);
    console.log('Applications created:', applications.length);

    // Fetch applications with IDs
    const customerPortalApp = await ApplicationModel.findOne({ where: { hash: 'APP-001' } });
    const agentDashboardApp = await ApplicationModel.findOne({ where: { hash: 'APP-002' } });
    const adminConsoleApp = await ApplicationModel.findOne({ where: { hash: 'APP-003' } });

    // Link Teams to Applications
    if (supportTeam && customerPortalApp) {
      await supportTeam.update({ application_id: customerPortalApp.id });
    }
    if (technicalTeam && agentDashboardApp) {
      await technicalTeam.update({ application_id: agentDashboardApp.id });
    }
    if (salesTeam && adminConsoleApp) {
      await salesTeam.update({ application_id: adminConsoleApp.id });
    }

    // Create Customers
    const customers = await CustomerModel.bulkCreate([
      {
        first_name: 'Alice',
        last_name: 'Johnson',
        email: 'alice.johnson@email.com',
        phone_number: '+1-555-0101',
        address_line1: '789 Business Blvd',
        city: 'Los Angeles',
        state_id: states[0].id,
        country_id: countries[0].id,
        status: 'Active',
        hash: 'CUSTOMER_001_HASH',
        description: 'ABC Company customer',
        sex: 'Female'
      },
      {
        first_name: 'Bob',
        last_name: 'Smith',
        email: 'bob.smith@email.com',
        phone_number: '+1-555-0202',
        address_line1: '321 Corporate Way',
        city: 'Chicago',
        state_id: states[4].id,
        country_id: countries[0].id,
        status: 'Active',
        hash: 'CUSTOMER_002_HASH',
        description: 'XYZ Corporation customer',
        sex: 'Male'
      },
      {
        first_name: 'Carol',
        last_name: 'Davis',
        email: 'carol.davis@email.com',
        phone_number: '+1-555-0303',
        address_line1: '654 Industrial Ave',
        city: 'Houston',
        state_id: states[2].id,
        country_id: countries[0].id,
        status: 'Active',
        hash: 'CUSTOMER_003_HASH',
        description: 'DEF Industries customer',
        sex: 'Female'
      },
    ]);
    console.log('Customers created:', customers.length);

    // Create Users for Customers
    const customerUsers = await UserModel.bulkCreate([
      {
        name: 'Alice Johnson',
        email: customers[0].email,
        username: 'alice.johnson',
        password: hashedPassword,
        status: 'Active',
        hash: 'CUSTOMER_USER_HASH_001',
        mobile_number: customers[0].phone_number,
        emailStatus: 'verified',
        phoneStatus: 'verified',
        isPasswordSet: true,
      },
      {
        name: 'Bob Smith',
        email: customers[1].email,
        username: 'bob.smith',
        password: hashedPassword,
        status: 'Active',
        hash: 'CUSTOMER_USER_HASH_002',
        mobile_number: customers[1].phone_number,
        emailStatus: 'verified',
        phoneStatus: 'verified',
        isPasswordSet: true,
      },
      {
        name: 'Carol Davis',
        email: customers[2].email,
        username: 'carol.davis',
        password: hashedPassword,
        status: 'Active',
        hash: 'CUSTOMER_USER_HASH_003',
        mobile_number: customers[2].phone_number,
        emailStatus: 'verified',
        phoneStatus: 'verified',
        isPasswordSet: true,
      },
    ]);
    console.log('Customer users created:', customerUsers.length);

    // Link Customers to their User accounts
    await customers[0].update({ user_id: customerUsers[0].id });
    await customers[1].update({ user_id: customerUsers[1].id });
    await customers[2].update({ user_id: customerUsers[2].id });

    // Assign CUSTOMER role to customer users in user_role table
    const customerRole = roles.find((r: any) => r.label === 'CUSTOMER');
    if (!customerRole) {
      throw new Error('CUSTOMER role not found while seeding.');
    }

    const customerUserRoles = await UserRoleModel.bulkCreate([
      {
        user_id: customerUsers[0].id,
        role_id: customerRole.id,
      },
      {
        user_id: customerUsers[1].id,
        role_id: customerRole.id,
      },
      {
        user_id: customerUsers[2].id,
        role_id: customerRole.id,
      },
    ]);
    console.log('Customer user roles created:', customerUserRoles.length);

    // Map Applications to Teams
    const teamApplications = await TeamApplicationModel.bulkCreate([
      {
        team_id: supportTeam?.id,
        application_id: customerPortalApp?.id,
        remarks: 'Customer Portal for Support Alpha',
      },
      {
        team_id: technicalTeam?.id,
        application_id: agentDashboardApp?.id,
        remarks: 'Agent Dashboard for Technical Beta',
      },
      {
        team_id: salesTeam?.id,
        application_id: adminConsoleApp?.id,
        remarks: 'Admin Console for Sales Gamma',
      },
    ]);
    console.log('Team applications created:', teamApplications.length);

    // Create Messages
    const messages = await MessageModel.bulkCreate([
      {
        from: 'system@mditbt.com',
        to: users[1].email,
        message: 'Welcome to MDI Support!',
        message_data: JSON.stringify({ template: 'welcome' }),
        type: 'email',
        direction: 'outbound',
        customer_id: customers[0]?.id,
      },
      {
        from: users[2].email,
        to: 'support@mditbt.com',
        message: 'Issue with monitor flickering.',
        message_data: JSON.stringify({ urgency: 'low' }),
        type: 'email',
        direction: 'inbound',
      },
    ]);
    console.log('Messages created:', messages.length);

    // Create Notifications
    const notifications = await NotificationModel.bulkCreate([
      {
        message: 'Your password was changed successfully.',
        hash: 'NOTIF-001',
        data: JSON.stringify({ category: 'security' }),
        status: 'active',
        level: 'info',
        type: 'account',
        user_id: users[0].id,
      },
      {
        message: 'New application update available.',
        hash: 'NOTIF-002',
        data: JSON.stringify({ version: '1.2.0' }),
        status: 'active',
        level: 'warning',
        type: 'system',
        user_id: users[1].id,
      },
    ]);
    console.log('Notifications created:', notifications.length);

    // Create Inventory Item Categories
    const inventoryCategories = await InventoryItemCategoryModel.bulkCreate([
      { name: 'Electronics', description: 'Electronic devices and components', remarks: 'Includes phones, laptops, and accessories' },
      { name: 'Office Supplies', description: 'Office equipment and supplies', remarks: 'Includes paper, pens, and printers' },
      { name: 'Furniture', description: 'Office furniture and fixtures', remarks: 'Includes desks, chairs, and cabinets' },
      { name: 'Software', description: 'Software licenses and applications', remarks: 'Includes OS, productivity, and design software' },
      { name: 'Hardware', description: 'Computer hardware and peripherals', remarks: 'Includes CPUs, GPUs, and peripherals' },
    ]);
    console.log('Inventory categories created:', inventoryCategories.length);

    // Create Inventory Item Brands
    const inventoryBrands = await InventoryItemBrandModel.bulkCreate([
      { name: 'Apple', description: 'Apple Inc. products', remarks: 'Apple ipones/ipads' },
      { name: 'Dell', description: 'Dell Technologies products', remarks: 'Dell laptops and desktops' },
      { name: 'HP', description: 'Hewlett-Packard products', remarks: 'HP printers and laptops' },
      { name: 'Microsoft', description: 'Microsoft Corporation products', remarks: 'Microsoft Surface devices' },
      { name: 'Samsung', description: 'Samsung Electronics products', remarks: 'Samsung Galaxy devices' },
      { name: 'Generic', description: 'Generic or unbranded products', remarks: 'No specific brand' },
    ]);
    console.log('Inventory brands created:', inventoryBrands.length);

    // Create Inventory Item Locations
    const inventoryLocations = await InventoryItemLocationModel.bulkCreate([
      { name: 'Main Office', description: 'Primary office location', remarks: 'Headquarters', country_id: countries[0].id, organization_id: organizations[0].id },
      { name: 'Warehouse A', description: 'Primary warehouse facility', remarks: 'Main storage area', country_id: countries[1].id, organization_id: organizations[0].id },
      { name: 'Branch Office', description: 'Secondary office location', remarks: 'Regional office', country_id: countries[1].id, organization_id: organizations[1].id },
      { name: 'Storage Room', description: 'General storage area', remarks: 'Contains miscellaneous items', country_id: countries[0].id, organization_id: organizations[0].id },
      { name: 'Server Room', description: 'IT infrastructure room', remarks: 'Houses servers and networking equipment', country_id: countries[0].id, organization_id: organizations[1].id },
    ]);
    console.log('Inventory locations created:', inventoryLocations.length);

    // Create Inventory Items
    const inventoryItems = await InventoryItemModel.bulkCreate([
      {
        user: 'Team Lead User',
        name: 'MacBook Pro 14"',
        description: 'Developer laptop',
        condition: 'Good',
        ownership: 'Company',
        serialNo: 'MBP14-001',
        hash: 'ITEM-001',
        ipAddress: '10.0.0.10',
        purchasedAt: new Date().toISOString(),
        data: JSON.stringify({ specs: 'M1 Pro, 16GB, 512GB' }),
        remarks: 'Assigned to Team Lead',
        category_id: inventoryCategories[0].id,
        brand_id: inventoryBrands[0].id,
        location_id: inventoryLocations[4].id,
        user_id: users[1].id,
      },
      {
        user: 'Agent One',
        name: 'Dell Monitor 27"',
        description: '4K display',
        condition: 'New',
        ownership: 'Company',
        serialNo: 'DELL27-100',
        hash: 'ITEM-002',
        ipAddress: '10.0.0.20',
        purchasedAt: new Date().toISOString(),
        data: JSON.stringify({ size: '27', resolution: '4K' }),
        remarks: 'Desk monitor',
        category_id: inventoryCategories[1].id,
        brand_id: inventoryBrands[1].id,
        location_id: inventoryLocations[0].id,
        user_id: users[2].id,
      },
    ]);
    console.log('Inventory items created:', inventoryItems.length);

    // Create Inventory Item User Logs
    const inventoryItemUserLogs = await InventoryItemUserLogModel.bulkCreate([
      {
        user: 'Team Lead User',
        status: 'active',
        name: 'MacBook Pro 14"',
        description: 'Assigned to Team Lead',
        condition: 'Good',
        ownership: 'Company',
        serialNo: 'MBP14-001',
        purchasedAt: Date.now(),
        data: JSON.stringify({ action: 'assigned' }),
        remarks: 'Initial assignment',
        item_id: inventoryItems[0].id,
        user_id: users[1].id,
      },
      {
        user: 'Agent One',
        status: 'active',
        name: 'Dell Monitor 27"',
        description: 'Assigned to Agent One',
        condition: 'New',
        ownership: 'Company',
        serialNo: 'DELL27-100',
        purchasedAt: Date.now(),
        data: JSON.stringify({ action: 'assigned' }),
        remarks: 'Initial assignment',
        item_id: inventoryItems[1].id,
        user_id: users[2].id,
      },
    ]);
    console.log(
      'Inventory item user logs created:',
      inventoryItemUserLogs.length,
    );

    // Create Tickets
    const tickets = await TicketModel.bulkCreate([
      {
        title: 'Cannot access account',
        ticketType: 'cyber',
        body: 'User reports they cannot log in to the portal.',
        init_message: 2,
        status: 'assigned',
        priority: 'Medium',
        data: JSON.stringify({ channel: 'email' }),
        hash: 'TICKET-001',
        remarks: 'Created by system',
        customer_id: customers[0].id,
        agent_id: agents[0].id,
        ticket_template_id: undefined, // Will be updated later
        device_id: inventoryItems[0].id,
        additinal_data: '{}',
        application_id: customerPortalApp?.id || 1,
        alert_id: incidents[0].id,
        createdAt: new Date('2025-11-27T09:41:46.000Z'),
        updatedAt: new Date('2025-11-27T09:41:46.000Z'),
      },
      {
        title: 'Monitor flickering issue',
        ticketType: 'helpdesk',
        body: 'Screen flickers intermittently after update.',
        init_message: 1,
        status: 'assigned',
        priority: 'Critical',
        data: JSON.stringify({ device: 'Monitor' }),
        hash: 'TICKET-002',
        remarks: 'Assigned to Jane Agent',
        customer_id: customers[1].id,
        agent_id: agents[1].id,
        ticket_template_id: undefined, // Will be updated later
        device_id: inventoryItems[1].id,
        additinal_data: '{}',
        application_id: agentDashboardApp?.id || 2,
        alert_id: incidents[1].id,
        createdAt: new Date('2025-11-28T09:41:46.000Z'),
        updatedAt: new Date('2025-11-28T09:41:46.000Z'),
      },
    ]);
    console.log('Tickets created:', tickets.length);

    // Create Ticket Comments
    const ticketComments = await TicketCommentModel.bulkCreate([
      {
        comment: 'We are investigating this issue.',
        type: 'internal',
        ticket_id: tickets[0].id,
        from: users[0].id,
        to: users[1].id,
      },
      {
        comment: 'Please try updating your graphics drivers.',
        type: 'public',
        ticket_id: tickets[1].id,
        from: users[1].id,
      },
    ]);
    console.log('Ticket comments created:', ticketComments.length);

    // Create Ticket History
    const ticketHistories = await TicketHistoryModel.bulkCreate([
      {
        message: 'Ticket created',
        type: 'SYSTEM',
        status: 'active',
        user_id: users[1].id,
        ticket_id: tickets[0].id,
      },
      {
        message: 'Assigned to Jane Agent',
        type: 'SYSTEM',
        status: 'active',
        user_id: users[0].id,
        ticket_id: tickets[1].id,
      },
    ]);
    console.log('Ticket histories created:', ticketHistories.length);

    // Create Ticket Resources
    const ticketResources = await TicketsResourceModel.bulkCreate([
      {
        file_mime_type: 'image/png',
        file_path: '/uploads/screenshots/login-error.png',
        hash: 'RES-001',
        remarks: 'Login error screenshot',
        ticket_id: tickets[0].id,
      },
      {
        file_mime_type: 'text/plain',
        file_path: '/uploads/logs/monitor-log.txt',
        hash: 'RES-002',
        remarks: 'Monitor error logs',
        ticket_id: tickets[1].id,
      },
    ]);
    console.log('Ticket resources created:', ticketResources.length);

    // Create User Settings
    const userSettings = await UserSettingsModel.bulkCreate([
      {
        settings: JSON.stringify({ theme: 'dark', notifications: true }),
        user_id: users[1].id,
        organization_id: organizations[0].id,
        application_id: customerPortalApp?.id,
      },
      {
        settings: JSON.stringify({ theme: 'light', notifications: false }),
        user_id: users[1].id,
        organization_id: organizations[0].id,
        application_id: agentDashboardApp?.id,
      },
      {
        settings: JSON.stringify({ language: 'en', timezone: 'PST' }),
        user_id: users[2].id,
        organization_id: organizations[0].id,
        application_id: customerPortalApp?.id,
      },
    ]);
    console.log('User settings created:', userSettings.length);

    // Create Archives
    const archives = await ArchiveModel.bulkCreate([
      {
        fromModel: 'tickets',
        originalRecord: JSON.stringify({ id: 999, title: 'Old ticket example' }),
        originalRecordId: '999',
      },
      {
        fromModel: 'messages',
        originalRecord: JSON.stringify({ id: 888, to: 'example@domain.com' }),
        originalRecordId: '888',
      },
    ]);
    console.log('Archives created:', archives.length);

    // Create Ticket Templates
    const ticketTemplates = await TicketTemplateModel.bulkCreate([
      {
        name: 'General Support Request',
        label: 'GENERAL_SUPPORT',
        description: 'Template for general support inquiries',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Technical Issue Report',
        label: 'TECHNICAL_ISSUE',
        description: 'Template for technical problems',
        createdAt: new Date(),
      },
      {
        name: 'Feature Request',
        label: 'FEATURE_REQUEST',
        description: 'Template for new feature requests',
        createdAt: new Date(),
      },
      {
        name: 'Bug Report',
        label: 'BUG_REPORT',
        description: 'Template for bug reports',
        createdAt: new Date(),
      },
      {
        name: 'Password Reset',
        label: 'PASSWORD_RESET',
        description: 'Template for password reset assistance',
        createdAt: new Date(),
      },
      {
        name: 'Account Locked',
        label: 'ACCOUNT_LOCKED',
        description: 'Template for locked or suspended accounts',
        createdAt: new Date(),
      },
      {
        name: 'Hardware Issue',
        label: 'HARDWARE_ISSUE',
        description: 'Template for hardware-related problems',
        createdAt: new Date(),
      },
      {
        name: 'Software Installation',
        label: 'SOFTWARE_INSTALL',
        description: 'Template for software installation requests',
        createdAt: new Date(),
      },
      {
        name: 'Access Request',
        label: 'ACCESS_REQUEST',
        description: 'Template for access/permission requests',
        createdAt: new Date(),
      },
      {
        name: 'Network Issue',
        label: 'NETWORK_ISSUE',
        description: 'Template for connectivity/network problems',
        createdAt: new Date(),
      },
    ]);
    console.log('Ticket templates created:', ticketTemplates.length);

    // Link initial tickets to appropriate templates
    if (tickets && tickets.length > 0) {
      const technicalIssueTemplate = ticketTemplates.find((t: any) => t.label === 'TECHNICAL_ISSUE');
      if (tickets[1] && technicalIssueTemplate) {
        await tickets[1].update({ ticket_template_id: technicalIssueTemplate.id });
      }
    }

    // Create Whitelisted Domains
    const whitelistedDomains = await WhitelistedDomainModel.bulkCreate([
      {
        domain: 'mditbt.com',
        status: true,
        description: 'Primary company domain',
      },
      {
        domain: 'globalinnovations.com',
        status: true,
        description: 'Secondary company domain',
      },
      {
        domain: 'example.com',
        status: true,
        description: 'Test domain',
      },
    ]);
    console.log('Whitelisted domains created:', whitelistedDomains.length);

    // Create initial Ticket Stats
    const ticketStats = await TicketStatsModel.bulkCreate([
      {
        date: new Date().toISOString().split('T')[0],
        type: 'daily',
        role_user_id: users[0].id,
        day_stats: JSON.stringify({ total: 0, open: 0, closed: 0 }),
        week_stats: JSON.stringify({ total: 0, open: 0, closed: 0 }),
        month_stats: JSON.stringify({ total: 0, open: 0, closed: 0 }),
        year_stats: JSON.stringify({ total: 0, open: 0, closed: 0 }),
        all_stats: JSON.stringify({ total: 0, open: 0, closed: 0 }),
        hash: 'STATS_001_HASH',
        remarks: 'Initial stats for MDI Solutions',
      },
      {
        date: new Date().toISOString().split('T')[0],
        type: 'daily',
        role_user_id: users[1].id,
        day_stats: JSON.stringify({ total: 0, open: 0, closed: 0 }),
        week_stats: JSON.stringify({ total: 0, open: 0, closed: 0 }),
        month_stats: JSON.stringify({ total: 0, open: 0, closed: 0 }),
        year_stats: JSON.stringify({ total: 0, open: 0, closed: 0 }),
        all_stats: JSON.stringify({ total: 0, open: 0, closed: 0 }),
        hash: 'STATS_002_HASH',
        remarks: 'Initial stats for Global Innovations Inc',
      },
    ]);
    console.log('Ticket stats created:', ticketStats.length);

    console.log('Database seeding completed successfully!');
    console.log('\nDefault login credentials:');
    console.log('\nSuper Admin:');
    console.log('  Username: superadmin');
    console.log('  Password: Mditbt345#');
    console.log('  Email: superadmin@mditbt.com');
    console.log('\nTeam Lead:');
    console.log('  Username: teamlead');
    console.log('  Password: Mditbt345#');
    console.log('  Email: teamlead@mditbt.com');
    console.log('\nAgent 1:');
    console.log('  Username: agent1');
    console.log('  Password: Mditbt345#');
    console.log('  Email: agent1@mditbt.com');
    console.log('\nAgent 2:');
    console.log('  Username: agent2');
    console.log('  Password: Mditbt345#');
    console.log('  Email: agent2@mditbt.com');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}
