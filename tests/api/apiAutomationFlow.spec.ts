import { test, expect, request } from '@playwright/test';
import { AAClient } from '../../src/api/AAClient';
import { getCredentials, formName } from '../../src/utils/testData';
import { CONTENT_TYPE } from '../../src/utils/constants';

test.describe.configure({ mode: 'serial' });

test.describe('API Automation - Process Creation Flow', () => {
  let apiClient: AAClient;
  let formId: string;
  let processId: string;
  
  test.beforeAll(async () => {
    const apiContext = await request.newContext();
    apiClient = new AAClient(apiContext);
  });

  test('should authenticate user and retrieve private workspace ID', async () => {
    const { username, password } = getCredentials();
    
    await apiClient.authenticate(username, password);
    expect(apiClient['token']).toBeTruthy();

    const workspaceId = await apiClient.getPrivateWorkspaceId();
    expect(workspaceId).toBeTruthy();
  });

  test('should successfully create a new form file', async () => {
    const name = `API_Form_${Date.now()}`;
    formId = await apiClient.createFile(name, CONTENT_TYPE.FORM, apiClient.privateWorkspaceId);
    expect(formId).toBeTruthy();
  });

  test('should save form content and its dependencies', async () => {
    const formContent = {
      form: {
        properties: { title: "API Form" },
        rows: [
          {
            columns: [
              { type: "TextBox", fieldType: "TextBox", id: "TextBox0", label: "TextBox" },
              { type: "TextArea", fieldType: "TextArea", id: "TextArea0", label: "TextArea" },
              { type: "Number", fieldType: "Number", id: "Number0", label: "Number" }
            ]
          }
        ]
      }
    };
    
    await apiClient.saveFileContent(formId, formContent);

    const formDependencies = { childFileIds: [] };
    await apiClient.saveFileDependencies(formId, formDependencies);
  });

  test('should successfully create a new process file', async () => {
    const name = `API_Process_${Date.now()}`;
    processId = await apiClient.createFile(name, CONTENT_TYPE.WORKFLOW, apiClient.privateWorkspaceId);
    expect(processId).toBeTruthy();
  });

  test('should save process content and link the form dependency', async () => {
    const processContent = {
      nodes: [
        { id: "InitialStep", type: "start" },
        { id: "FormStep", type: "formTask", formId: formId },
        { id: "ExitStep", type: "end" }
      ],
      edges: [
        { source: "InitialStep", target: "FormStep" },
        { source: "FormStep", target: "ExitStep" }
      ]
    };

    await apiClient.saveFileContent(processId, processContent);

    const processDependencies = { childFileIds: [Number(formId)] };
    await apiClient.saveFileDependencies(processId, processDependencies);
  });
});
