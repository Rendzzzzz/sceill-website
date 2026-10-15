// Indonesian administrative regions (province -> city/regency -> district).
// Source: emsifa/api-wilayah-indonesia, bundled so there is no runtime dependency on it.
// Note: this snapshot has 34 provinces; the Papua provinces created from 2022 are not in it yet.
import provincesData from "./data/provinces.json"
import regenciesData from "./data/regencies.json"
import districtsData from "./data/districts.json"

export interface Region {
  id: string
  name: string
}

const PROVINCES = provincesData as Region[]
const REGENCIES = regenciesData as Record<string, Region[]>
const DISTRICTS = districtsData as Record<string, Region[]>

export const PROVINCE_ID = /^\d{2}$/
export const REGENCY_ID = /^\d{4}$/
export const DISTRICT_ID = /^\d{7}$/

export const getProvinces = () => PROVINCES
export const getRegencies = (provinceId: string) => REGENCIES[provinceId] ?? null
export const getDistricts = (regencyId: string) => DISTRICTS[regencyId] ?? null

export interface ResolvedRegion {
  province: Region
  regency: Region
  district: Region
}

// Confirms the three ids belong together and returns their official names.
// Names come from here, never from the browser.
export function resolveRegion(ids: {
  provinceId: string
  regencyId: string
  districtId: string
}): ResolvedRegion | null {
  const province = PROVINCES.find((p) => p.id === ids.provinceId)
  const regency = REGENCIES[ids.provinceId]?.find((r) => r.id === ids.regencyId)
  const district = DISTRICTS[ids.regencyId]?.find((d) => d.id === ids.districtId)
  return province && regency && district ? { province, regency, district } : null
}
