/** Role names exactly as defined in the ERP app (euron_export_erp/roles.py). */
export const EURON_ADMIN = "Euron Admin"
export const EURON_DRIVER = "Euron Driver"
export const GARAGE_PORTAL_USER = "Garage Portal User"

export const APP_ROLES = [EURON_ADMIN, EURON_DRIVER, GARAGE_PORTAL_USER] as const

export type AppRole = (typeof APP_ROLES)[number]
