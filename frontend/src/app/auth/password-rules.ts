// Spiegelt die Server-Regeln (`minimum_password_length = 8`,
// `password_requirements = "letters_digits"`) für die Live-Anzeige (FR-003, research R6).
export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_RULES_TEXT = 'mindestens 8 Zeichen, mindestens ein Buchstabe und eine Ziffer';

export interface PasswordRuleState {
  minLength: boolean;
  hasLetter: boolean;
  hasDigit: boolean;
}

export function checkPasswordRules(password: string): PasswordRuleState {
  return {
    minLength: password.length >= PASSWORD_MIN_LENGTH,
    // Supabase zählt für `letters_digits` nur a–z und A–Z; Umlaute erfüllen die Regel nicht.
    hasLetter: /[A-Za-z]/.test(password),
    hasDigit: /\d/.test(password),
  };
}

export function isPasswordValid(password: string): boolean {
  const rules = checkPasswordRules(password);
  return rules.minLength && rules.hasLetter && rules.hasDigit;
}
