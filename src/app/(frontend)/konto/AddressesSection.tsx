'use client'

import { defaultCountries, useAddresses } from '@payloadcms/plugin-ecommerce/client/react'
import React from 'react'

import { Button } from '@/components/stille/Button'
import { Dialog } from '@/components/stille/Dialog'
import { EmptyState } from '@/components/stille/EmptyState'
import { Field } from '@/components/stille/Field'
import { Select } from '@/components/stille/Select'
import { TextLink } from '@/components/stille/TextLink'
import type { Address } from '@/payload-types'

import styles from './AddressesSection.module.css'

type FormState = {
  title: string
  firstName: string
  lastName: string
  addressLine1: string
  addressLine2: string
  postalCode: string
  city: string
  country: string
  phone: string
}

const emptyForm: FormState = {
  title: '',
  firstName: '',
  lastName: '',
  addressLine1: '',
  addressLine2: '',
  postalCode: '',
  city: '',
  country: 'NO',
  phone: '',
}

const toFormState = (address: Address): FormState => ({
  title: address.title ?? '',
  firstName: address.firstName ?? '',
  lastName: address.lastName ?? '',
  addressLine1: address.addressLine1 ?? '',
  addressLine2: address.addressLine2 ?? '',
  postalCode: address.postalCode ?? '',
  city: address.city ?? '',
  country: address.country ?? 'NO',
  phone: address.phone ?? '',
})

/**
 * Adresser fra `plugin-ecommerce`s `useAddresses`. Kun opprett/rediger er
 * tilgjengelig fra hooken — det finnes ikke noen `deleteAddress` i klient-APIet.
 */
export function AddressesSection() {
  const { addresses, createAddress, isLoading, updateAddress } = useAddresses<Address>()
  const [editing, setEditing] = React.useState<Address | 'new' | null>(null)
  const [form, setForm] = React.useState<FormState>(emptyForm)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const openCreate = () => {
    setForm(emptyForm)
    setError(null)
    setEditing('new')
  }

  const openEdit = (address: Address) => {
    setForm(toFormState(address))
    setError(null)
    setEditing(address)
  }

  const close = () => {
    if (saving) return
    setEditing(null)
  }

  const set =
    <K extends keyof FormState>(key: K) =>
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: event.target.value }))

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (editing === 'new') {
        await createAddress(form)
      } else if (editing) {
        await updateAddress(editing.id, form)
      }
      setEditing(null)
    } catch {
      setError('Kunne ikke lagre adressen. Prøv igjen.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section>
      <div className={styles.header}>
        <h2>Adresser</h2>
        <Button variant="secondary" onClick={openCreate}>
          Legg til adresse
        </Button>
      </div>

      {isLoading ? null : addresses.length === 0 ? (
        <EmptyState title="Ingen adresser lagret.">
          Legg til en leveringsadresse for raskere handel neste gang.
        </EmptyState>
      ) : (
        <div className={styles.list}>
          {addresses.map((address) => (
            <div key={address.id} className={styles.card}>
              <address>
                {address.title ? <strong>{address.title}</strong> : null}
                <br />
                {address.firstName} {address.lastName}
                <br />
                {address.addressLine1}
                {address.addressLine2 ? (
                  <>
                    <br />
                    {address.addressLine2}
                  </>
                ) : null}
                <br />
                {address.postalCode} {address.city}
              </address>
              <TextLink plain onClick={() => openEdit(address)}>
                Rediger
              </TextLink>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={editing !== null}
        onClose={close}
        title={editing === 'new' ? 'Ny adresse' : 'Rediger adresse'}
      >
        <form className={styles.form} onSubmit={onSubmit}>
          <Field
            label="Merkelapp"
            placeholder="Hjem, jobb …"
            value={form.title}
            onChange={set('title')}
          />
          <div className={styles.row}>
            <Field label="Fornavn" required value={form.firstName} onChange={set('firstName')} />
            <Field label="Etternavn" required value={form.lastName} onChange={set('lastName')} />
          </div>
          <Field
            label="Adresse"
            required
            value={form.addressLine1}
            onChange={set('addressLine1')}
          />
          <Field label="Adresselinje 2" value={form.addressLine2} onChange={set('addressLine2')} />
          <div className={styles.row2}>
            <Field
              label="Postnr"
              inputMode="numeric"
              required
              value={form.postalCode}
              onChange={set('postalCode')}
            />
            <Field label="Sted" required value={form.city} onChange={set('city')} />
          </div>
          <Select
            label="Land"
            items={defaultCountries}
            value={form.country}
            onValueChange={(value) => setForm({ ...form, country: value })}
          />
          <Field label="Mobil" type="tel" value={form.phone} onChange={set('phone')} />

          {error ? <p style={{ color: 'var(--st-error)', margin: 0 }}>{error}</p> : null}

          <div className={styles.actions}>
            <Button type="button" variant="secondary" onClick={close} disabled={saving}>
              Avbryt
            </Button>
            <Button type="submit" loading={saving}>
              Lagre
            </Button>
          </div>
        </form>
      </Dialog>
    </section>
  )
}
