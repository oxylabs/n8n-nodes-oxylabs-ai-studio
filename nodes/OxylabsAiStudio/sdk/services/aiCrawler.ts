import { CrawlOptions, RunResponse, ApiResponse } from '../types.js';

import { IExecuteFunctions, IHttpRequestOptions, sleep } from 'n8n-workflow';
import { BaseService } from './baseService.js';

/**
 * AI-Crawler Service
 * Handles all AI-Crawler related API calls
 */
export class AiCrawlerService extends BaseService {
	constructor(n8n: IExecuteFunctions, apiUrl: string) {
		super(n8n, apiUrl);
	}

	/**
	 * Submit crawling request (POST /extract/run)
	 */
	async submitCrawlRequest(options: CrawlOptions): Promise<RunResponse> {
		const payload: any = {
			domain: options.url, // Note: API expects 'domain' but we use 'url' for consistency
			output_format: options.output_format || 'markdown',
			auxiliary_prompt: options.crawl_prompt,
			render_html: options.render_html || false,
			return_sources_limit: options.max_pages || 25,
		};
		if (options.output_format === 'json' && options.openapi_schema) {
			payload.openapi_schema = options.openapi_schema;
		}
		const requestOptions: IHttpRequestOptions = {
			method: 'POST',
			url: `${this.apiUrl}/extract/run`,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			body: payload,
			json: true,
		};
		return await this.makeRequestWithRetry(requestOptions);
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
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			qs: { run_id: runId },
			json: true,
		};
		return await this.makeRequestWithRetry(requestOptions);
	}

	/**
	 * Synchronous crawling (wait for results)
	 */
	async crawl(
		options: CrawlOptions,
		timeout = 600000, // 10 minutes (matching Python CRAWLER_TIMEOUT_SECONDS)
		pollInterval = 5000,
	): Promise<ApiResponse<Record<string, any>[] | null>> {
		const submitResult = await this.submitCrawlRequest(options);
		const runId = submitResult.run_id || submitResult.id;
		if (!runId) {
			throw new Error('No run ID returned from crawl request');
		}

		const startTime = Date.now();
		
		while (Date.now() - startTime < timeout) {
			try {
				const response = await this.getCrawlRunData(runId);

				// Check status in response body
				if (response.status === 'processing') {
					await sleep(pollInterval);
					continue;
				}

				if (response.status === 'completed') {
					return {
						status: response.status,
						message: response.error_code || undefined,
						data: response.data || null,
					};
				}

				if (response.status === 'failed') {
					return {
						status: response.status,
						message: response.error_code || undefined,
						data: null,
					}
				}

			await sleep(pollInterval);
		} catch (error: any) {
			// 429 and 5xx are already handled by makeRequestWithRetry
			// If we get here, it's a non-retryable error, so throw immediately
			throw error;
		}
	}

		throw new Error(`Crawling timeout after ${timeout}ms`);
	}
}
