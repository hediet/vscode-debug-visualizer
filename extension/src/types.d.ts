declare namespace NodeJS {
	declare interface ProcessEnv {
		HOT_RELOAD?: "true";
		USE_DEV_UI?: "true";
	}
}

declare module "debug-visualizer-webview" {
	export const distPath: string;
}
