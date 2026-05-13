export class AppError extends Error {
  status: number;
  code: string;

  constructor(status: number, message: string, code = "APP_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function getNestedMessage(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  if ("message" in value && typeof value.message === "string" && value.message) {
    return value.message;
  }

  if ("description" in value && typeof value.description === "string" && value.description) {
    return value.description;
  }

  if ("error" in value && typeof value.error === "object") {
    return getNestedMessage(value.error);
  }

  return null;
}

export function jsonError(error: unknown) {
  if (error instanceof AppError) {
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.status },
    );
  }

  const message = error instanceof Error
    ? error.message
    : getNestedMessage(error) ?? "An unexpected error occurred.";

  return Response.json(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message,
      },
    },
    { status: 500 },
  );
}
