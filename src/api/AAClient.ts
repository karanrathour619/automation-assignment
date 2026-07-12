import { APIRequestContext, expect } from '@playwright/test';
import { API, BASE_URL } from '../utils/constants';

export class AAClient {
  private request: APIRequestContext;
  private token: string = '';
  public privateWorkspaceId: string = '';

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  /**
   * Authenticate and store the auth token.
   */
  async authenticate(username: string, apiKey: string): Promise<void> {
    const response = await this.request.post(`${BASE_URL}${API.AUTH}`, {
      data: {
        username,
        password: apiKey 
      }
    });
    
    expect(response.ok(), `Authentication failed: ${response.status()}`).toBeTruthy();
    const data = await response.json();
    this.token = data.token;
  }

  private getHeaders() {
    return {
      'X-Authorization': this.token,
      'Content-Type': 'application/json'
    };
  }

  async getPrivateWorkspaceId(): Promise<string> {
    // Hardcoded from previous API
    this.privateWorkspaceId = '32989098';
    return this.privateWorkspaceId;
  }

  async createFile(name: string, contentType: string, parentFolderId: string): Promise<string> {
    const response = await this.request.post(`${BASE_URL}${API.FILES}`, {
      headers: this.getHeaders(),
      data: {
        name,
        parentFolderId,
        contentType
      }
    });

    expect(response.ok(), `Failed to create file: ${response.status()}`).toBeTruthy();
    const data = await response.json();
    return data.id;
  }

  async saveFileContent(fileId: string, contentData: any): Promise<void> {
    const response = await this.request.put(`${BASE_URL}${API.FILE_CONTENT(fileId)}?hasErrors=false`, {
      headers: this.getHeaders(),
      data: contentData
    });

    expect(response.ok(), `Failed to save content: ${response.status()}`).toBeTruthy();
  }

  async saveFileDependencies(fileId: string, dependencies: any): Promise<void> {
    const response = await this.request.put(`${BASE_URL}${API.FILE_DEPENDENCIES(fileId)}`, {
      headers: this.getHeaders(),
      data: dependencies
    });

    expect(response.ok(), `Failed to save dependencies: ${response.status()}`).toBeTruthy();
  }
}
