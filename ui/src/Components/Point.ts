function sqr(a: number) {
	return a * a;
}

export type PointLike =
	| Point
	| { x?: number; y: number }
	| { x: number; y?: number };

export function point(data: PointLike) {
	if (data instanceof Point) {
		return data;
	}
	return new Point(data.x || 0, data.y || 0);
}

export class Point {
	public static readonly Zero = new Point(0, 0);

	constructor(public readonly x: number, public readonly y: number) {}

	public mapXY(fn: (arg: number) => number): Point {
		return new Point(fn(this.x), fn(this.y));
	}

	public distance(other: PointLike = Point.Zero): number {
		const d = this.sub(other);
		return Math.sqrt(sqr(d.x) + sqr(d.y));
	}

	public sub(other: PointLike): Point {
		const o = point(other);
		return new Point(this.x - o.x, this.y - o.y);
	}

	public add(other: PointLike): Point {
		const o = point(other);
		return new Point(this.x + o.x, this.y + o.y);
	}

	public mul(scalar: number): Point {
		return new Point(this.x * scalar, this.y * scalar);
	}

	public div(scalar: number): Point {
		return new Point(this.x / scalar, this.y / scalar);
	}

	public equals(other: PointLike) {
		const o = point(other);
		return this.x === o.x && this.y === o.y;
	}

	public angle(): number {
		const angle = Math.atan2(this.x, this.y);
		return angle;
	}

	public getPointCloserTo(dest: PointLike, dist: number): Point {
		if (this.equals(dest)) return this;

		const angle = point(dest)
			.sub(this)
			.angle();

		const result = new Point(
			this.x + Math.sin(angle) * dist,
			this.y + Math.cos(angle) * dist
		);
		return result;
	}

	public toJson(): { x: number; y: number } {
		return { x: this.x, y: this.y };
	}
}

function turn(p1: Point, p2: Point, p3: Point): number {
	const A = (p3.y - p1.y) * (p2.x - p1.x);
	const B = (p2.y - p1.y) * (p3.x - p1.x);
	return A > B + Number.MIN_VALUE ? 1 : A + Number.MIN_VALUE < B ? -1 : 0;
}

export function isIntersect(
	aStart: Point,
	aEnd: Point,
	bStart: Point,
	bEnd: Point
): boolean {
	return (
		turn(aStart, bStart, bEnd) != turn(aEnd, bStart, bEnd) &&
		turn(aStart, aEnd, bStart) != turn(aStart, aEnd, bEnd)
	);
}

/**
 * Liang-Barsky function by Daniel White
 *
 * @link http://www.skytopia.com/project/articles/compsci/clipping.html
 *
 * @param  {number}        x0
 * @param  {number}        y0
 * @param  {number}        x1
 * @param  {number}        y1
 * @param  {array<number>} bbox
 * @return {array<array<number>>|null}
 */
function liangBarsky(
	x0: number,
	y0: number,
	x1: number,
	y1: number,
	bbox: [number, number, number, number]
): [[number, number], [number, number]] | null {
	let [xmin, xmax, ymin, ymax] = bbox;
	let t0 = 0,
		t1 = 1;
	let dx = x1 - x0,
		dy = y1 - y0;
	let p = 0,
		q = 0,
		r = 0;

	for (let edge: 0 | 1 | 2 | 3 = 0; edge < 4; edge++) {
		// Traverse through left, right, bottom, top edges.
		if (edge === 0) {
			p = -dx;
			q = -(xmin - x0);
		} else if (edge === 1) {
			p = dx;
			q = xmax - x0;
		} else if (edge === 2) {
			p = -dy;
			q = -(ymin - y0);
		} else if (edge === 3) {
			p = dy;
			q = ymax - y0;
		}

		r = q / p;

		if (p === 0 && q < 0) return null; // Don't draw line at all. (parallel line outside)

		if (p < 0) {
			if (r > t1) return null;
			// Don't draw line at all.
			else if (r > t0) t0 = r; // Line is clipped!
		} else if (p > 0) {
			if (r < t0) return null;
			// Don't draw line at all.
			else if (r < t1) t1 = r; // Line is clipped!
		}
	}

	return [[x0 + t0 * dx, y0 + t0 * dy], [x0 + t1 * dx, y0 + t1 * dy]];
}

export function intersectRectWithLine(
	start: Point,
	end: Point,
	rect: Rectangle
): { first: Point; second: Point } | undefined {
	const r = liangBarsky(start.x, start.y, end.x, end.y, [
		rect.topLeft.x,
		rect.bottomRight.x,
		rect.topLeft.y,
		rect.bottomRight.y,
	]);
	if (!r) {
		return undefined;
	}

	return {
		first: new Point(r[0][0], r[0][1]),
		second: new Point(r[1][0], r[1][1]),
	};
}

// first zoom then translate
export function scale(
	clientOffset: Point,
	clientSize: Point,
	viewSize: Point
): { clientZoom: number; clientOffset: Point } {
	const clientRatio = clientSize.x / clientSize.y;
	const viewRatio = viewSize.x / viewSize.y;

	let zoom = 1;

	if (clientRatio < viewRatio) zoom = viewSize.y / clientSize.y;
	else zoom = viewSize.x / clientSize.x;

	const clientMid = clientOffset.mul(zoom).add(clientSize.mul(zoom / 2));
	const viewMid = viewSize.div(2);

	const clientOffset2 = viewMid.sub(clientMid);

	return { clientOffset: clientOffset2, clientZoom: zoom };
}

export class Rectangle {
	public static ofSize(position: PointLike, size: PointLike): Rectangle {
		const pos = point(position);
		return new Rectangle(pos, pos.add(size));
	}

	public static spanning(first: Point, ...rest: Point[]): Rectangle {
		let min = first.toJson();
		let max = first.toJson();
		for (const p of rest) {
			min.x = Math.min(min.x, p.x);
			min.y = Math.min(min.y, p.y);
			max.x = Math.max(max.x, p.x);
			max.y = Math.max(max.y, p.y);
		}

		return new Rectangle(point(min), point(max));
	}

	constructor(
		public readonly topLeft: Point,
		public readonly bottomRight: Point
	) {}

	get center(): Point {
		return this.bottomRight.add(this.topLeft).div(2);
	}

	get size(): Point {
		return this.bottomRight.sub(this.topLeft);
	}

	get topRight(): Point {
		return new Point(this.bottomRight.x, this.topLeft.y);
	}

	get bottomLeft(): Point {
		return new Point(this.topLeft.x, this.bottomRight.y);
	}

	public intersects(selectionRect: Rectangle): boolean {
		return !(
			selectionRect.topLeft.x > this.bottomRight.x ||
			selectionRect.bottomRight.x < this.topLeft.x ||
			selectionRect.topLeft.y > this.bottomRight.y ||
			selectionRect.bottomRight.y < this.topLeft.y
		);
	}

	equals(other: Rectangle) {
		return (
			this.topLeft.equals(other.topLeft) &&
			this.bottomRight.equals(other.bottomRight)
		);
	}
}
