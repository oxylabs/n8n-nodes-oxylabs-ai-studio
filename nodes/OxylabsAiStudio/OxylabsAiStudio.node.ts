import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { AiCrawlerService } from './sdk/services/aiCrawler';
import { AiScraperService } from './sdk/services/aiScraper';
import { BrowserAgentService } from './sdk/services/browserAgent';
import { AiSearchService } from './sdk/services/aiSearch';
import { ScrapeOptions, CrawlOptions, BrowseOptions, SearchOptions } from './sdk/types';


export class OxylabsAiStudio implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Oxylabs AI Studio',
		name: 'oxylabsAiStudio',
		icon: 'file:OxylabsAiStudio.svg',
		group: ['transform'],
		version: 1,
		description: 'Interact with Oxylabs AI Studio API',
		defaults: {
			name: 'Oxylabs AI Studio',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'oxylabsAiStudioApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Scraper', value: 'scraper' },
					{ name: 'Crawler', value: 'crawler' },
					{ name: 'Browser Agent', value: 'browserAgent' },
					{ name: 'Search', value: 'search' },
				],
				default: 'scraper',
				required: true,
				description: 'Choose the resource to use',
			},

			// Scrape parameters
			{
				displayName: 'URL',
				name: 'scrapeUrl',
				type: 'string',
				displayOptions: { show: { resource: ['scraper'] } },
				default: '',
				required: true,
				description: 'The target URL to scrape',
			},
			{
				displayName: 'Output Format',
				name: 'scrapeOutputFormat',
				type: 'options',
				options: [
					{ name: 'Markdown', value: 'markdown' },
					{ name: 'JSON', value: 'json' },
				],
				default: 'markdown',
				displayOptions: { show: { resource: ['scraper'] } },
				description: 'The format in which to return the extracted data. Choose between Markdown or JSON.',
				required: true,
			},
			{
				displayName: 'JSON Schema',
				name: 'scrapeJsonPydanticSchema',
				type: 'json',
				displayOptions: { show: { resource: ['scraper'], scrapeOutputFormat: ['json'] } },
				default: null,
				description: 'OpenAPI JSON schema',
				required: true,
			},
			{
				displayName: 'Render JavaScript',
				name: 'scrapeRenderJavascript',
				type: 'boolean',
				default: false,
				displayOptions: { show: { resource: ['scraper'] } },
				description: 'Whether to render JavaScript on the page before extraction',
			},

			// Crawl parameters
			{
				displayName: 'URL',
				name: 'crawlUrl',
				type: 'string',
				displayOptions: { show: { resource: ['crawler'] } },
				default: '',
				required: true,
				description: 'The starting URL for the crawl',
			},
			{
				displayName: 'Prompt',
				name: 'crawlPrompt',
				type: 'string',
				displayOptions: { show: { resource: ['crawler'] } },
				default: '',
				description: 'Instructions for what data to extract from crawled pages',
			},
			{
				displayName: 'Output Format',
				name: 'crawlOutputFormat',
				type: 'options',
				options: [
					{ name: 'Markdown', value: 'markdown' },
					{ name: 'JSON', value: 'json' },
				],
				default: 'markdown',
				displayOptions: { show: { resource: ['crawler'] } },
				description: 'The desired output format per URL',
			},
			{
				displayName: 'JSON Schema',
				name: 'crawlJsonPydanticSchema',
				type: 'json',
				displayOptions: { show: { resource: ['crawler'], crawlOutputFormat: ['json'] } },
				default: '{}',
				description: 'The openapi schema in JSON format that defines the structure of the output data. Required when output format is set to JSON.',
			},
			{
				displayName: 'Render JavaScript',
				name: 'crawlRenderJavascript',
				type: 'boolean',
				default: false,
				displayOptions: { show: { resource: ['crawler'] } },
				description: 'Whether to render JavaScript on the pages before extraction',
			},
			{
				displayName: 'Max Results',
				name: 'crawlMaxPages',
				type: 'number',
				displayOptions: { show: { resource: ['crawler'] } },
				default: 25,
				description: 'Maximum number of results to return. Maximum is 50.',
			},

			// Browse parameters
			{
				displayName: 'URL',
				name: 'browseUrl',
				type: 'string',
				displayOptions: { show: { resource: ['browserAgent'] } },
				default: '',
				required: true,
				description: 'The target URL for the browser agent to start at',
			},
			{
				displayName: 'Prompt',
				name: 'browseUserPrompt',
				type: 'string',
				displayOptions: { show: { resource: ['browserAgent'] } },
				default: '',
				description: 'Instructions defining the actions the browser agent should perform',
			},
			{
				displayName: 'Output Format',
				name: 'browseOutputFormat',
				type: 'options',
				options: [
					{ name: 'Markdown', value: 'markdown' },
					{ name: 'HTML', value: 'html' },
					{ name: 'JSON', value: 'json' },
					{ name: 'Screenshot', value: 'screenshot' },
				],
				default: 'markdown',
				displayOptions: { show: { resource: ['browserAgent'] } },
				description: 'The desired output format',
			},
			{
				displayName: 'JSON Schema',
				name: 'browseJsonPydanticSchema',
				type: 'json',
				displayOptions: { show: { resource: ['browserAgent'], browseOutputFormat: ['json'] } },
				default: '{}',
				description: 'The openapi schema in JSON format that defines the structure of the output data. Required when output format is set to JSON.',
			},

			// Search parameters
			{
				displayName: 'Search Query',
				name: 'searchQuery',
				type: 'string',
				displayOptions: { show: { resource: ['search'] } },
				default: '',
				required: true,
				description: 'The search query to use. For example, "weather in London".',
			},
			{
				displayName: 'Limit',
				name: 'searchLimit',
				type: 'number',
				displayOptions: { show: { resource: ['search'] } },
				default: 10,
				description: 'Maximum number of search results to return. Maximum is 50.',
			},
			{
				displayName: 'Return Contents',
				name: 'searchReturnContent',
				type: 'boolean',
				displayOptions: { show: { resource: ['search'] } },
				default: true,
				description: 'Whether to return markdown content of each search result',
			},
			{
				displayName: 'Render JavaScript',
				name: 'searchRenderJavascript',
				type: 'boolean',
				displayOptions: { show: { resource: ['search'] } },
				default: false,
				description: 'Whether to render JavaScript on the results pages',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const creds = await this.getCredentials('oxylabsAiStudioApi');
		const aiCrawlerService = new AiCrawlerService(this, creds.apiUrl as string);
		const aiScraperService = new AiScraperService(this, creds.apiUrl as string);
		const browserAgentService = new BrowserAgentService(this, creds.apiUrl as string);
		const aiSearchService = new AiSearchService(this, creds.apiUrl as string);

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				let responseData;
				if (resource === 'scraper') {
					const url = this.getNodeParameter('scrapeUrl', i) as string;
					const output_format = this.getNodeParameter('scrapeOutputFormat', i) as string;
					const render_javascript = this.getNodeParameter('scrapeRenderJavascript', i, false) as boolean;
					const body: ScrapeOptions = { url: url,
                                        output_format: output_format,
                                        render_html: render_javascript
									};
					if (output_format === 'json') {
						let openapi_schema = this.getNodeParameter('scrapeJsonPydanticSchema', i, {}) ?? {};
						if (typeof openapi_schema === 'string') {
							openapi_schema = openapi_schema.trim() ? JSON.parse(openapi_schema) : {};
						}
						if (typeof openapi_schema !== 'object' || openapi_schema === null) {
							openapi_schema = {};
						}
						body.openapi_schema = openapi_schema;
					}
					responseData = await aiScraperService.scrape(body, 60000 * 2);
				} else if (resource === 'crawler') {
					const url = this.getNodeParameter('crawlUrl', i) as string;
					const crawl_prompt = this.getNodeParameter('crawlPrompt', i) as string;
					const output_format = this.getNodeParameter('crawlOutputFormat', i) as string;
					const max_pages = this.getNodeParameter('crawlMaxPages', i, 25) as number;
					const render_javascript = this.getNodeParameter('crawlRenderJavascript', i, false) as boolean;

					const body: CrawlOptions = { url: url,
										crawl_prompt: crawl_prompt,
										output_format: output_format,
										max_pages: max_pages,
										render_html: render_javascript,
									};
					if (output_format === 'json') {
						let openapi_schema = this.getNodeParameter('crawlJsonPydanticSchema', i, {}) ?? {};
						if (typeof openapi_schema === 'string') {
							openapi_schema = openapi_schema.trim() ? JSON.parse(openapi_schema) : {};
						}
						if (typeof openapi_schema !== 'object' || openapi_schema === null) {
							openapi_schema = {};
						}
						body.openapi_schema = openapi_schema;
					}
          responseData = await aiCrawlerService.crawl(body, 60000 * 10);
				} else if (resource === 'browserAgent') {
					const url = this.getNodeParameter('browseUrl', i) as string;
					const user_prompt = this.getNodeParameter('browseUserPrompt', i) as string;
					const output_format = this.getNodeParameter('browseOutputFormat', i) as string;
					const body: BrowseOptions = { url: url,
                                        browse_prompt: user_prompt,
                                        output_format: output_format,
									};
					if (output_format === 'json') {
						let openapi_schema = this.getNodeParameter('browseJsonPydanticSchema', i, {}) ?? {};
						if (typeof openapi_schema === 'string') {
							openapi_schema = openapi_schema.trim() ? JSON.parse(openapi_schema) : {};
						}
						if (typeof openapi_schema !== 'object' || openapi_schema === null) {
							openapi_schema = {};
						}
						body.openapi_schema = openapi_schema;
					}

					responseData = await browserAgentService.browse(body, 60000 * 10);
				} else if (resource === 'search') {
					const query = this.getNodeParameter('searchQuery', i) as string;
					const limit = this.getNodeParameter('searchLimit', i, 10) as number;
					const return_content = this.getNodeParameter('searchReturnContent', i, true) as boolean;
					const render_javascript = this.getNodeParameter('searchRenderJavascript', i, false) as boolean;
					const body: SearchOptions = { query, limit, render_javascript, return_content };
					responseData = await aiSearchService.search(body, 60000 * 3);
				} else {
                    throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`, { itemIndex: i });
                }
				returnData.push({ json: {status: responseData.status, data: responseData.data, message: responseData.message} });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message }, pairedItem: i });
				} else {
					throw new NodeOperationError(this.getNode(), error, { itemIndex: i });
				}
			}
		}
		return [this.helpers.returnJsonArray(returnData)];
	}
}
