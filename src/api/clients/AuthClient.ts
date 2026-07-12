import { APIRequestContext, APIResponse } from '@playwright/test';
import { API, BASE_URL } from '../../utils/constants';

export interface AuthResponse {
  token: string;
  [key: string]: unknown;
}

export class AuthClient {
  constructor(private readonly request: APIRequestContext) {}

  // Authenticates with the Control Room and returns the raw API response.
  async authenticate(username: string, password: string): Promise<APIResponse> {
    const response = await this.request.post(`${BASE_URL}${API.AUTH}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        username,
        password,
        multipleLogin: false,   
      },
    });
    return response;
  }

  
  async getToken(username: string, password: string): Promise<string> {
    const response = await this.authenticate(username, password);

    if (!response.ok()) {
      const body = await response.text();
      throw new Error(`Authentication failed [${response.status()}]: ${body}`);
    }

    const body = (await response.json()) as AuthResponse;
    const token = body.token;

    if (!token || typeof token !== 'string') {
      throw new Error(`Authentication succeeded but token not found in response: ${JSON.stringify(body)}`);
    }

    return token;
  }
}
