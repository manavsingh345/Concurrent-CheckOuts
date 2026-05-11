export class AppError extends Error {
  status: number;
  code: string;

  constructor(status: number, message: string, code = "APP_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
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

  const message =
    error instanceof Error ? error.message : "An unexpected error occurred.";

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
