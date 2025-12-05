export interface ReviewResponse {
  markdown: string;
  sources: Array<{
    title: string;
    uri: string;
  }>;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface AnalysisError {
  message: string;
}
