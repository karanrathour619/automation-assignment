import { APIRequestContext, APIResponse } from '@playwright/test';
import { API, BASE_URL } from '../../utils/constants';

export interface FolderItem {
  id:   string;
  name: string;
  type: string;
  [key: string]: unknown;
}

export interface FolderListResponse {
  list:       FolderItem[];
  totalCount: number;
  [key: string]: unknown;
}

export class FolderClient {
  constructor(private readonly request: APIRequestContext) {}

  // Fetches the list of repository folders. Returns the raw response.
  async listFolders(token: string): Promise<APIResponse> {
    const response = await this.request.get(`${BASE_URL}${API.FOLDERS}`, {
      headers: {
        'X-Authorization': token,
        'Content-Type':    'application/json',
      },
    });
    return response;
  }

  // Fetches folders with a filter for the private workspace.
  async getPrivateWorkspaceFolders(token: string): Promise<APIResponse> {
    const filter = encodeURIComponent(
      JSON.stringify({ fields: [{ field: 'type', value: 'PRIVATE' }] })
    );
    const response = await this.request.get(
      `${BASE_URL}${API.FOLDERS}?filter=${filter}`,
      {
        headers: {
          'X-Authorization': token,
          'Content-Type':    'application/json',
        },
      }
    );
    return response;
  }

    async getPrivateWorkspaceFolderId(token: string): Promise<string> {
    const response = await this.getPrivateWorkspaceFolders(token);

    if (!response.ok()) {
      const body = await response.text();
      throw new Error(`Failed to list folders [${response.status()}]: ${body}`);
    }

    const body = (await response.json()) as FolderListResponse;
    const folders = body.list ?? [];

    if (folders.length === 0) {
      throw new Error('No private workspace folders found. Check folder filter query.');
    }

    const privateFolder = folders.find((f) =>
      (f.type ?? '').toLowerCase().includes('private') ||
      (f.name ?? '').toLowerCase().includes('private')
    ) ?? folders[0];

    if (!privateFolder.id) {
      throw new Error(`Private folder found but has no id: ${JSON.stringify(privateFolder)}`);
    }

    return String(privateFolder.id);
  }
}
