import {
  CrawlOptions,
  RunResponse,
  ApiResponse,
} from '../types.js';

import { IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';

declare function setTimeout(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): number;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * AI-Crawler Service
 * Handles all AI-Crawler related API calls
 */
export class AiCrawlerService {
  private n8n: IExecuteFunctions;
  private apiUrl: string;

  constructor(n8n: IExecuteFunctions, apiUrl: string) {
    this.n8n = n8n;
    this.apiUrl = apiUrl;
  }

  /**
   * Submit crawling request (POST /extract/run)
   */
  async submitCrawlRequest(options: CrawlOptions): Promise<RunResponse> {
    const payload: any = {
      domain: options.url, // Note: API expects 'domain' but we use 'url' for consistency
      output_format: options.output_format || "markdown",
      auxiliary_prompt: options.crawl_prompt,
      render_html: options.render_html || false,
      return_sources_limit: options.max_pages || 25
    };
    if (options.output_format === "json" && options.openapi_schema) {
      payload.openapi_schema = options.openapi_schema;
    }
    const requestOptions: IHttpRequestOptions = {
      method: 'POST',
      url: `${this.apiUrl}/extract/run`,
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
   * Get crawling steps (GET /extract/run/steps)
   */
  async getCrawlRunSteps(runId: string): Promise<any> {
    if (!runId) {
      throw new Error('run_id is required');
    }
    const requestOptions: IHttpRequestOptions = {
      method: 'GET',
      url: `${this.apiUrl}/extract/run/steps`,
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
   * Get crawling run data/results (GET /extract/run/data)
   */
  async getCrawlRunData(runId: string): Promise<any> {
    if (!runId) {
      throw new Error('run_id is required');
    }
    const requestOptions: IHttpRequestOptions = {
      method: 'GET',
      url: `${this.apiUrl}/extract/run/data`,
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
   * Synchronous crawling (wait for results)
   */
  async crawl(options: CrawlOptions, timeout = 240000, pollInterval = 5000): Promise<ApiResponse<Record<string, any>[] | null>> {
    const submitResult = await this.submitCrawlRequest(options);
    const runId = submitResult.run_id || submitResult.id;
    if (!runId) {
      throw new Error('No run ID returned from crawl request');
    }
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const runStatus = await this.getCrawlRunSteps(runId);
      const run_status = runStatus.run.status;
      if (run_status === 'completed' || run_status === 'success') {
        return await this.getCrawlRunData(runId);
      } else if (run_status === 'failed' || run_status === 'error') {
        throw new Error(`Crawling failed: ${runStatus.error || runStatus.message || 'Unknown error'}`);
      }
      await delay(pollInterval);
    }
    throw new Error(`Crawling timeout after ${timeout}ms`);
  }
}