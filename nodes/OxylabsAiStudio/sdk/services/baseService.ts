import { IExecuteFunctions, IHttpRequestOptions, sleep } from 'n8n-workflow';

export class BaseService {
	protected n8n: IExecuteFunctions;
	protected apiUrl: string;
	protected readonly MAX_RETRIES = 5;
	protected readonly RETRY_DELAY = 2000;

	constructor(n8n: IExecuteFunctions, apiUrl: string) {
		this.n8n = n8n;
		this.apiUrl = apiUrl;
	}

	protected async makeRequestWithRetry(
		requestOptions: IHttpRequestOptions,
		retries = this.MAX_RETRIES,
	): Promise<any> {
		for (let attempt = 0; attempt <= retries; attempt++) {
			try {
				return await this.n8n.helpers.httpRequestWithAuthentication.call(
					this.n8n,
					'oxylabsAiStudioApi',
					requestOptions,
				);
			} catch (error: any) {
				// n8n uses error.httpCode as string (e.g., "429", "500")
				const httpCode = error?.httpCode;
				const numericStatusCode = typeof httpCode === 'string' ? parseInt(httpCode, 10) : httpCode;
				
				// Retry on 429 (rate limit) and 5xx (server errors)
				const shouldRetry = (numericStatusCode === 429 || 
				                    (numericStatusCode >= 500 && numericStatusCode < 600)) && 
				                    attempt < retries;
				
				if (shouldRetry) {
					const delay = this.RETRY_DELAY * Math.pow(2, attempt); // Exponential backoff
					await sleep(delay);
					continue;
				}
				
				// Don't retry, throw the error
				throw error;
			}
		}
		throw new Error('Max retries exceeded');
	}
}

