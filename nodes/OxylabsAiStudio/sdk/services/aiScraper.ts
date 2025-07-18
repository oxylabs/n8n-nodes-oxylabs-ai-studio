import { ScrapeOptions, RunResponse, RunStatusResponse } from '../types.js';
import { IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';

declare function setTimeout(
	handler: (...args: any[]) => void,
	timeout?: number,
	...args: any[]
): number;

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * AI-Scraper Service
 * Handles all AI-Scraper related API calls
 */
export class AiScraperService {
	private n8n: IExecuteFunctions;
	private apiUrl: string;

	constructor(n8n: IExecuteFunctions, apiUrl: string) {
		this.n8n = n8n;
		this.apiUrl = apiUrl;
	}

	async submitScrapeRequest(options: ScrapeOptions): Promise<RunResponse> {
		const payload: any = {
			url: options.url,
			output_format: options.output_format || 'markdown',
			render_html: options.render_html || false,
		};
		if (options.output_format === 'json' && options.openapi_schema) {
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
		return await this.n8n.helpers.httpRequestWithAuthentication.call(
			this.n8n,
			'oxylabsAiStudioApi',
			requestOptions,
		);
	}

	/**
	 * Get scraping run status (GET /scrape/run)
	 */
	async getScrapeRun(runId: string): Promise<RunStatusResponse> {
		if (!runId) {
			throw new Error('run_id is required');
		}
		const requestOptions: IHttpRequestOptions = {
			method: 'GET',
			url: `${this.apiUrl}/scrape/run`,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			qs: { run_id: runId },
			json: true,
		};
		return await this.n8n.helpers.httpRequestWithAuthentication.call(
			this.n8n,
			'oxylabsAiStudioApi',
			requestOptions,
		);
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
		return await this.n8n.helpers.httpRequestWithAuthentication.call(
			this.n8n,
			'oxylabsAiStudioApi',
			requestOptions,
		);
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
			const runStatus = await this.getScrapeRun(runId);
			const run_status = runStatus.status;
			if (run_status === 'completed' || run_status === 'success') {
				return await this.getScrapeRunData(runId);
			} else if (run_status === 'failed' || run_status === 'error') {
				throw new Error(
					`Scraping failed: ${runStatus.error || runStatus.message || 'Unknown error'}`,
				);
			}
			await delay(pollInterval);
		}
		throw new Error(`Scraping timeout after ${timeout}ms`);
	}
}
