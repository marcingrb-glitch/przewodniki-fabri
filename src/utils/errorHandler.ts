export function getUserFriendlyError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const msg = raw.toLowerCase();

  if (msg.includes("duplicate key") || msg.includes("unique constraint")) {
    return "Ta wartość już istnieje w systemie";
  }
  if (msg.includes("foreign key")) {
    return "Nie można wykonać operacji — powiązane dane";
  }
  if (msg.includes("violates row-level security") || msg.includes("row-level security")) {
    return "Brak uprawnień do wykonania tej operacji";
  }
  if (msg.includes("invalid input syntax")) {
    return "Nieprawidłowy format danych";
  }
  if (msg.includes("invalid login")) {
    return "Nieprawidłowy email lub hasło";
  }
  if (msg.includes("already registered") || msg.includes("already been registered")) {
    return "Ten email jest już zarejestrowany";
  }
  if (msg.includes("email not confirmed")) {
    return "Email nie został jeszcze potwierdzony";
  }

  // Log full error for debugging (stays in browser console only)
  console.error("[App] Unmapped error:", raw);

  return "Wystąpił błąd. Spróbuj ponownie lub skontaktuj się z administratorem";
}
