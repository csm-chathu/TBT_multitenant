/**
 * Generic entity status values shared across forms and tables.
 */
export const ENTITY_STATUS = {
  ACTIVE: "Active",
  DISABLED: "Disabled",
} as const;

export const ENTITY_STATUS_VALUES = Object.values(ENTITY_STATUS);

export const ENTITY_STATUS_OPTIONS = ENTITY_STATUS_VALUES.map((status) => ({
  value: status,
  label: status,
}));


