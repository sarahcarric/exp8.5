//User object errors
export class UserNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UserNotFoundError';
  }
}

export class UserPasswordInvalidError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UserPasswordInvalid';
  }
}

//Round object errors
export class RoundNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RoundNotFoundError';
  }
}

export class RoundObjectInvalidError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RoundObjectInvalidError';
  }
}