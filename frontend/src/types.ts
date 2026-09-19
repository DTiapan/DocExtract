export interface PageResponse {
  id: string;
  page_number: number;
  image_url: string;
  width: number;
  height: number;
}

export interface FieldResponse {
  id: string;
  field_name: string;
  page_number: number;
  extracted_value: string | null;
  normalized_value: string | null;
  confidence_score: number;
  bbox_x_min: number;
  bbox_y_min: number;
  bbox_x_max: number;
  bbox_y_max: number;
  status: 'VALID' | 'WARNING' | 'MANUAL_OVERRIDE';
  warning_message?: string | null;
}

export interface ExtractionResponse {
  id: string;
  document_id: string;
  schema_type: string;
  overall_confidence: number;
  status: 'AUTO_APPROVED' | 'NEEDS_REVIEW' | 'HUMAN_APPROVED' | 'REJECTED';
  retry_count: number;
  model_version: string;
  validation_errors?: string[] | null;
  fields: FieldResponse[];
  created_at: string;
  updated_at: string;
}

export interface DocumentResponse {
  id: string;
  filename: string;
  page_count: number;
  status: 'PENDING' | 'PARSING' | 'PARSED' | 'NEEDS_REVIEW' | 'APPROVED' | 'REJECTED' | 'FAILED';
  created_at: string;
  pages: PageResponse[];
  latest_extraction?: ExtractionResponse | null;
}

export interface AuditLogResponse {
  id: string;
  action: string;
  field_name?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  operator: string;
  details?: any;
  created_at: string;
}
