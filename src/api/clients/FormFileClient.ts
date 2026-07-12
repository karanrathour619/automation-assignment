import { APIRequestContext, APIResponse } from '@playwright/test';
import { API, BASE_URL, CONTENT_TYPE } from '../../utils/constants';
import {
  buildFormContent,
  buildFormDependencies,
} from '../payloads/formPayloads';

export interface FileCreateResponse {
  id:   string;
  name: string;
  [key: string]: unknown;
}

export class FormFileClient {
  constructor(private readonly request: APIRequestContext) {}

  // Creates a new Form file in the specified folder.
  async createFormFile(
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
        contentType: CONTENT_TYPE.FORM,
      },
    });
    return response;
  }

    async createFormFileAndGetId(
    token:    string,
    folderId: string,
    name:     string
  ): Promise<string> {
    const response = await this.createFormFile(token, folderId, name);
    if (!response.ok()) {
      const body = await response.text();
      throw new Error(`Form file creation failed [${response.status()}]: ${body}`);
    }
    const body = (await response.json()) as FileCreateResponse;
    if (!body.id) {
      throw new Error(`Form file created but id missing: ${JSON.stringify(body)}`);
    }
    return String(body.id);
  }

  // Saves the form content (TextBox, TextArea, Number fields) to an existing form file.
  async saveFormContent(
    token:  string,
    fileId: string
  ): Promise<APIResponse> {
    const response = await this.request.put(
      `${BASE_URL}${API.FILE_CONTENT(fileId)}`,
      {
        headers: {
          'X-Authorization': token,
          'Content-Type':    'application/json',
        },
        data: buildFormContent(fileId),
      }
    );
    return response;
  }

  // Saves the dependency list for the form file.
  async saveFormDependencies(
    token:  string,
    fileId: string
  ): Promise<APIResponse> {
    const response = await this.request.post(
      `${BASE_URL}${API.FILE_DEPENDENCIES(fileId)}`,
      {
        headers: {
          'X-Authorization': token,
          'Content-Type':    'application/json',
        },
        data: buildFormDependencies(fileId),
      }
    );
    return response;
  }
}
