import { checkPasswordRules, isPasswordValid } from '../services/auth/password-rules';

describe('checkPasswordRules', () => {
  it('reports every rule as failed for an empty password', () => {
    expect(checkPasswordRules('')).toEqual({ minLength: false, hasLetter: false, hasDigit: false });
  });

  it('checks the minimum length of 8 characters', () => {
    expect(checkPasswordRules('abc1234').minLength).toBe(false);
    expect(checkPasswordRules('abcd1234').minLength).toBe(true);
  });

  it('detects ASCII letters like the Supabase rule letters_digits', () => {
    expect(checkPasswordRules('12345678').hasLetter).toBe(false);
    expect(checkPasswordRules('1234567a').hasLetter).toBe(true);
    expect(checkPasswordRules('1234567Z').hasLetter).toBe(true);
    expect(checkPasswordRules('1234567ä').hasLetter).toBe(false);
  });

  it('detects digits', () => {
    expect(checkPasswordRules('abcdefgh').hasDigit).toBe(false);
    expect(checkPasswordRules('abcdefg9').hasDigit).toBe(true);
  });
});

describe('isPasswordValid', () => {
  it.each([
    ['abcd1234', true],
    ['Passwort1', true],
    ['abc123', false],
    ['abcdefgh', false],
    ['12345678', false],
    ['        ', false],
  ])('%s → %s', (password, expected) => {
    expect(isPasswordValid(password)).toBe(expected);
  });
});
