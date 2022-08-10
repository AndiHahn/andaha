export interface ProblemDetails {
  detail: string;
  status: number;
  title: string;
  type: string;
  errors: Record<string, Partial<string[]>>
}
