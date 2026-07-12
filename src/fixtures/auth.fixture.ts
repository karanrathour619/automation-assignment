import { test as base, request as playwrightRequest } from '@playwright/test';
import { AuthClient } from '../api/clients/AuthClient';
import { getCredentials } from '../utils/testData';

/**
 * Reusable session-scoped auth fixture.
 * Authenticates once per worker and reuses the token across API tests.
 */

type AuthFixtures = {
  authToken: string;
};

export const test = base.extend<AuthFixtures>({
  authToken: async ({}, use) => {
    // Create an isolated request context
    const context = await playwrightRequest.newContext();
    const authClient = new AuthClient(context);
    const { username, password } = getCredentials();

    const token = await authClient.getToken(username, password);

    await use(token);

    await context.dispose();
  },
});

export { expect } from '@playwright/test';
