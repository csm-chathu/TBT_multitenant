import { Sequelize } from "sequelize"


// Import all model initializers
import { initAdmin, Admin } from "./admin"
import { initAgent, Agent } from "./agent"
import { initApplication, Application } from "./application"
import { initArchive, Archive } from "./archive"
import { initAuthKey, AuthKey } from "./auth_key"
import { initCountry, Country } from "./country"
import { initCustomer, Customer } from "./customer"
import { initIncident, Incident } from "./incident"
import { initInventoryItem, InventoryItem } from "./inventory_item"
import { initInventoryItemBrand, InventoryItemBrand } from "./inventory_item_brand"
import { initInventoryItemCategory, InventoryItemCategory } from "./inventory_item_category"
import { initInventoryItemLocation, InventoryItemLocation } from "./inventory_item_location"
import { initInventoryItemUserLog, InventoryItemUserLog } from "./inventory_item_user_log"
import { initMessage, Message } from "./message"
import { initNotification, Notification } from "./notification"
import { initOrganization, Organization } from "./organization"
import { initPrivilege, Privilege } from "./privilege"
import { initRole, Role } from "./role"
import { initSalutation, Salutation } from "./salutation"
import { initState, State } from "./state"
import { initTeamAgent, TeamAgent } from "./team_agent"
import { initTeamApplication, TeamApplication } from "./team_application"
import { initTeamRoles, TeamRoles } from "./team_roles"
import { initTeam, Team } from "./team"
import { initTicketComment, TicketComment } from "./ticket_comment"
import { initTicketHistory, TicketHistory } from "./ticket_history"
import { initTicketStats, TicketStats } from "./ticket_stats"
import { initTicketTemplate, TicketTemplate } from "./ticket_template"
import { initTicket, Ticket } from "./ticket"
import { initTicketsResource, TicketsResource } from "./tickets_resource"
import { initUserSettings, UserSettings } from "./user_settings"
import { initUser, User } from "./user"
import { initUserRole, UserRole } from "./user_role"
import { initWhitelistedDomain, WhitelistedDomain } from "./whitelisted_domain"
import { initTicketInvoice, TicketInvoice } from "./ticket_invoice"
import { initTicketActionType, TicketActionType } from "./ticket_action_type"
import { initTicketUpdateQueue, TicketUpdateQueue } from "./ticket_update_queue"
import { initNote, Note } from "./note"
import { initCannedReply, CannedReply } from "./canned_reply"
import { initCannedReplyVerification, CannedReplyVerification } from "./canned_reply_verification"
import { initZendeskWebhookLog, ZendeskWebhookLog } from "./zendesk_webhook_log"
import sequelize from "../config/database"

// Initialize all models
const AdminModel = initAdmin(sequelize)
const AgentModel = initAgent(sequelize)
const ApplicationModel = initApplication(sequelize)
const ArchiveModel = initArchive(sequelize)
const AuthKeyModel = initAuthKey(sequelize)
const CountryModel = initCountry(sequelize)
const CustomerModel = initCustomer(sequelize)
const IncidentModel = initIncident(sequelize)
const InventoryItemModel = initInventoryItem(sequelize)
const InventoryItemBrandModel = initInventoryItemBrand(sequelize)
const InventoryItemCategoryModel = initInventoryItemCategory(sequelize)
const InventoryItemLocationModel = initInventoryItemLocation(sequelize)
const InventoryItemUserLogModel = initInventoryItemUserLog(sequelize)
const MessageModel = initMessage(sequelize)
const NotificationModel = initNotification(sequelize)
const OrganizationModel = initOrganization(sequelize)
const PrivilegeModel = initPrivilege(sequelize)
const RoleModel = initRole(sequelize)
const UserModel = initUser(sequelize)
const SalutationModel = initSalutation(sequelize)
const StateModel = initState(sequelize)
const TeamAgentModel = initTeamAgent(sequelize)
const TeamApplicationModel = initTeamApplication(sequelize)
const TeamRolesModel = initTeamRoles(sequelize)
const TeamModel = initTeam(sequelize)
const TicketTemplateModel = initTicketTemplate(sequelize)
const TicketModel = initTicket(sequelize)
const TicketStatsModel = initTicketStats(sequelize)
const TicketCommentModel = initTicketComment(sequelize)
const TicketHistoryModel = initTicketHistory(sequelize)
const TicketsResourceModel = initTicketsResource(sequelize)
const UserSettingsModel = initUserSettings(sequelize)
const UserRoleModel = initUserRole(sequelize)
const WhitelistedDomainModel = initWhitelistedDomain(sequelize)
const TicketInvoiceModel = initTicketInvoice(sequelize)
const TicketActionTypeModel = initTicketActionType(sequelize)
const TicketUpdateQueueModel = initTicketUpdateQueue(sequelize)
const NoteModel = initNote(sequelize)
const CannedReplyModel = initCannedReply(sequelize)
const CannedReplyVerificationModel = initCannedReplyVerification(sequelize)
const ZendeskWebhookLogModel = initZendeskWebhookLog(sequelize)

// Define relationships
// Admins
AdminModel.belongsTo(SalutationModel, { foreignKey: "salutation_id" })
AdminModel.belongsTo(UserModel, { foreignKey: "user_id" })
AdminModel.belongsTo(CountryModel, { foreignKey: "country_id" })
AdminModel.belongsTo(StateModel, { foreignKey: "state_id" })

// Agents
AgentModel.belongsTo(SalutationModel, { foreignKey: "salutation_id" })
AgentModel.belongsTo(UserModel, { foreignKey: "user_id" })
AgentModel.belongsTo(CountryModel, { foreignKey: "country_id" })
AgentModel.belongsTo(StateModel, { foreignKey: "state_id" })
AgentModel.hasMany(TeamAgentModel, { foreignKey: "agent_id", as: "teamLinks" })

// Applications
ApplicationModel.belongsTo(OrganizationModel, { foreignKey: "organization_id", as: "organization" })

// AuthKeys
AuthKeyModel.belongsTo(OrganizationModel, { foreignKey: "organization_id" })

// Customers
CustomerModel.belongsTo(SalutationModel, { foreignKey: "salutation_id" })
CustomerModel.belongsTo(UserModel, { foreignKey: "user_id" })
CustomerModel.belongsTo(CountryModel, { foreignKey: "country_id" })
CustomerModel.belongsTo(StateModel, { foreignKey: "state_id" })

// InventoryItem
InventoryItemModel.belongsTo(InventoryItemCategoryModel, { foreignKey: "category_id" })
InventoryItemModel.belongsTo(InventoryItemBrandModel, { foreignKey: "brand_id" })
InventoryItemModel.belongsTo(InventoryItemLocationModel, { foreignKey: "location_id", as: "location" })
InventoryItemModel.belongsTo(UserModel, { foreignKey: "user_id" })

// InventoryItemLocation
InventoryItemLocationModel.belongsTo(CountryModel, { foreignKey: "country_id" })
InventoryItemLocationModel.belongsTo(OrganizationModel, { foreignKey: "organization_id" })

// InventoryItemUserLog
InventoryItemUserLogModel.belongsTo(InventoryItemModel, { foreignKey: "item_id" })
InventoryItemUserLogModel.belongsTo(UserModel, { foreignKey: "user_id" })

// Message
MessageModel.belongsTo(CustomerModel, { foreignKey: "customer_id" })
MessageModel.belongsTo(ApplicationModel, { foreignKey: "application_id" })
MessageModel.belongsTo(TicketModel, { foreignKey: "ticket_id" })

// Notification
NotificationModel.belongsTo(UserModel, { foreignKey: "user_id" })
NotificationModel.belongsTo(TicketModel, { foreignKey: "ticket_id" })

// Organization
OrganizationModel.belongsTo(CountryModel, { foreignKey: "country_id" })
OrganizationModel.belongsTo(StateModel, { foreignKey: "state_id" })
OrganizationModel.belongsTo(UserModel, { foreignKey: "user_id" })

// TeamAgent - Super Many-to-Many relationship
TeamAgentModel.belongsTo(TeamModel, { foreignKey: "team_id", constraints: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
TeamAgentModel.belongsTo(AgentModel, { foreignKey: "agent_id", constraints: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
TeamAgentModel.belongsTo(RoleModel, { foreignKey: "role_id" })
TeamModel.belongsToMany(AgentModel, { 
  through: TeamAgentModel, 
  foreignKey: "team_id", 
  otherKey: "agent_id",
  as: "agents"
})
AgentModel.belongsToMany(TeamModel, { 
  through: TeamAgentModel, 
  foreignKey: "agent_id", 
  otherKey: "team_id",
  as: "teams"
})
TeamModel.hasMany(TeamAgentModel, { foreignKey: "team_id", as: "teamAgentLinks" })
AgentModel.hasMany(TeamAgentModel, { foreignKey: "agent_id", as: "teamAgentLinks" })

// TeamApplication - Super Many-to-Many relationship
TeamApplicationModel.belongsTo(TeamModel, { foreignKey: "team_id" })
TeamApplicationModel.belongsTo(ApplicationModel, { foreignKey: "application_id" })
TeamModel.belongsToMany(ApplicationModel, { 
  through: TeamApplicationModel, 
  foreignKey: "team_id", 
  otherKey: "application_id",
  as: "applications"
})
ApplicationModel.belongsToMany(TeamModel, { 
  through: TeamApplicationModel, 
  foreignKey: "application_id", 
  otherKey: "team_id",
  as: "teams"
})
TeamModel.hasMany(TeamApplicationModel, { foreignKey: "team_id", as: "teamApplicationLinks" })
ApplicationModel.hasMany(TeamApplicationModel, { foreignKey: "application_id", as: "teamApplicationLinks" })

// TeamRoles - Super Many-to-Many relationship (using existing TeamRoles as junction table)
TeamRolesModel.belongsTo(TeamModel, { foreignKey: "team_id" })
TeamRolesModel.belongsTo(RoleModel, { foreignKey: "role_id" })
TeamModel.belongsToMany(RoleModel, { 
  through: TeamRolesModel, 
  foreignKey: "team_id", 
  otherKey: "role_id",
  as: "roles"
})
RoleModel.belongsToMany(TeamModel, { 
  through: TeamRolesModel, 
  foreignKey: "role_id", 
  otherKey: "team_id",
  as: "teams"
})
TeamModel.hasMany(TeamRolesModel, { foreignKey: "team_id", as: "teamRoleLinks" })
RoleModel.hasMany(TeamRolesModel, { foreignKey: "role_id", as: "teamRoleLinks" })

// Team
TeamModel.belongsTo(ApplicationModel, { foreignKey: "application_id" })

// TicketComment
TicketCommentModel.belongsTo(TicketModel, { foreignKey: "ticket_id", constraints: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
TicketCommentModel.belongsTo(TicketCommentModel, { foreignKey: "parent_id", as: "ParentComment" })
TicketCommentModel.belongsTo(UserModel, { foreignKey: "from", as: "FromUser" })
TicketCommentModel.belongsTo(UserModel, { foreignKey: "to", as: "ToUser" })

// TicketHistory
TicketHistoryModel.belongsTo(TicketModel, { foreignKey: "ticket_id", constraints: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
TicketHistoryModel.belongsTo(RoleModel, { foreignKey: "role_id" })
TicketHistoryModel.belongsTo(UserModel, { foreignKey: "user_id", as: "user" })

// Ticket
TicketModel.belongsTo(CustomerModel, { foreignKey: "customer_id", constraints: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
TicketModel.belongsTo(AgentModel, { foreignKey: "agent_id" })
TicketModel.belongsTo(ApplicationModel, { foreignKey: "application_id" })
TicketModel.belongsTo(TicketTemplateModel, { foreignKey: "ticket_template_id", targetKey: "id" })
TicketModel.belongsTo(InventoryItemModel, { foreignKey: "device_id", targetKey: "id", as: "device" })
TicketModel.belongsTo(AgentModel, { foreignKey: "reporter_id", as: "reporter" })
TicketModel.hasOne(TicketInvoiceModel, { foreignKey: "ticket_id", as: "invoice" })

// TicketsResource
TicketsResourceModel.belongsTo(TicketModel, { foreignKey: "ticket_id", constraints: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' })

// TicketInvoice
TicketInvoiceModel.belongsTo(TicketModel, { foreignKey: "ticket_id", constraints: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' })

// User-Role Many-to-Many Relationship
UserModel.belongsToMany(RoleModel, { 
  through: UserRoleModel,
  foreignKey: 'user_id',
  otherKey: 'role_id',
  as: 'roles'
})
RoleModel.belongsToMany(UserModel, { 
  through: UserRoleModel,
  foreignKey: 'role_id',
  otherKey: 'user_id',
  as: 'users'
})
UserRoleModel.belongsTo(UserModel, { foreignKey: 'user_id' })
UserRoleModel.belongsTo(RoleModel, { foreignKey: 'role_id' })

// UserSettings
UserSettingsModel.belongsTo(UserModel, { foreignKey: "user_id" })
UserSettingsModel.belongsTo(OrganizationModel, { foreignKey: "organization_id" })
UserSettingsModel.belongsTo(ApplicationModel, { foreignKey: "application_id" })

// TicketActionType / ActionType
TicketActionTypeModel.belongsTo(ApplicationModel, { foreignKey: "application_id", as: "application" })

// TicketUpdateQueue
TicketUpdateQueueModel.belongsTo(TicketModel, { foreignKey: "ticket_id", constraints: false })
TicketUpdateQueueModel.belongsTo(UserModel, { foreignKey: "created_by", constraints: false, as: "creator" })

// Notes
NoteModel.belongsTo(UserModel, { foreignKey: "user_id", as: "user" })
UserModel.hasMany(NoteModel, { foreignKey: "user_id", as: "notes" })

CannedReplyModel.hasMany(CannedReplyVerificationModel, { foreignKey: "canned_reply_id", as: "verifications" })
CannedReplyVerificationModel.belongsTo(CannedReplyModel, { foreignKey: "canned_reply_id" })

// Export sequelize instance and all models
export {
  sequelize, // Make sure sequelize is exported
  Sequelize,
  Admin,
  Agent,
  Application,
  Archive,
  AuthKey,
  Country,
  Customer,
  Incident,
  InventoryItem,
  InventoryItemBrand,
  InventoryItemCategory,
  InventoryItemLocation,
  InventoryItemUserLog,
  Message,
  Notification,
  Organization,
  Privilege,
  Role,
  Salutation,
  State,
  TeamAgent,
  TeamApplication,
  TeamRoles,
  Team,
  TicketComment,
  TicketHistory,
  TicketStats,
  TicketTemplate,
  Ticket,
  TicketsResource,
  TicketInvoice,
  TicketActionType,
  TicketUpdateQueue,
  Note,
  CannedReply,
  CannedReplyVerification,
  ZendeskWebhookLog,
  UserSettings,
  User,
  UserRole,
  WhitelistedDomain,
}

// Also export as default for convenience
export default sequelize
