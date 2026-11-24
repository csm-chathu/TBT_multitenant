import { Routes, Route } from "react-router-dom"
import RealtimeProvider from './providers/RealtimeProvider'
import LandingPage from "./pages/LandingPage"
import Login from "./pages/auth/Login"
import ResetPassword from "./pages/auth/resetPassword/ResetPassword"
import ResetPasswordWithToken from "./pages/auth/resetPassword/ResetPasswordWithToken"
import DashboardLayout from "./layouts/DashboardLayout"
import Overview from "./pages/Dashboard/Overview"
import AllAgents from "./pages/Dashboard/agents/AllAgents"
import AddAgent from "./pages/Dashboard/agents/AddAgent"
import AllApplications from "./pages/Dashboard/applications/AllApplications"
import AllCustomers from "./pages/Dashboard/customers/AllCustomers"
import AllMessages from "./pages/Dashboard/Messages/AllMessages"
import UserProfile from "./pages/Dashboard/User/UserProfile"
import AllTeam from "./pages/Dashboard/Team/AllTeam"
import AllTickets from "./pages/Dashboard/Ticket/AllTickets"
import ViewTicket from "./pages/Dashboard/Ticket/ViewTicket"
import AddApplications from "./pages/Dashboard/applications/AddApplications"
import ViewApplications from "./pages/Dashboard/applications/ViewApplications"
import ViewTeam from "./pages/Dashboard/Team/ViewTeam"
import { AddTeam } from "./pages/Dashboard/Team/AddTeam"
import ViewCustomers from "./pages/Dashboard/customers/ViewCustomers"
import AddCustomer from "./pages/Dashboard/customers/AddCustomer"
import AllBrand from "./pages/Dashboard/inventory/brand/AllBrand"
import AllItems from "./pages/Dashboard/inventory/items/AllItems"
import AllLocation from "./pages/Dashboard/inventory/location/AllLocation"
import AllCategory from "./pages/Dashboard/inventory/category/AllCategory"
import AddBrand from "./pages/Dashboard/inventory/brand/AddBrand"
import EditBrand from "./pages/Dashboard/inventory/brand/EditBrand"
import AddCategory from "./pages/Dashboard/inventory/category/AddCategory"
import EditCategory from "./pages/Dashboard/inventory/category/EditCategory"
import AddLocation from "./pages/Dashboard/inventory/location/AddLocation"
import EditLocation from "./pages/Dashboard/inventory/location/EditLocation"
import AddItems from "./pages/Dashboard/inventory/items/AddItems"
import EditItems from "./pages/Dashboard/inventory/items/EditItems"
import EditApplications from "./pages/Dashboard/applications/EditApplication"
import { EditTeam } from "./pages/Dashboard/Team/EditTeam"
import EditCustomer from "./pages/Dashboard/customers/EditCustomer"
import EditAgent from "./pages/Dashboard/agents/EditAgent"
import PrivateRoute from "./components/PrivateRoute"
import ViewAgent from "./pages/Dashboard/agents/ViewAgent"
import AddTicket from "./pages/Dashboard/Ticket/TicketForm/AddTicket"
import EditTicket from "./pages/Dashboard/Ticket/EditTicket"
import { AccountSetting } from "./pages/Dashboard/settings/account/AccountSetting"
import { Settings } from "./pages/Dashboard/settings/Settings"
import { SecuritySettings } from "./pages/Dashboard/settings/security/SecuritySettings"
import { DatabaseBackup } from "./pages/Dashboard/settings/backup/DatabaseBackup"
import MetaPage from "./pages/Dashboard/Meta/MetaPage"
import { NotificationSetting } from "./pages/Dashboard/settings/notification/NotificationSetting"
import { Privacy } from "./pages/Privacy"
import { Terms } from "./pages/Terms"
import { UserGuide } from "./pages/UserGuide"
import Docs from "./pages/Docs"
import NotFound from "./pages/NotFound"
import PublicTicketCreation from "./pages/PublicTicketCreation"
import PublicTicketTracking from "./pages/PublicTicketTracking"
import Notes from "./pages/Dashboard/Notes/Note"
import Analysis from "./pages/Dashboard/Analysis"
import FollowUpHistory from "./pages/Dashboard/FollowUpHistory"
import AbcSheetIframe from "./pages/Dashboard/AbcDocuments/AbcSheetIframe"
import { SupportConnection } from "./pages/Dashboard/support/SupportConnection"


function App() {
  return (
    <RealtimeProvider>
      <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/create-ticket" element={<PublicTicketCreation />} />
      <Route path="/track-ticket" element={<PublicTicketTracking />} />
      <Route path="/track" element={<PublicTicketTracking />} />
      <Route path="/track-ticket/:hash" element={<PublicTicketTracking />} />
      <Route path="/track/:hash" element={<PublicTicketTracking />} />
      <Route path="/public/tickets/:hash" element={<PublicTicketTracking />} />
      <Route path="/tickets/:hash/customer/:customerHash" element={<PublicTicketTracking />} />
      <Route path="/submit-ticket" element={<PublicTicketCreation />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/user-guide" element={<UserGuide />} />
      <Route path="/opt-in-doc" element={<Docs />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/reset_password/:token" element={<ResetPasswordWithToken />} />
      {/* Ticket view by hash - accessible at root level like old URL */}
      <Route path="/ticket/:hash" element={
        <PrivateRoute>
          <DashboardLayout />
        </PrivateRoute>
      }>
        <Route index element={<ViewTicket />} />
      </Route>

      {/* Dashboard Routes */}
      <Route path="/dashboard" element={
        <PrivateRoute>
          <DashboardLayout />
        </PrivateRoute>
      }>
        <Route index element={<Overview />} />
        <Route path="overview" element={<Overview />} />

        {/* ABC Sheets */}
        <Route path="abc-sheets" element={<AbcSheetIframe />} />

        {/* Tickets */}
        <Route path="tickets" element={<AllTickets />} />
        <Route path="tickets/add" element={<AddTicket />} />
        <Route path="tickets/edit/:hash" element={<EditTicket />} />
        <Route path="tickets/details/:hash" element={<ViewTicket />} />

        {/* Applications */}
        <Route path="applications" element={<AllApplications />} />
        <Route path="applications/details/:hash" element={<ViewApplications />} />
        <Route path="applications/add" element={<AddApplications />} />
        <Route path="applications/edit/:hash" element={<EditApplications />} />

        {/* Agents */}
        <Route path="agents" element={<AllAgents />} />
        <Route path="agents/details/:hash" element={<ViewAgent />} />
        <Route path="agents/add" element={<AddAgent />} />
        <Route path="agents/edit/:hash" element={<EditAgent />} />

        {/* Team */}
        <Route path="team" element={<AllTeam />} />
        <Route path="team/details/:hash" element={<ViewTeam />} />
        <Route path="team/add" element={<AddTeam />} />
        <Route path="team/edit/:hash" element={<EditTeam />} />

        {/* Customers */}
        <Route path="customers" element={<AllCustomers />} />
        <Route path="customers/add" element={<AddCustomer />} />
        <Route path="customers/details/:hash" element={<ViewCustomers />} />
        <Route path="customers/edit/:hash" element={<EditCustomer />} />


        {/* Inventory brands */}
        <Route path="inventory/brands" element={<AllBrand />} />
        <Route path="inventory/brands/add" element={<AddBrand />} />
        <Route path="inventory/brands/edit/:hash" element={<EditBrand />} />

        {/* Inventory items */}
        <Route path="inventory/items" element={<AllItems />} />
        <Route path="inventory/items/add" element={<AddItems />} />
        <Route path="inventory/items/edit/:hash" element={<EditItems />} />

        {/* Inventory category */}
        <Route path="inventory/category" element={<AllCategory />} />
        <Route path="inventory/category/add" element={<AddCategory />} />
        <Route path="inventory/category/edit/:hash" element={<EditCategory />} />

        {/* Inventory locations */}
        <Route path="inventory/locations" element={<AllLocation />} />
        <Route path="inventory/locations/add" element={<AddLocation />} />
        <Route path="inventory/locations/edit/:hash" element={<EditLocation />} />

        {/* Analysis */}
        <Route path="analysis" element={<Analysis />} />
        {/* Follow Up History */}
        <Route path="follow-up-history" element={<FollowUpHistory />} />

        {/* Messages */}
        <Route path="messages" element={<AllMessages />} />
        {/* Profile */}
        <Route path="profile" element={<UserProfile />} />
        {/* Note */}
        <Route path="notes" element={<Notes />} />
        {/* Meta */}
        <Route path="meta" element={<MetaPage />} />
        {/* Support Connection */}
        <Route path="support" element={<SupportConnection />} />
        {/* Settings */}
        <Route path="settings" element ={<Settings />}>
            <Route path="account" element = {<AccountSetting/>}/>
            <Route path="security" element = {<SecuritySettings/>}/>
            <Route path="notification" element = {<NotificationSetting/>}/>
            <Route path="database" element = {<DatabaseBackup/>}/>
        </Route >

      </Route>
      {/* 404 Catch-all route */}
      <Route path="*" element={<NotFound />} />
      </Routes>
    </RealtimeProvider>
  )
}

export default App
