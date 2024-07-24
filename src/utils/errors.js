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

export class UserAlreadyVerfiedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UserAlreadyVerifiedError';
  }
}

export class UserPasswordResetCodeInvalidError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UserPasswordResetCodeInvalidError';
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

export class ObjectIdInvalidError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ObjectIdInvalidError';
  }
}

export class MfaSessionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MfaSessionError';
  }
}