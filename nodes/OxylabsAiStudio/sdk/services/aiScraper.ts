import { ScrapeOptions, RunResponse } from '../types.js';
import { IExecuteFunctions, IHttpRequestOptions, sleep } from 'n8n-workflow';
import { BaseService } from './baseService.js';

/**
 * AI-Scraper Service
 * Handles all AI-Scraper related API calls
 */
export class AiScraperService extends BaseService {
	constructor(n8n: IExecuteFunctions, apiUrl: string) {
		super(n8n, apiUrl);
	}

	async submitScrapeRequest(options: ScrapeOptions): Promise<RunResponse> {
		const payload: any = {
			url: options.url,
			output_format: options.output_format || 'markdown',
			render_javascript: options.render_javascript || false,
		};
		if (
			(options.output_format === 'json' ||
				options.output_format === 'csv' ||
				options.output_format === 'toon') &&
			options.openapi_schema
		) {
			payload.openapi_schema = options.openapi_schema;
		}
		const requestOptions: IHttpRequestOptions = {
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			method: 'POST',
			url: `${this.apiUrl}/scrape`,
			body: payload,
			json: true,
		};
		return await this.makeRequestWithRetry(requestOptions);
	}

	/**
	 * Get scraping run data/results (GET /scrape/run/data)
	 */
	async getScrapeRunData(runId: string): Promise<any> {
		if (!runId) {
			throw new Error('run_id is required');
		}
		const requestOptions: IHttpRequestOptions = {
			method: 'GET',
			url: `${this.apiUrl}/scrape/run/data`,
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
	 * Synchronous scraping (wait for results)
	 */
	async scrape(options: ScrapeOptions, timeout = 60000, pollInterval = 5000): Promise<any> {
		const submitResult = await this.submitScrapeRequest(options);
		const runId = submitResult.run_id || submitResult.id;
		if (!runId) {
			throw new Error('No run ID returned from scrape request');
		}
		const startTime = Date.now();
		while (Date.now() - startTime < timeout) {
			const run_data = await this.getScrapeRunData(runId);
			const run_status = run_data.status;
			if (run_status === 'completed') {
				return run_data;
			} else if (run_status === 'failed') {
				return {
					status: run_status,
					message: run_data.error_code || undefined,
					data: null,
				};
			}
			await sleep(pollInterval);
		}
		throw new Error(`Scraping timeout after ${timeout}ms`);
	}
}
