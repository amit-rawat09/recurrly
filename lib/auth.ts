export function validateEmail(value: string): string | undefined {
  const email = value.trim();
  if (!email) return "Enter your email address.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Enter a valid email address.";
  }
  return undefined;
}

export function getAuthErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const candidate = error as {
      errors?: Array<{ longMessage?: string; message?: string }>;
      message?: string;
    };
    const detail = candidate.errors?.find((item) => item.longMessage || item.message);
    if (detail?.longMessage || detail?.message) return detail.longMessage ?? detail.message!;
    if (candidate.message && !/network request failed/i.test(candidate.message)) {
      return candidate.message;
    }
  }
  return "We couldn’t complete that request. Check your connection and try again.";
}
