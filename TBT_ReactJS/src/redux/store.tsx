import { configureStore } from "@reduxjs/toolkit";
import teamReducer from "./team/teamSlice";
import applicationReducer from "./applications/applicationSlice";
import agentReducer from "./agent/agentSlice";
import { customerReducer } from "./customer/customerSlice";
import { brandReducer } from "./brand/brandSlice";
import { itemReducer } from "./item/itemSlice";
import { categoryReducer } from "./category/categorySlice";
import { locationReducer } from "./location/locationSlice";
import { countryReducer } from "./country/countrySlice";
import { stateReducer } from "./state/stateSlice";
import { organizationReducer } from "./organizations/organizationSlice";
import ticketReducer from "./ticket/ticketSlice";
import userReducer from "./user/userSlice";
import notificationReducer from './notification/notificationSlice'

const store = configureStore({
  reducer: {
    teams: teamReducer,
    agents: agentReducer,
    applications: applicationReducer, 
    customers: customerReducer,
    brands: brandReducer,
    items: itemReducer,
    categories: categoryReducer,
    locations: locationReducer,
    countries: countryReducer,
    states: stateReducer,
    organizations: organizationReducer,
    tickets: ticketReducer,
    notifications: notificationReducer,
    user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
