declare module "viz.js" {
	const x: any;
	export default x;
}

declare module "viz.js/full.render.js" {
	export const render: any;
	export const Module: any;
}

declare module "line-column" {
	export = function(
		text: string
	): {
		fromIndex(
			idx: number
		): {
			line: number;
			col: number;
		};
	} {};
}
