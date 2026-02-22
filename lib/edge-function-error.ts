export class EdgeFunctionError extends Error {
  code: string | null;

  constructor(message: string, code: string | null = null) {
    super(message);
    this.name = 'EdgeFunctionError';
    this.code = code;
  }
}
