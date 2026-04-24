export class SmartBIError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends SmartBIError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class ParseError extends SmartBIError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class DataFetchError extends SmartBIError {
  constructor(message: string) {
    super(message, 502);
  }
}

export class RenderError extends SmartBIError {
  constructor(message: string) {
    super(message, 500);
  }
}
