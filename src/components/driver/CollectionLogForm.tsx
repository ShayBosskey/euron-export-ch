"use client"

import { useId, useState, type FormEvent } from "react"

import { submitCollectionLog } from "@/actions/driverActions"
import {
  MAX_NOTES_LENGTH,
  parseTireCount,
  PAYMENT_METHODS,
  validateCollection,
  type CollectionField,
  type CollectionResult,
  type PaymentMethod,
} from "@/lib/collection-data"
import { ERP_REAUTH_REDIRECT } from "@/lib/erp/errors"

type Saved = Extract<CollectionResult, { success: true }>

interface Props {
  garageId: string
  garageName: string
  /**
   * Idempotency key for this entry. Owned by the parent and only replaced after a confirmed save, so
   * closing and reopening the form after a lost answer resends the same key (never a second log).
   */
  clientUuid: string
  onSaved: (result: Saved) => void
  onCancel: () => void
}

const OFFLINE_TEXT =
  "No connection to the server. The log is not confirmed yet — tap “Save log” again when you have signal; it will not be recorded twice."

const COUNT_FIELDS = [
  { key: "high", label: "High profile" },
  { key: "mid", label: "Mid profile" },
  { key: "trash", label: "Trash" },
] as const

const inputStyle = {
  background: "rgba(255,255,255,0.05)",
  color: "var(--eu-on-dark)",
} as const

function borderFor(hasError: boolean) {
  return hasError ? "var(--eu-error)" : "rgba(255,255,255,0.12)"
}

export default function CollectionLogForm({ garageId, garageName, clientUuid, onSaved, onCancel }: Props) {
  const id = useId()
  const [counts, setCounts] = useState({ high: "", mid: "", trash: "" })
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("")
  const [notes, setNotes] = useState("")
  const [pending, setPending] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<CollectionField, string>>>({})
  const [message, setMessage] = useState<string | null>(null)

  const total = COUNT_FIELDS.reduce((sum, { key }) => sum + (parseTireCount(counts[key]) ?? 0), 0)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending) return

    const values = { garageId, ...counts, amount, paymentMethod: paymentMethod || null, notes, clientUuid }
    const check = validateCollection(values)
    if (!check.ok) {
      setErrors(check.errors)
      setMessage("Please check the highlighted fields.")
      return
    }

    setPending(true)
    setErrors({})
    setMessage(null)
    let result: CollectionResult
    try {
      result = await submitCollectionLog(values)
    } catch {
      // Network failure or the action is unreachable (e.g. right after a deploy). The answer may have
      // been lost after the ERP stored the log; resending with the same key is safe.
      result = { success: false, message: OFFLINE_TEXT, retrySafe: true }
    }
    setPending(false)

    if (!result.success && result.reauth) {
      window.location.assign(ERP_REAUTH_REDIRECT)
      return
    }
    if (result.success) {
      onSaved(result)
      return
    }
    setErrors(result.fieldErrors ?? {})
    setMessage(result.message)
  }

  const describedBy = (field: CollectionField) => (errors[field] ? `${id}-${field}-error` : undefined)

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={`Log collection at ${garageName}`}
      className="rounded-2xl p-4 border space-y-4"
      style={{ background: "var(--eu-surface-dark-elevated)", borderColor: "rgba(255,255,255,0.12)" }}
    >
      <p className="text-xs font-medium tracking-wide" style={{ color: "var(--eu-muted)" }}>
        LOG COLLECTION · {garageName}
      </p>

      <fieldset disabled={pending} className="space-y-4">
        <legend className="sr-only">Tires collected</legend>
        <div className="grid grid-cols-3 gap-2">
          {COUNT_FIELDS.map(({ key, label }) => (
            <div key={key}>
              <label htmlFor={`${id}-${key}`} className="block text-xs mb-1" style={{ color: "var(--eu-on-dark-soft)" }}>
                {label}
              </label>
              <input
                id={`${id}-${key}`}
                name={key}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                placeholder="0"
                maxLength={5}
                value={counts[key]}
                onChange={(e) => setCounts((c) => ({ ...c, [key]: e.target.value }))}
                aria-invalid={Boolean(errors[key] || errors.counts)}
                aria-describedby={describedBy(key) ?? describedBy("counts")}
                className="w-full rounded-lg border px-3 py-2.5 text-base"
                style={{ ...inputStyle, borderColor: borderFor(Boolean(errors[key] || errors.counts)) }}
              />
              {errors[key] && (
                <p id={`${id}-${key}-error`} className="text-xs mt-1" style={{ color: "var(--eu-error)" }}>
                  {errors[key]}
                </p>
              )}
            </div>
          ))}
        </div>
        <p className="text-sm" style={{ color: "var(--eu-on-dark-soft)" }} aria-live="polite">
          Total: <span className="font-semibold" style={{ color: "var(--eu-on-dark)" }}>{total}</span> tires
        </p>
        {errors.counts && (
          <p id={`${id}-counts-error`} className="text-xs" style={{ color: "var(--eu-error)" }}>
            {errors.counts}
          </p>
        )}

        <div>
          <label htmlFor={`${id}-amount`} className="block text-xs mb-1" style={{ color: "var(--eu-on-dark-soft)" }}>
            Amount charged (CHF) — leave empty if nothing was charged
          </label>
          <input
            id={`${id}-amount`}
            name="amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            maxLength={12}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-invalid={Boolean(errors.amount)}
            aria-describedby={describedBy("amount")}
            className="w-full rounded-lg border px-3 py-2.5 text-base"
            style={{ ...inputStyle, borderColor: borderFor(Boolean(errors.amount)) }}
          />
          {errors.amount && (
            <p id={`${id}-amount-error`} className="text-xs mt-1" style={{ color: "var(--eu-error)" }}>
              {errors.amount}
            </p>
          )}
        </div>

        <div role="radiogroup" aria-labelledby={`${id}-method-label`} aria-describedby={describedBy("paymentMethod")}>
          <p id={`${id}-method-label`} className="text-xs mb-1" style={{ color: "var(--eu-on-dark-soft)" }}>
            Payment method (required when an amount is charged)
          </p>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map((method) => {
              const selected = paymentMethod === method
              return (
                <label
                  key={method}
                  className="flex items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium cursor-pointer focus-within:ring-2 focus-within:ring-[var(--eu-recycle-green)]"
                  style={{
                    background: selected ? "rgba(39,160,90,0.18)" : "rgba(255,255,255,0.05)",
                    borderColor: selected ? "var(--eu-recycle-green)" : borderFor(Boolean(errors.paymentMethod)),
                    color: "var(--eu-on-dark)",
                  }}
                >
                  <input
                    type="radio"
                    name={`${id}-payment`}
                    value={method}
                    checked={selected}
                    onChange={() => setPaymentMethod(method)}
                    onClick={() => selected && setPaymentMethod("")}
                    className="sr-only"
                  />
                  {method}
                </label>
              )
            })}
          </div>
          {errors.paymentMethod && (
            <p id={`${id}-paymentMethod-error`} className="text-xs mt-1" style={{ color: "var(--eu-error)" }}>
              {errors.paymentMethod}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={`${id}-notes`} className="block text-xs mb-1" style={{ color: "var(--eu-on-dark-soft)" }}>
            Notes (optional)
          </label>
          <textarea
            id={`${id}-notes`}
            name="notes"
            rows={2}
            maxLength={MAX_NOTES_LENGTH}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            aria-invalid={Boolean(errors.notes)}
            aria-describedby={describedBy("notes")}
            className="w-full rounded-lg border px-3 py-2.5 text-base"
            style={{ ...inputStyle, borderColor: borderFor(Boolean(errors.notes)) }}
          />
          {errors.notes && (
            <p id={`${id}-notes-error`} className="text-xs mt-1" style={{ color: "var(--eu-error)" }}>
              {errors.notes}
            </p>
          )}
        </div>
      </fieldset>

      {(message || errors.garageId || errors.clientUuid) && (
        <p role="alert" className="text-sm" style={{ color: "var(--eu-error)" }}>
          {errors.garageId ?? errors.clientUuid ?? message}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold border"
          style={{ borderColor: "rgba(255,255,255,0.15)", color: "var(--eu-on-dark-soft)", opacity: pending ? 0.5 : 1 }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-[2] inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
          style={{ background: "var(--eu-recycle-green)", color: "var(--eu-on-dark)", opacity: pending ? 0.6 : 1 }}
        >
          {pending && (
            <span
              aria-hidden="true"
              className="w-4 h-4 border-2 rounded-full animate-spin"
              style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white" }}
            />
          )}
          {pending ? "Saving…" : "Save log"}
        </button>
      </div>
    </form>
  )
}
