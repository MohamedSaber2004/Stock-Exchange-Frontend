import type { LegalDocumentDto, UpdateLegalDocumentPayload } from '../models/legal-content.model'

export interface ILegalRepository {
  getTerms(applyLanguageFilter?: boolean): Promise<LegalDocumentDto>
  updateTerms(payload: UpdateLegalDocumentPayload): Promise<LegalDocumentDto>
  deleteTerms(id?: string): Promise<boolean>

  getPrivacy(applyLanguageFilter?: boolean): Promise<LegalDocumentDto>
  updatePrivacy(payload: UpdateLegalDocumentPayload): Promise<LegalDocumentDto>
  deletePrivacy(id?: string): Promise<boolean>
}
