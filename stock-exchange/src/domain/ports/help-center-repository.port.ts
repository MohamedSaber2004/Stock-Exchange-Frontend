import type {
  HelpCenterCategoryDto,
  CreateHelpCenterCategoryPayload,
  UpdateHelpCenterCategoryPayload,
  HelpCenterDto,
  CreateHelpCenterPayload,
  UpdateHelpCenterPayload,
  GetHelpCenterParams
} from '../models/help-center.model'

export interface IHelpCenterRepository {
  // Categories
  getCategories(applyLanguageFilter?: boolean): Promise<HelpCenterCategoryDto[]>
  getCategoryById(id: string, applyLanguageFilter?: boolean): Promise<HelpCenterCategoryDto>
  createCategory(payload: CreateHelpCenterCategoryPayload): Promise<HelpCenterCategoryDto>
  updateCategory(id: string, payload: UpdateHelpCenterCategoryPayload): Promise<HelpCenterCategoryDto>
  deleteCategory(id: string): Promise<boolean>

  // FAQ Items
  getAll(params?: GetHelpCenterParams): Promise<HelpCenterDto[]>
  getById(id: string, applyLanguageFilter?: boolean): Promise<HelpCenterDto>
  create(payload: CreateHelpCenterPayload): Promise<HelpCenterDto>
  update(id: string, payload: UpdateHelpCenterPayload): Promise<HelpCenterDto>
  delete(id: string): Promise<boolean>
}
