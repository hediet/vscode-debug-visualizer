import { Point, Rectangle } from "./Point";
import * as React from "react";
import { Properties } from "csstype";

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

export function omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
	const newObj: Omit<T, K> = {} as any;
	for (const [key, val] of Object.entries(obj)) {
		if (!keys.includes(key as K)) {
			(newObj as any)[key] = val;
		}
	}
	return newObj;
}

export interface SvgAttributes<T> extends React.DOMAttributes<T> {
	stroke?: string;
	className?: string;
	style?: Properties;
	pointerEvents?: "none" | "auto" | "initial";
}

export function SvgText(
	props: {
		position: Point;
		children: any;
		childRef?: React.Ref<SVGTextElement>;
		textAnchor?: "middle" | "end" | "start";
		dominantBaseline?: "central" | "middle";
	} & SvgAttributes<SVGTextElement>
) {
	return (
		<text
			x={props.position.x}
			y={props.position.y}
			ref={props.childRef}
			{...omit(props, ["position", "childRef"])}
		/>
	);
}

export function SvgCircle(
	props: {
		center: Point;
		radius: number;
		childRef?: React.Ref<SVGCircleElement>;
	} & SvgAttributes<SVGCircleElement>
) {
	return (
		<circle
			cx={props.center.x}
			cy={props.center.y}
			r={props.radius}
			ref={props.childRef}
			{...omit(props, ["center", "radius", "childRef"])}
		/>
	);
}

export function SvgLine(
	props: { start: Point; end: Point } & SvgAttributes<SVGLineElement>
) {
	return (
		<line
			x1={props.start.x}
			y1={props.start.y}
			x2={props.end.x}
			y2={props.end.y}
			{...omit(props, ["end", "start"])}
		/>
	);
}

export function SvgRect(
	props: { rectangle: Rectangle; fill?: string } & SvgAttributes<
		SVGRectElement
	>
) {
	const r = props.rectangle;
	return (
		<rect
			x={r.topLeft.x}
			y={r.topLeft.y}
			width={r.size.x}
			height={r.size.y}
			{...omit(props, ["rectangle"])}
		/>
	);
}
