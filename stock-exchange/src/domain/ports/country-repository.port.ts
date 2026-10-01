import type {
  CountryDto,
  CreateCountryPayload,
  UpdateCountryPayload,
  GetCountriesPaginatedParams
} from '../models/country.model'
import type { PagginatedResult } from '../models/user.model'

export interface ICountryRepository {
  getAll(): Promise<CountryDto[]>
  getAllPaginated(params?: GetCountriesPaginatedParams): Promise<PagginatedResult<CountryDto>>
  getById(id: string): Promise<CountryDto>
  create(payload: CreateCountryPayload): Promise<CountryDto>
  update(id: string, payload: UpdateCountryPayload): Promise<CountryDto>
  delete(id: string): Promise<boolean>
}
