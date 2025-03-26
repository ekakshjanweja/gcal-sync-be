export interface ApiResponse<T = "unknown"> {
  data: T;
  status: STATUS;
}

export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    data,
    status: STATUS.SUCCESS,
  };
}

export function errorResponse({
  error,
  message,
}: {
  error: ERROR_TYPE;
  message?: string;
}): ApiResponse<{
  error: string;
  message: string;
}> {
  return {
    data: {
      error: getErrorTypeId(error),
      message: getErrorTypeMessage(error, message),
    },
    status: STATUS.ERROR,
  };
}

export enum STATUS {
  SUCCESS = "success",
  ERROR = "error",
}

export enum ERROR_TYPE {
  UNAUTHORIZED,
  USER_ALREADY_EXISTS,
  UNKNOWN_ERROR,
  USER_NOT_FOUND,
  INVALID_REQUEST,
  INTERNAL_SERVER_ERROR,
  ROOM_ALREADY_EXISTS,
  AUTH_HEADER_NOT_FOUND,
  NOT_FOUND,
}

export function getErrorTypeId(errorType: ERROR_TYPE): string {
  switch (errorType) {
    case ERROR_TYPE.UNAUTHORIZED:
      return "UNAUTHORIZED";
    case ERROR_TYPE.USER_ALREADY_EXISTS:
      return "USER_ALREADY_EXISTS";
    case ERROR_TYPE.UNKNOWN_ERROR:
      return "UNKNOWN_ERROR";
    case ERROR_TYPE.USER_NOT_FOUND:
      return "USER_NOT_FOUND";
    case ERROR_TYPE.INVALID_REQUEST:
      return "INVALID_REQUEST";
    case ERROR_TYPE.INTERNAL_SERVER_ERROR:
      return "INTERNAL_SERVER_ERROR";
    case ERROR_TYPE.ROOM_ALREADY_EXISTS:
      return "ROOM_ALREADY_EXISTS";
    case ERROR_TYPE.AUTH_HEADER_NOT_FOUND:
      return "AUTH_HEADER_NOT_FOUND";
    case ERROR_TYPE.NOT_FOUND:
      return "NOT_FOUND";
  }
}

export function getErrorTypeMessage(
  errorType: ERROR_TYPE,
  message?: string
): string {
  if (message) {
    return message;
  }

  switch (errorType) {
    case ERROR_TYPE.UNAUTHORIZED:
      return "Unauthorized";
    case ERROR_TYPE.USER_ALREADY_EXISTS:
      return "User already exists";
    case ERROR_TYPE.UNKNOWN_ERROR:
      return "Unknown error";
    case ERROR_TYPE.USER_NOT_FOUND:
      return "User not found";
    case ERROR_TYPE.INVALID_REQUEST:
      return "Invalid request";
    case ERROR_TYPE.INTERNAL_SERVER_ERROR:
      return "Internal server error";
    case ERROR_TYPE.ROOM_ALREADY_EXISTS:
      return "Room already exists";
    case ERROR_TYPE.AUTH_HEADER_NOT_FOUND:
      return "Authorization header not found";
    case ERROR_TYPE.NOT_FOUND:
      return "Not found";
  }
}
