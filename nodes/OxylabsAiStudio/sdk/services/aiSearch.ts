import {
  SearchOptions,
  RunResponse,
  SearchRunDataResponse,
	ApiResponse,
	SearchResult,
} from '../types';
import { IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';

declare function setTimeout(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): number;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * AI-Search Service
 * Handles all AI-Search related API calls
 */
export class AiSearchService {
  private n8n: IExecuteFunctions;
  private apiUrl: string;

  constructor(n8n: IExecuteFunctions, apiUrl: string) {
    this.n8n = n8n;
    this.apiUrl = apiUrl;
  }

  /**
   * Submit search request (POST /search/run)
   */
  async submitSearchRequest(options: SearchOptions): Promise<RunResponse> {
    const payload: Record<string, any> = {
      query: options.query,
    };
    if (options.limit !== undefined) {
      payload.limit = options.limit;
    }
    if (options.render_javascript !== undefined) {
      payload.render_html = options.render_javascript;
    }
    if (options.return_content !== undefined) {
      payload.return_content = options.return_content;
    }
    const requestOptions: IHttpRequestOptions = {
      method: 'POST',
      url: `${this.apiUrl}/search/run`,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: payload,
      json: true,
    };
    return await this.n8n.helpers.httpRequestWithAuthentication.call(this.n8n, 'oxylabsAiStudioApi', requestOptions);
  }

  /**
   * Get search run data/results (GET /search/run/data)
   */
  async getSearchRunData(runId: string): Promise<SearchRunDataResponse> {
    if (!runId) {
      throw new Error('run_id is required');
    }
    const requestOptions: IHttpRequestOptions = {
      method: 'GET',
      url: `${this.apiUrl}/search/run/data`,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      qs: { run_id: runId },
      json: true,
    };
    return await this.n8n.helpers.httpRequestWithAuthentication.call(this.n8n, 'oxylabsAiStudioApi', requestOptions);
  }

  /**
   * Synchronous searching (wait for results)
   */
  async search(options: SearchOptions, timeout = 120000, pollInterval = 5000): Promise<ApiResponse<SearchResult[] | null>> {
    const submitResult = await this.submitSearchRequest(options);
    const runId = submitResult.run_id;
    if (!runId) {
      throw new Error('No run ID returned from search request');
    }
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const response = await this.getSearchRunData(runId);
      if (response.status === 'processing') {
        await delay(pollInterval);
        continue;
      } else if (response.status === 'completed') {
        return {
          message: response.message || undefined,
          data: response.data ? response.data : null,
          status: response.status,
        };
      } else if (response.status === 'failed') {
        throw new Error(`Search failed: ${response.message || 'Unknown error'}`);
      } else {
        throw new Error(`Search failed: Unknown status ${response.status}`);
      }
    }
    throw new Error(`Search timeout after ${(timeout / 1000).toFixed(2)} seconds`);
  }
}