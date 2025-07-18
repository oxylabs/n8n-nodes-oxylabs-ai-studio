import { BrowseOptions, RunResponse, ApiResponse } from '../types';
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
 * Browser Agent Service
 * Handles all Browser Agent related API calls
 */
export class BrowserAgentService {
	private n8n: IExecuteFunctions;
	private apiUrl: string;

	constructor(n8n: IExecuteFunctions, apiUrl: string) {
		this.n8n = n8n;
		this.apiUrl = apiUrl;
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
		return await this.n8n.helpers.httpRequestWithAuthentication.call(
			this.n8n,
			'oxylabsAiStudioApi',
			requestOptions,
		);
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
		return await this.n8n.helpers.httpRequestWithAuthentication.call(
			this.n8n,
			'oxylabsAiStudioApi',
			requestOptions,
		);
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
		return await this.n8n.helpers.httpRequestWithAuthentication.call(
			this.n8n,
			'oxylabsAiStudioApi',
			requestOptions,
		);
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
			const runStatus = await this.getBrowseRunSteps(runId);
			const run_status = runStatus.run.status;
			if (run_status === 'completed' || run_status === 'success') {
				return await this.getBrowseRunData(runId);
			} else if (run_status === 'failed' || run_status === 'error') {
				throw new Error(
					`Browsing failed: ${runStatus.run.error || runStatus.run.message || 'Unknown error'}`,
				);
			}
			await delay(pollInterval);
		}
		throw new Error(`Browsing timeout after ${timeout}ms`);
	}
}
