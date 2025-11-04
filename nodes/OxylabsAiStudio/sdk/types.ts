export enum RunStatus {
	PENDING = 'pending',
	RUNNING = 'running',
	COMPLETED = 'completed',
	SUCCESS = 'success',
	FAILED = 'failed',
	ERROR = 'error',
}

// App-specific output format lists
export enum SCRAPER_OUTPUT_FORMAT {
	MARKDOWN = 'markdown',
	JSON = 'json',
	CSV = 'csv',
	SCREENSHOT = 'screenshot',
}

export enum CRAWLER_OUTPUT_FORMAT {
	MARKDOWN = 'markdown',
	JSON = 'json',
	CSV = 'csv',
}

export enum BROWSER_AGENT_OUTPUT_FORMAT {
	MARKDOWN = 'markdown',
	JSON = 'json',
	CSV = 'csv',
	HTML = 'html',
	SCREENSHOT = 'screenshot',
}

export interface ApiResponse<T = any> {
	data?: T;
	message?: string;
	error?: string;
	status: string;
}

export interface RunResponse {
	run_id: string;
	id?: string;
	status: RunStatus;
	message?: string;
	error?: string;
}

export interface RunStatusResponse {
	status: RunStatus;
	message?: string;
	error_code?: string;
}

export interface ScrapeOptions {
	url: string;
	user_prompt?: string;
	output_format?: ScraperOutputFormat | string;
	openapi_schema?: Record<string, any>;
	render_html?: boolean;
}

export interface CrawlOptions {
	url: string;
	crawl_prompt: string;
	output_format?: CrawlerOutputFormat | string;
	openapi_schema?: Record<string, any>;
	max_pages?: number;
	render_html?: boolean;
}

export interface BrowseOptions {
	url: string;
	browse_prompt: string;
	output_format: BrowserAgentOutputFormat | string;
	openapi_schema?: Record<string, any>;
}

// AI Search interfaces
export interface SearchOptions {
	query: string;
	limit?: number;
	render_javascript?: boolean;
	return_content?: boolean;
}

export interface SearchResult {
	url: string;
	title: string;
	description: string;
	content?: string | null;
}

export interface SearchRunDataResponse {
	status: 'processing' | 'completed' | 'failed';
	message?: string | null;
	data?: SearchResult[] | null;
}
