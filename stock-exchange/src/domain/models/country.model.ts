export interface CountryDto {
  id: string
  countryArName: string
  countryEnName: string
  code: string // Dial code e.g. "+20", "+966"
  isActive: boolean
  usersCount: number
  createdAt?: string
}

export interface CreateCountryPayload {
  countryArName: string
  countryEnName: string
  code: string
  isActive?: boolean
}

export interface UpdateCountryPayload {
  countryArName: string
  countryEnName: string
  code: string
  isActive?: boolean
}

export interface GetCountriesPaginatedParams {
  search?: string
  searchTerm?: string
  isActive?: boolean
  pageNumber?: number
  pageSize?: number
}
