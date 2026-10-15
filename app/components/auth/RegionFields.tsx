"use client"

import { useEffect, useState } from "react"
import type { FieldValues, UseFormReturn } from "react-hook-form"
import { Field, inputClass } from "./AuthShell"

interface Region {
  id: string
  name: string
}

type ListState = { key: string; items: Region[]; failed: boolean }

// Loads one dropdown's options. Returns nothing until `parent` is chosen.
function useRegionList(type: "provinces" | "regencies" | "districts", parent: string | null, retry: number) {
  const url =
    type === "provinces"
      ? "/api/regions?type=provinces"
      : parent
        ? `/api/regions?type=${type}&parent=${parent}`
        : null
  const key = url ? `${url}#${retry}` : ""
  const [state, setState] = useState<ListState>({ key: "", items: [], failed: false })

  useEffect(() => {
    if (!url) return
    const controller = new AbortController()
    fetch(url, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data) => setState({ key, items: data.items, failed: false }))
      .catch((error) => {
        if (error.name !== "AbortError") setState({ key, items: [], failed: true })
      })
    return () => controller.abort()
  }, [url, key])

  // results for an older parent are ignored, so a stale list is never shown
  const current = state.key === key
  return {
    items: current ? state.items : [],
    loading: !!url && !current,
    failed: current && state.failed,
  }
}

export interface AddressFields extends FieldValues {
  provinceId: string
  regencyId: string
  districtId: string
  address: string
}

export function RegionFields<T extends AddressFields>({
  form: typedForm,
  bare = false,
}: {
  form: UseFormReturn<T>
  // bare: no top border or "Delivery address" title, for use inside a card that has its own heading
  bare?: boolean
}) {
  // the field names are fixed by AddressFields, so a plain view of the form keeps the code readable
  const form = typedForm as unknown as UseFormReturn<AddressFields>
  const {
    register,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = form
  const [retry, setRetry] = useState(0)

  const provinceId = watch("provinceId")
  const regencyId = watch("regencyId")

  const provinces = useRegionList("provinces", null, retry)
  const regencies = useRegionList("regencies", provinceId || null, retry)
  const districts = useRegionList("districts", regencyId || null, retry)

  const failed = provinces.failed || regencies.failed || districts.failed

  // A saved address pre-fills these <select>s before their options exist, so the browser
  // drops the value. Once a list has loaded, apply the remembered value again.
  useEffect(() => {
    const v = getValues("provinceId")
    if (provinces.items.length && v) setValue("provinceId", v)
  }, [provinces.items, getValues, setValue])
  useEffect(() => {
    const v = getValues("regencyId")
    if (regencies.items.length && v) setValue("regencyId", v)
  }, [regencies.items, getValues, setValue])
  useEffect(() => {
    const v = getValues("districtId")
    if (districts.items.length && v) setValue("districtId", v)
  }, [districts.items, getValues, setValue])

  const placeholder = (loading: boolean, parentChosen: boolean, empty: string) =>
    !parentChosen ? empty : loading ? "Loading..." : "Select"

  return (
    <fieldset className={bare ? "space-y-5" : "space-y-5 border-t pt-5"}>
      {!bare && (
        <legend className="mb-1 pr-3 text-xs uppercase tracking-[0.2em] text-gold-dark">
          Delivery address
        </legend>
      )}

      <Field label="Province" htmlFor="provinceId" error={errors.provinceId?.message}>
        <select
          id="provinceId"
          aria-invalid={!!errors.provinceId}
          className={inputClass}
          {...register("provinceId", {
            onChange: () => {
              setValue("regencyId", "")
              setValue("districtId", "")
            },
          })}
        >
          <option value="">{provinces.loading ? "Loading..." : "Select province"}</option>
          {provinces.items.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </Field>

      <Field label="City / Regency" htmlFor="regencyId" error={errors.regencyId?.message}>
        <select
          id="regencyId"
          disabled={!provinceId}
          aria-invalid={!!errors.regencyId}
          className={`${inputClass} disabled:cursor-not-allowed disabled:bg-sand/40 disabled:text-muted`}
          {...register("regencyId", { onChange: () => setValue("districtId", "") })}
        >
          <option value="">
            {placeholder(regencies.loading, !!provinceId, "Select province first")}
          </option>
          {regencies.items.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </Field>

      <Field label="District (Kecamatan)" htmlFor="districtId" error={errors.districtId?.message}>
        <select
          id="districtId"
          disabled={!regencyId}
          aria-invalid={!!errors.districtId}
          className={`${inputClass} disabled:cursor-not-allowed disabled:bg-sand/40 disabled:text-muted`}
          {...register("districtId")}
        >
          <option value="">
            {placeholder(districts.loading, !!regencyId, "Select city first")}
          </option>
          {districts.items.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </Field>

      {failed && (
        <p className="text-sm text-red-700" role="alert">
          Could not load the list.{" "}
          <button
            type="button"
            onClick={() => setRetry((n) => n + 1)}
            className="cursor-pointer underline underline-offset-4"
          >
            Try again
          </button>
        </p>
      )}

      <Field label="Street address" htmlFor="address" error={errors.address?.message}>
        <textarea
          id="address"
          rows={3}
          autoComplete="street-address"
          placeholder="Street, house number, RT/RW, village, landmarks"
          aria-invalid={!!errors.address}
          className={`${inputClass} h-auto resize-none py-3`}
          {...register("address")}
        />
      </Field>
    </fieldset>
  )
}
