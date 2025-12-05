import { MapOptions, RunResponse, MapRunDataResponse, ApiResponse } from '../types';
import { IExecuteFunctions, IHttpRequestOptions, sleep } from 'n8n-workflow';
import { BaseService } from './baseService.js';

/**
 * AI-Map Service
 * Handles all AI-Map related API calls
 */
export class AiMapService extends BaseService {
	constructor(n8n: IExecuteFunctions, apiUrl: string) {
		super(n8n, apiUrl);
	}

	/**
	 * Submit map request (POST /map)
	 */
	async submitMapRequest(options: MapOptions): Promise<RunResponse> {
		const payload: Record<string, any> = {
			url: options.url,
		};

		if (options.user_prompt !== undefined) {
			payload.user_prompt = options.user_prompt;
		}
		if (options.search_keywords !== undefined && options.search_keywords.length > 0) {
			payload.search_keywords = options.search_keywords;
		}
		if (options.max_crawl_depth !== undefined) {
			payload.max_crawl_depth = options.max_crawl_depth;
		}
		if (options.limit !== undefined) {
			payload.limit = options.limit;
		}
		if (options.geo_location !== undefined) {
			payload.geo_location = options.geo_location;
		}
		if (options.render_javascript !== undefined) {
			payload.render_javascript = options.render_javascript;
		}
		if (options.include_sitemap !== undefined) {
			payload.include_sitemap = options.include_sitemap;
		}
		if (options.max_credits !== undefined) {
			payload.max_credits = options.max_credits;
		}
		if (options.allow_subdomains !== undefined) {
			payload.allow_subdomains = options.allow_subdomains;
		}
		if (options.allow_external_domains !== undefined) {
			payload.allow_external_domains = options.allow_external_domains;
		}

		const requestOptions: IHttpRequestOptions = {
			method: 'POST',
			url: `${this.apiUrl}/map`,
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
	 * Get map run data/results (GET /map/run/data)
	 */
	async getMapRunData(runId: string): Promise<MapRunDataResponse> {
		if (!runId) {
			throw new Error('run_id is required');
		}
		const requestOptions: IHttpRequestOptions = {
			method: 'GET',
			url: `${this.apiUrl}/map/run/data`,
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
	 * Synchronous mapping (wait for results)
	 */
	async map(
		options: MapOptions,
		timeout = 600000, // 10 minutes
		pollInterval = 5000,
	): Promise<ApiResponse<any | null>> {
		const submitResult = await this.submitMapRequest(options);
		const runId = submitResult.run_id || submitResult.id;
		if (!runId) {
			throw new Error('No run ID returned from map request');
		}

		const startTime = Date.now();

		while (Date.now() - startTime < timeout) {
			try {
				const response = await this.getMapRunData(runId);

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
					};
				}

				await sleep(pollInterval);
			} catch (error: any) {
				// 429 and 5xx are already handled by makeRequestWithRetry
				// If we get here, it's a non-retryable error, so throw immediately
				throw error;
			}
		}

		throw new Error(`Mapping timeout after ${timeout}ms`);
	}
}
