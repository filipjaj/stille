import { describe, expect, it } from 'vitest'
import type { PayloadRequest } from 'payload'
import {
  adminOnlyFieldAccess,
  adminOrPublishedStatus,
  isAdmin,
  isAuthenticated,
  isCustomer,
  isDocumentOwner,
} from './index'

// Access-funksjonene leser utelukkende req.user. Vi konstruerer et minimalt
// objekt og caster, framfor å starte en hel Payload-instans for en ren predikattest.
const args = (user: unknown) => ({ req: { user } as PayloadRequest })

const admin = { id: 1, roles: ['admin'] }
const customer = { id: 42, roles: ['customer'] }
const guest: null = null

describe('isAdmin', () => {
  it('slipper gjennom en administrator', () => {
    expect(isAdmin(args(admin))).toBe(true)
  })

  it('avviser en kunde', () => {
    expect(isAdmin(args(customer))).toBe(false)
  })

  it('avviser en gjest', () => {
    expect(isAdmin(args(guest))).toBe(false)
  })

  it('avviser en bruker uten roller', () => {
    expect(isAdmin(args({ id: 7 }))).toBe(false)
  })
})

describe('isAuthenticated', () => {
  it('slipper gjennom enhver innlogget bruker', () => {
    expect(isAuthenticated(args(customer))).toBe(true)
  })

  it('avviser en gjest', () => {
    expect(isAuthenticated(args(guest))).toBe(false)
  })
})

describe('isCustomer', () => {
  it('slipper gjennom en kunde', () => {
    expect(isCustomer(args(customer))).toBe(true)
  })

  it('avviser en gjest', () => {
    expect(isCustomer(args(guest))).toBe(false)
  })
})

describe('adminOnlyFieldAccess', () => {
  it('slipper gjennom en administrator', () => {
    expect(adminOnlyFieldAccess(args(admin))).toBe(true)
  })

  it('avviser en kunde', () => {
    expect(adminOnlyFieldAccess(args(customer))).toBe(false)
  })
})

describe('isDocumentOwner', () => {
  it('gir en administrator full tilgang', () => {
    expect(isDocumentOwner(args(admin))).toBe(true)
  })

  it('begrenser en kunde til egne dokumenter', () => {
    expect(isDocumentOwner(args(customer))).toEqual({
      customer: { equals: 42 },
    })
  })

  it('avviser en gjest fullstendig', () => {
    // Kritisk: en gjest må aldri få en Where-spørring som kan matche noe.
    expect(isDocumentOwner(args(guest))).toBe(false)
  })
})

describe('adminOrPublishedStatus', () => {
  it('gir en administrator tilgang til utkast', () => {
    expect(adminOrPublishedStatus(args(admin))).toBe(true)
  })

  it('begrenser alle andre til publiserte dokumenter', () => {
    expect(adminOrPublishedStatus(args(guest))).toEqual({
      _status: { equals: 'published' },
    })
  })
})
