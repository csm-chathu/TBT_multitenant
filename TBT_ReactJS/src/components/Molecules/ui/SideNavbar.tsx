"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import LogoDark from "@/assets/Images/Logo-Dark.png";
import LogoLight from "@/assets/Images/Logo-Light.png";
import {  useAppSelector } from '@/redux/hooks'
import {  selectCurrentUser } from '@/redux/user/userSlice'
import { USER_TYPE_NAMES } from '@/constants/userTypes'
import api from '@/services/api'

interface NavItem {
  id: number;
  title: string;
  icon: string;
  path: string;
  allowedRoles?: string[];
}
interface Inventory {
  id: number;
  title: string;
  icon: string;
  path: string;
  allowedRoles?: string[];
}

interface SideNavbarProps {
  toggle: boolean;
  onToggle: () => void;
}

const SideNavbar: React.FC<SideNavbarProps> = ({ toggle, onToggle }) => {
  const location = useLocation();
  const user = useAppSelector(selectCurrentUser)
  const [twilioBalance, setTwilioBalance] = useState<{ balance: string; currency: string; cachedAt?: number } | null>(null)

  useEffect(() => {
    api.get('/sms/balance')
      .then(res => {
        if (res.data?.available) setTwilioBalance({ balance: res.data.balance, currency: res.data.currency, cachedAt: res.data.cachedAt })
      })
      .catch(() => {})
  }, [])

  const navItems: NavItem[] = [
    {
      id: 0,
      title: "Dashboard",
      icon: "dashboard",
      path: "/dashboard/overview",
    },
    {
      id: 1,
      title: "Tickets",
      icon: "local_activity",
      path: "/dashboard/tickets",
    },
    {
      id: 2,
      title: "Applications",
      icon: "folder_open",
      path: "/dashboard/applications",
      allowedRoles: [USER_TYPE_NAMES.SUPER_ADMIN],
    },
    {
      id: 3,
      title: "Agents",
      icon: "admin_panel_settings",
      path: "/dashboard/agents",
      allowedRoles: [USER_TYPE_NAMES.SUPER_ADMIN, USER_TYPE_NAMES.TEAM_LEAD],
    },
    {
      id: 4,
      title: "Team",
      icon: "group",
      path: "/dashboard/team",
      allowedRoles: [USER_TYPE_NAMES.SUPER_ADMIN, USER_TYPE_NAMES.AGENT, USER_TYPE_NAMES.TEAM_LEAD],
    },
    {
      id: 5,
      title: "Customers",
      icon: "person",
      path: "/dashboard/customers",
      allowedRoles: [USER_TYPE_NAMES.SUPER_ADMIN, USER_TYPE_NAMES.AGENT, USER_TYPE_NAMES.TEAM_LEAD],
    },
    {
      id: 6,
      title: "Messages",
      icon: "mail",
      path: "/dashboard/messages",
      allowedRoles: [USER_TYPE_NAMES.SUPER_ADMIN, USER_TYPE_NAMES.AGENT, USER_TYPE_NAMES.TEAM_LEAD],
    },
    {
      id: 7,
      title: "Notes",
      icon: "note",
      path: "/dashboard/notes",
      allowedRoles: [USER_TYPE_NAMES.SUPER_ADMIN, USER_TYPE_NAMES.AGENT, USER_TYPE_NAMES.TEAM_LEAD],
    },
    {
      id: 8,
      title: "ABC Sheets",
      icon: "table_chart",
      path: "/dashboard/abc-sheets",
      allowedRoles: [USER_TYPE_NAMES.SUPER_ADMIN, USER_TYPE_NAMES.AGENT, USER_TYPE_NAMES.TEAM_LEAD],
    },
    {
      id: 9,
      title: "Support Connection",
      icon: "headphones",
      path: "/dashboard/support",
      allowedRoles: [USER_TYPE_NAMES.SUPER_ADMIN, USER_TYPE_NAMES.AGENT, USER_TYPE_NAMES.TEAM_LEAD],
    },
  ];

  const metaItems: NavItem[] = [
    {
      id: 0,
      title: "Canned Replies",
      icon: "quick_phrases",
      path: "/dashboard/meta",
      allowedRoles: [USER_TYPE_NAMES.SUPER_ADMIN],
    },
  ];
  const inventoryItems: Inventory[] = [
    { id: 0, title: "Items", icon: "inventory_2", path: "/dashboard/inventory/items", allowedRoles: [USER_TYPE_NAMES.SUPER_ADMIN, USER_TYPE_NAMES.AGENT, USER_TYPE_NAMES.TEAM_LEAD] },
    { id: 1, title: "Brands", icon: "branding_watermark", path: "/dashboard/inventory/brands", allowedRoles: [USER_TYPE_NAMES.SUPER_ADMIN, USER_TYPE_NAMES.AGENT, USER_TYPE_NAMES.TEAM_LEAD] },
    { id: 2, title: "Categories", icon: "category", path: "/dashboard/inventory/category", allowedRoles: [USER_TYPE_NAMES.SUPER_ADMIN, USER_TYPE_NAMES.AGENT, USER_TYPE_NAMES.TEAM_LEAD] },
    { id: 3, title: "Locations", icon: "location_on", path: "/dashboard/inventory/locations", allowedRoles: [USER_TYPE_NAMES.SUPER_ADMIN, USER_TYPE_NAMES.AGENT, USER_TYPE_NAMES.TEAM_LEAD] },
  ];

  const normalizeRole = (s?: string) =>
    s ? String(s).toLowerCase().replace(/[^a-z0-9]/g, "") : "";

  // Build a set of normalized user role identifiers (include both `name` and `label` when available)
  const userRolesSet = new Set<string>(
    (user?.roles || [])
      .flatMap((r: any) => [r.name, r.label])
      .filter(Boolean)
      .map(normalizeRole)
  );

  const isVisibleToUser = (allowedRoles?: string[]) => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    if (!userRolesSet || userRolesSet.size === 0) return false;
    return allowedRoles
      .map(normalizeRole)
      .some((role) => userRolesSet.has(role));
  };


  return (
    <nav
      className={cn(
        "w-full md:h-screen overflow-hidden md:overflow-visible absolute md:sticky z-20 top-0 duration-300 bg-surface-primary text-textColor-base border-r border-borderColor-secondary flex flex-col no-scrollbar",
        toggle ? "h-screen md:w-[260px]" : "h-[64px] md:w-[64px]"
      )}
    >
      <div className="w-full h-16 shrink-0 px-3 flex justify-between items-center border-b border-borderColor-secondary">
        <Link to="/">
          <img
            src={LogoDark}
            alt="Logo"
            className={cn(
              "w-full h-[28px] dark:hidden",
              !toggle && "md:hidden"
            )}
          />
          <img
            src={LogoLight}
            alt="Logo"
            className={cn(
              "w-full h-[28px] hidden dark:block",
              !toggle && "md:hidden dark:md:hidden"
            )}
          />
        </Link>
        <div
          onClick={onToggle}
          className="flex items-center justify-center h-8 w-8 cursor-pointer text-textColor-base md:bg-surface-secondary rounded-full"
        >
          {toggle ? (
            <>
              <span className="material-symbols-outlined hidden md:block">
                chevron_left
              </span>
              <span className="material-symbols-outlined md:hidden">close</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined hidden md:block">
                chevron_right
              </span>
              <span className="material-symbols-outlined md:hidden">menu</span>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-20 no-scrollbar">
        <ul>
          <li className="text-xs text-textColor-muted uppercase px-3 mt-4">
            Menu
          </li>
          {navItems.filter(item => isVisibleToUser(item.allowedRoles)).map((item) => (
            <li
              key={item.id}
              className="relative group mx-3 mt-2 rounded-md duration-200 text-textColor-muted hover:text-textColor-base hover:bg-primary-100"
            >
              <Link
                to={item.path}
                className={cn(
                  "flex items-center justify-between px-2 py-1 rounded-md",
                  location.pathname === item.path && "bg-primary-500 text-white"
                )}
              >
                <div className="flex items-center gap-x-3" title={item.title}>
                  <span className="material-symbols-outlined text-2xl">
                    {item.icon}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      toggle ? "block" : "hidden"
                    )}
                  >
                    {item.title}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        {inventoryItems.filter(item => isVisibleToUser(item.allowedRoles)).length > 0 && (
          <ul className="mt-6">
            <li className="text-xs text-textColor-muted uppercase px-3 truncate">
              Inventory
            </li>
            {inventoryItems.filter(item => isVisibleToUser(item.allowedRoles)).map((item) => (
              <li
                key={item.id}
                className="relative group mx-3 mt-2 rounded-md duration-200 text-textColor-muted hover:text-textColor-base hover:bg-primary-100"
              >
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center justify-between px-2 py-1 rounded-md",
                    location.pathname === item.path && "bg-primary-500 text-white"
                  )}
                >
                  <div className="flex items-center gap-x-3">
                    <span className="material-symbols-outlined text-2xl">
                      {item.icon}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        toggle ? "block" : "hidden"
                      )}
                    >
                      {item.title}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {metaItems.filter(item => isVisibleToUser(item.allowedRoles)).length > 0 && (
          <ul className="mt-6">
            <li className="text-xs text-textColor-muted uppercase px-3 truncate">
              Meta
            </li>
            {metaItems.filter(item => isVisibleToUser(item.allowedRoles)).map((item) => (
              <li
                key={item.id}
                className="relative group mx-3 mt-2 rounded-md duration-200 text-textColor-muted hover:text-textColor-base hover:bg-primary-100"
              >
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center justify-between px-2 py-1 rounded-md",
                    location.pathname === item.path && "bg-primary-500 text-white"
                  )}
                >
                  <div className="flex items-center gap-x-3" title={item.title}>
                    <span className="material-symbols-outlined text-2xl">
                      {item.icon}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        toggle ? "block" : "hidden"
                      )}
                    >
                      {item.title}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {twilioBalance && (() => {
        const amount = parseFloat(twilioBalance.balance)
        const isLow = amount < 10
        const cachedMinsAgo = twilioBalance.cachedAt
          ? Math.round((Date.now() - twilioBalance.cachedAt) / 60000)
          : null
        const cacheLabel = cachedMinsAgo !== null
          ? cachedMinsAgo === 0 ? 'just now' : `${cachedMinsAgo}m ago`
          : ''
        return (
          <div className={cn(
            "absolute bottom-4 left-0 right-0 mx-3 px-2 py-2 rounded-lg border bg-surface-secondary",
            isLow ? "border-red-500 bg-red-50 dark:bg-red-950/30" : "border-borderColor-secondary",
            toggle ? "flex" : "hidden md:flex md:justify-center"
          )}>
            {toggle ? (
              <div className="flex items-center gap-2">
                <span className={cn("material-symbols-outlined text-xl shrink-0", isLow ? "text-red-500" : "text-green-500")}>
                  {isLow ? "warning" : "sim_card"}
                </span>
                <div className="min-w-0">
                  <p className={cn("text-[10px] uppercase tracking-wide leading-none mb-0.5", isLow ? "text-red-500 font-semibold" : "text-textColor-muted")}>
                    {isLow ? "Low Balance" : "Twilio Credit"}
                  </p>
                  <p className={cn("text-sm font-semibold", isLow ? "text-red-600" : "text-textColor-base")}>
                    {twilioBalance.currency} {amount.toFixed(2)}
                  </p>
                  {cacheLabel && (
                    <p className="text-[10px] text-textColor-muted mt-0.5">updated {cacheLabel}</p>
                  )}
                </div>
              </div>
            ) : (
              <span
                className={cn("material-symbols-outlined text-xl", isLow ? "text-red-500" : "text-green-500")}
                title={`${isLow ? "Low Balance! " : ""}Twilio: ${twilioBalance.currency} ${amount.toFixed(2)}${cacheLabel ? ` · updated ${cacheLabel}` : ''}`}
              >
                {isLow ? "warning" : "sim_card"}
              </span>
            )}
          </div>
        )
      })()}
    </nav>
  );
};

export default SideNavbar;
