import { APIRequestContext, APIResponse } from '@playwright/test';
import { API, BASE_URL, CONTENT_TYPE } from '../../utils/constants';
import {
  buildProcessContent,
  buildProcessDependencies,
} from '../payloads/processPayloads';

export interface FileCreateResponse {
  id:   string;
  name: string;
  [key: string]: unknown;
}

export class ProcessFileClient {
  constructor(private readonly request: APIRequestContext) {}

  // Creates a new Process file in the specified folder.
  async createProcessFile(
    token:    string,
    folderId: string,
    name:     string
  ): Promise<APIResponse> {
    const response = await this.request.post(`${BASE_URL}${API.FILES}`, {
      headers: {
        'X-Authorization': token,
        'Content-Type':    'application/json',
      },
      data: {
        name,
        parentId:    folderId,
        contentType: CONTENT_TYPE.WORKFLOW,
      },
    });
    return response;
  }

    async createProcessFileAndGetId(
    token:    string,
    folderId: string,
    name:     string
  ): Promise<string> {
    const response = await this.createProcessFile(token, folderId, name);
    if (!response.ok()) {
      const body = await response.text();
      throw new Error(`Process file creation failed [${response.status()}]: ${body}`);
    }
    const body = (await response.json()) as FileCreateResponse;
    if (!body.id) {
      throw new Error(`Process file created but id missing: ${JSON.stringify(body)}`);
    }
    return String(body.id);
  }

  // Saves the process content with a 3-node workflow:
  async saveProcessContent(
    token:      string,
    processId:  string,
    formFileId: string
  ): Promise<APIResponse> {
    const response = await this.request.put(
      `${BASE_URL}${API.FILE_CONTENT(processId)}`,
      {
        headers: {
          'X-Authorization': token,
          'Content-Type':    'application/json',
        },
        data: buildProcessContent(processId, formFileId),
      }
    );
    return response;
  }

  // Links the form file as a dependency of the process file.
  async saveProcessDependencies(
    token:      string,
    processId:  string,
    formFileId: string
  ): Promise<APIResponse> {
    const response = await this.request.post(
      `${BASE_URL}${API.FILE_DEPENDENCIES(processId)}`,
      {
        headers: {
          'X-Authorization': token,
          'Content-Type':    'application/json',
        },
        data: buildProcessDependencies(processId, formFileId),
      }
    );
    return response;
  }
}
