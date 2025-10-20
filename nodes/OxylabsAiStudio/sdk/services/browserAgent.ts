import { BrowseOptions, RunResponse, ApiResponse } from '../types';
import { IExecuteFunctions, IHttpRequestOptions, sleep } from 'n8n-workflow';
import { BaseService } from './baseService.js';

/**
 * Browser Agent Service
 * Handles all Browser Agent related API calls
 */
export class BrowserAgentService extends BaseService {
	constructor(n8n: IExecuteFunctions, apiUrl: string) {
		super(n8n, apiUrl);
	}

	/**
	 * Submit browsing request (POST /browser-agent/run)
	 */
	async submitBrowseRequest(options: BrowseOptions): Promise<RunResponse> {
		const payload: any = {
			url: options.url,
			output_format: options.output_format || 'markdown',
			auxiliary_prompt: options.browse_prompt,
		};
		if (options.output_format === 'json' && options.openapi_schema) {
			payload.openapi_schema = options.openapi_schema;
		}
		const requestOptions: IHttpRequestOptions = {
			method: 'POST',
			url: `${this.apiUrl}/browser-agent/run`,
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
	 * Get browsing run status (GET /browser-agent/run/steps)
	 */
	async getBrowseRunSteps(runId: string): Promise<any> {
		if (!runId) {
			throw new Error('run_id is required');
		}
		const requestOptions: IHttpRequestOptions = {
			method: 'GET',
			url: `${this.apiUrl}/browser-agent/run/steps`,
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
	 * Get browsing run data/results (GET /browser-agent/run/data)
	 */
	async getBrowseRunData(runId: string): Promise<any> {
		if (!runId) {
			throw new Error('run_id is required');
		}
		const requestOptions: IHttpRequestOptions = {
			method: 'GET',
			url: `${this.apiUrl}/browser-agent/run/data`,
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
	 * Synchronous browsing (wait for results)
	 */
	async browse(
		options: BrowseOptions,
		timeout = 120000,
		pollInterval = 5000,
	): Promise<ApiResponse<Record<string, any> | null>> {
		const submitResult = await this.submitBrowseRequest(options);
		const runId = submitResult.run_id || submitResult.id;
		if (!runId) {
			throw new Error('No run ID returned from browse request');
		}
		const startTime = Date.now();
		while (Date.now() - startTime < timeout) {
				const response = await this.getBrowseRunData(runId);
			if (response.status === 'processing') {
				await sleep(pollInterval);
				continue;
			}
			
			if (response.status === 'completed') {
				return response;
			}
			
			if (response.status === 'failed') {
				throw new Error(
					`Browsing failed: ${response.error_code || response.message || 'Unknown error'}`,
				);
			}
			await sleep(pollInterval);
		}
		throw new Error(`Browsing timeout after ${timeout}ms`);
	}
}
