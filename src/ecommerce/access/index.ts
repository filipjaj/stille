import type { Access, FieldAccess } from 'payload'

type Role = 'admin' | 'customer'

/**
 * req.user er typet som den autentiserte collection-en, som ikke nødvendigvis
 * har roller. Vi smalner den til den formen vi faktisk leser.
 */
type UserWithRoles = {
  id: number | string
  roles?: Role[] | null
}

const hasRole = (user: unknown, role: Role): boolean => {
  const roles = (user as UserWithRoles | null | undefined)?.roles
  return Array.isArray(roles) && roles.includes(role)
}

export const isAdmin: Access = ({ req }) => hasRole(req.user, 'admin')

export const isAuthenticated: Access = ({ req }) => Boolean(req.user)

export const isCustomer: FieldAccess = ({ req }) => hasRole(req.user, 'customer')

export const adminOnlyFieldAccess: FieldAccess = ({ req }) => hasRole(req.user, 'admin')

/**
 * Administratorer ser utkast. Alle andre ser kun publiserte dokumenter.
 * Produkt-collection-en har drafts påslått av plugin-en, så `_status` finnes.
 */
export const adminOrPublishedStatus: Access = ({ req }) => {
  if (hasRole(req.user, 'admin')) {
    return true
  }
  return { _status: { equals: 'published' } }
}

/**
 * Begrenser til dokumenter kunden eier. En gjest får `false`, ikke en tom
 * spørring — en spørring uten betingelser ville matchet alt.
 */
export const isDocumentOwner: Access = ({ req }) => {
  if (hasRole(req.user, 'admin')) {
    return true
  }
  if (!req.user) {
    return false
  }
  return { customer: { equals: req.user.id } }
}
