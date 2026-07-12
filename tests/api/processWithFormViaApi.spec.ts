import { test, expect, request as playwrightRequest } from '@playwright/test';
import * as dotenv from 'dotenv';

import { AuthClient }       from '../../src/api/clients/AuthClient';
import { FolderClient }     from '../../src/api/clients/FolderClient';
import { FormFileClient }   from '../../src/api/clients/FormFileClient';
import { ProcessFileClient } from '../../src/api/clients/ProcessFileClient';
import { getCredentials, formApiName, processName } from '../../src/utils/testData';

dotenv.config();

/**
 * Use Case 2: Create a Process with a Form via API.
 * Tests run serially because each step depends on resources created earlier.
 */

test.describe.serial('UC2 — Create Process with Form via API', () => {

  const apiCtx = {
    token:      '',
    folderId:   '',
    formFileId: '',
    processId:  '',
    formName:   formApiName(),
    processName: processName(),
  };

  let apiRequest: Awaited<ReturnType<typeof playwrightRequest.newContext>>;

  test.beforeAll(async () => {
    apiRequest = await playwrightRequest.newContext({
      ignoreHTTPSErrors: true,
    });
  });

  test.afterAll(async () => {
    await apiRequest.dispose();
  });

  test(
    'UC2-T1: should authenticate via API and return a valid token',
    { tag: '@UC2-API' },
    async () => {
      const authClient = new AuthClient(apiRequest);
      const { username, password } = getCredentials();

      const response = await authClient.authenticate(username, password);
      const body     = await response.json();

      expect(response.status(), 'Auth endpoint should return 200').toBe(200);

      expect(body.token, 'Auth response should contain a token field').toBeDefined();
      expect(typeof body.token, 'Token should be a string').toBe('string');
      expect((body.token as string).length, 'Token should not be empty').toBeGreaterThan(0);

      apiCtx.token = body.token as string;
    }
  );

  test(
    'UC2-T2: should retrieve the private workspace folder ID',
    { tag: '@UC2-API' },
    async () => {
      expect(apiCtx.token, 'Token must be set from UC2-T1').not.toBe('');

      const folderClient = new FolderClient(apiRequest);
      const response     = await folderClient.getPrivateWorkspaceFolders(apiCtx.token);
      const body         = await response.json();

      expect(response.status(), 'Folders endpoint should return 200').toBe(200);

      expect(Array.isArray(body.list), 'Response should have a "list" array').toBe(true);
      expect((body.list as unknown[]).length, 'Folder list should contain at least one entry').toBeGreaterThan(0);

      const firstFolder = (body.list as Array<{ id: unknown }>)[0];
      expect(firstFolder.id, 'Folder should have an id field').toBeDefined();

      apiCtx.folderId = String(firstFolder.id);
      expect(apiCtx.folderId.length, 'Folder ID should not be empty').toBeGreaterThan(0);
    }
  );

  test(
    'UC2-T3: should create a Form file in the private workspace',
    { tag: '@UC2-API' },
    async () => {
      expect(apiCtx.token,    'Token must be set from UC2-T1').not.toBe('');
      expect(apiCtx.folderId, 'Folder ID must be set from UC2-T2').not.toBe('');

      const formClient = new FormFileClient(apiRequest);
      const response   = await formClient.createFormFile(
        apiCtx.token,
        apiCtx.folderId,
        apiCtx.formName
      );
      const body = await response.json();

      expect(
        [200, 201],
        `Form file creation should return 200 or 201, got ${response.status()}`
      ).toContain(response.status());

      expect(body.id, 'Form creation response should contain an id').toBeDefined();
      expect(typeof body.id, 'Form id should be a string or number').toMatch(/string|number/);
      expect(String(body.id).length, 'Form id should not be empty').toBeGreaterThan(0);

      apiCtx.formFileId = String(body.id);
    }
  );

  test(
    'UC2-T4: should save form content with TextBox, TextArea, and Number fields',
    { tag: '@UC2-API' },
    async () => {
      expect(apiCtx.token,      'Token must be set').not.toBe('');
      expect(apiCtx.formFileId, 'Form file ID must be set from UC2-T3').not.toBe('');

      const formClient = new FormFileClient(apiRequest);
      const response   = await formClient.saveFormContent(apiCtx.token, apiCtx.formFileId);

      expect(
        response.status(),
        `Form content save should return 200, got ${response.status()}`
      ).toBe(200);

      const body = await response.json().catch(() => ({}));

      const bodyStr = JSON.stringify(body);
      expect(
        bodyStr.length,
        'Form content save response body should not be empty'
      ).toBeGreaterThan(0);
    }
  );

  test(
    'UC2-T5: should save form file dependencies successfully',
    { tag: '@UC2-API' },
    async () => {
      expect(apiCtx.token,      'Token must be set').not.toBe('');
      expect(apiCtx.formFileId, 'Form file ID must be set from UC2-T3').not.toBe('');

      const formClient = new FormFileClient(apiRequest);
      const response   = await formClient.saveFormDependencies(apiCtx.token, apiCtx.formFileId);

      expect(
        response.status(),
        `Form dependencies save should return 200, got ${response.status()}`
      ).toBe(200);
    }
  );

  test(
    'UC2-T6: should create a Process file in the private workspace',
    { tag: '@UC2-API' },
    async () => {
      expect(apiCtx.token,    'Token must be set').not.toBe('');
      expect(apiCtx.folderId, 'Folder ID must be set').not.toBe('');

      const processClient = new ProcessFileClient(apiRequest);
      const response      = await processClient.createProcessFile(
        apiCtx.token,
        apiCtx.folderId,
        apiCtx.processName
      );
      const body = await response.json();

      expect(
        [200, 201],
        `Process file creation should return 200 or 201, got ${response.status()}`
      ).toContain(response.status());

      expect(body.id, 'Process creation response should contain an id').toBeDefined();
      expect(String(body.id).length, 'Process id should not be empty').toBeGreaterThan(0);

      apiCtx.processId = String(body.id);
    }
  );

  test(
    'UC2-T7: should save process content with 3-node workflow (InitialStep → FormStep → exit)',
    { tag: '@UC2-API' },
    async () => {
      expect(apiCtx.token,      'Token must be set').not.toBe('');
      expect(apiCtx.processId,  'Process ID must be set from UC2-T6').not.toBe('');
      expect(apiCtx.formFileId, 'Form file ID must be set from UC2-T3').not.toBe('');

      const processClient = new ProcessFileClient(apiRequest);
      const response      = await processClient.saveProcessContent(
        apiCtx.token,
        apiCtx.processId,
        apiCtx.formFileId
      );

      expect(
        response.status(),
        `Process content save should return 200, got ${response.status()}`
      ).toBe(200);

      const body = await response.json().catch(() => ({}));
      const bodyStr = JSON.stringify(body);

      expect(
        bodyStr.length,
        'Process content save response body should not be empty'
      ).toBeGreaterThan(0);

      expect(
        bodyStr,
        `Process content response should reference the form file ID (${apiCtx.formFileId})`
      ).toContain(apiCtx.formFileId);
    }
  );

  test(
    'UC2-T8: should save process dependencies linking the form file',
    { tag: '@UC2-API' },
    async () => {
      expect(apiCtx.token,      'Token must be set').not.toBe('');
      expect(apiCtx.processId,  'Process ID must be set from UC2-T6').not.toBe('');
      expect(apiCtx.formFileId, 'Form file ID must be set from UC2-T3').not.toBe('');

      const processClient = new ProcessFileClient(apiRequest);
      const response      = await processClient.saveProcessDependencies(
        apiCtx.token,
        apiCtx.processId,
        apiCtx.formFileId
      );

      expect(
        response.status(),
        `Process dependencies save should return 200, got ${response.status()}`
      ).toBe(200);
    }
  );
});
