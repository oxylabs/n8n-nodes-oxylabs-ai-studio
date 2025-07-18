export enum RunStatus {
	PENDING = 'pending',
	RUNNING = 'running',
	COMPLETED = 'completed',
	SUCCESS = 'success',
	FAILED = 'failed',
	ERROR = 'error',
}

export enum OutputFormat {
	MARKDOWN = 'markdown',
	JSON = 'json',
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
	error?: string;
}

export interface ScrapeOptions {
	url: string;
	user_prompt?: string;
	output_format?: OutputFormat | string;
	openapi_schema?: Record<string, any>;
	render_html?: boolean;
}

export interface CrawlOptions {
	url: string;
	crawl_prompt: string;
	output_format?: OutputFormat | string;
	openapi_schema?: Record<string, any>;
	max_pages?: number;
	render_html?: boolean;
}

export interface BrowseOptions {
	url: string;
	browse_prompt: string;
	output_format: OutputFormat | string;
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
