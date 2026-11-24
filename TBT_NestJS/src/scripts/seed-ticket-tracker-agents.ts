import { sequelize } from '../config/database';
import * as bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { initUser } from '../models/user';
import { initAgent } from '../models/agent';
import { initRole } from '../models/role';
import { initUserRole } from '../models/user_role';

export async function seedTicketTrackerAgents() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();

    // Initialize models
    const UserModel = initUser(sequelize);
    const AgentModel = initAgent(sequelize);
    const RoleModel = initRole(sequelize);
    const UserRoleModel = initUserRole(sequelize);

    // 1. Hard remove previous tracker agents (darrel@mditbt.com and janet@mditbt.com)
    const oldEmails = ['darrel@mditbt.com', 'janet@mditbt.com'];
    for (const oldEmail of oldEmails) {
      const oldUsers = await UserModel.findAll({ where: { email: oldEmail }, paranoid: false });
      for (const oldUser of oldUsers) {
        console.log(`Found old tracker user: ${oldEmail} (ID: ${oldUser.id}), hard removing...`);
        await UserRoleModel.destroy({ where: { user_id: oldUser.id } });
        await AgentModel.destroy({ where: { user_id: oldUser.id }, force: true });
        await UserModel.destroy({ where: { id: oldUser.id }, force: true });
        console.log(`Successfully hard removed old user and agent: ${oldEmail}`);
      }
      // Also clean up any lingering agent records with old email
      await AgentModel.destroy({ where: { email: oldEmail }, force: true });
    }

    // 2. Ensure 'Ticket Tracker' role exists
    let trackerRole = await RoleModel.findOne({
      where: { label: 'TICKET_TRACKER' },
    });

    if (!trackerRole) {
      trackerRole = await RoleModel.create({
        name: 'Ticket Tracker',
        label: 'TICKET_TRACKER',
      });
      console.log('Created "Ticket Tracker" role with ID:', trackerRole.id);
    } else {
      console.log('Found existing "Ticket Tracker" role with ID:', trackerRole.id);
    }

    const hashedPassword = await bcrypt.hash('Mditbt345#', 12);

    const trackerAgentsData = [
      {
        firstName: 'Darryl',
        lastName: 'Tracker',
        email: 'darryl@renewhealthcs.com',
        username: 'darryl',
        userHash: 'USER_HASH_DARRYL_001',
        agentHash: 'AGENT_HASH_DARRYL_001',
        mobile: '+1-555-7771',
      },
      {
        firstName: 'Janet',
        lastName: 'Tracker',
        email: 'janet@renewhealthcs.com',
        username: 'janet',
        userHash: 'USER_HASH_JANET_002',
        agentHash: 'AGENT_HASH_JANET_002',
        mobile: '+1-555-7772',
      },
    ];

    // Clean up any soft-deleted agent records matching the hashes or emails
    for (const data of trackerAgentsData) {
      const existingAgentConflict = await AgentModel.findOne({
        where: {
          [Op.or]: [{ email: data.email }, { hash: data.agentHash }, { nickname: data.firstName }],
        },
        paranoid: false,
      });
      if (existingAgentConflict && existingAgentConflict.get('deletedAt')) {
        await AgentModel.destroy({ where: { id: existingAgentConflict.id }, force: true });
        console.log(`Cleaned up soft-deleted agent conflict for ${data.email}`);
      }
    }

    for (const data of trackerAgentsData) {
      // Find user by email OR hash
      let user = await UserModel.findOne({
        where: {
          [Op.or]: [{ email: data.email }, { hash: data.userHash }],
        },
        paranoid: false,
      });

      if (!user) {
        user = await UserModel.create({
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          username: data.username,
          password: hashedPassword,
          status: 'Active',
          hash: data.userHash,
          emailStatus: 'verified',
          phoneStatus: 'verified',
          isPasswordSet: true,
          mobile_number: data.mobile,
        });
        console.log(`Created user: ${data.email} (ID: ${user.id})`);
      } else {
        if (user.get('deletedAt')) {
          await user.restore();
        }
        await user.update({
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          username: data.username,
          password: hashedPassword,
          status: 'Active',
          hash: data.userHash,
          isPasswordSet: true,
        });
        console.log(`Updated user: ${data.email} (ID: ${user.id})`);
      }

      // Assign Ticket Tracker role in UserRole
      const existingUserRole = await UserRoleModel.findOne({
        where: {
          user_id: user.id,
          role_id: trackerRole.id,
        },
      });

      if (!existingUserRole) {
        await UserRoleModel.create({
          user_id: user.id,
          role_id: trackerRole.id,
        });
        console.log(`Assigned TICKET_TRACKER role to user ${data.email}`);
      }

      // Find agent by user_id OR hash OR email
      let agent = await AgentModel.findOne({
        where: {
          [Op.or]: [{ user_id: user.id }, { hash: data.agentHash }, { email: data.email }],
        },
        paranoid: false,
      });

      if (!agent) {
        agent = await AgentModel.create({
          first_name: data.firstName,
          last_name: data.lastName,
          nickname: data.firstName,
          email: data.email,
          status: 'Active',
          hash: data.agentHash,
          user_id: user.id,
          mobile_number: data.mobile,
          description: 'Ticket Tracker Agent - Restricted Access',
          remarks: 'Only allowed to view and search ticket tracking page',
        });
        console.log(`Created agent record for: ${data.email} (Agent ID: ${agent.id})`);
      } else {
        if (agent.get('deletedAt')) {
          await agent.restore();
        }
        await agent.update({
          status: 'Active',
          first_name: data.firstName,
          last_name: data.lastName,
          nickname: data.firstName,
          email: data.email,
          hash: data.agentHash,
          user_id: user.id,
        });
        console.log(`Updated agent record for: ${data.email} (Agent ID: ${agent.id})`);
      }
    }

    console.log('--- SUCCESS: Darryl and Janet agent accounts are ready ---');
    console.log('Login Details:');
    console.log('1. Email: darryl@renewhealthcs.com | Password: Mditbt345#');
    console.log('2. Email: janet@renewhealthcs.com | Password: Mditbt345#');
    process.exit(0);
  } catch (err: any) {
    console.error('Error seeding ticket tracker agents:', err?.message || err);
    if (err?.errors) {
      console.error('Detailed validation errors:', err.errors.map((e: any) => ({ message: e.message, path: e.path, value: e.value })));
    }
    process.exit(1);
  }
}

if (require.main === module) {
  seedTicketTrackerAgents();
}
