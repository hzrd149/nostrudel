/** Signers use different error types when the user declines a prompt. */
export function isSignerRejection(error: unknown) {
  return error instanceof Error && /user|reject|denied|cancel/i.test(error.message);
}
