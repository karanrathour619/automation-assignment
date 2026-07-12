/**
 * Test data used across the test suite.
 */

export function getTimestamp(): string {
  return Date.now().toString();
}

export function formName(): string {
  return `Form_UC1_${getTimestamp()}`;
}

export function processName(): string {
  return `Process_UC2_${getTimestamp()}`;
}

export function formApiName(): string {
  return `ApiForm_UC2_${getTimestamp()}`;
}

export function getCredentials() {
  const username = process.env.AA_USERNAME;
  const password = process.env.AA_PASSWORD;
  if (!username || !password) {
    throw new Error(
      'AA_USERNAME and AA_PASSWORD must be set in .env\n' +
      'Copy .env.example → .env and fill in your credentials.'
    );
  }
  return { username, password };
}
