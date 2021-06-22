export function getGlobal(): any {
	if (typeof globalThis === "object") {
		return globalThis;
	} else if (typeof global === "object") {
		return global;
	} else if (typeof window === "object") {
		return window;
	}

	throw new Error("No global available");
}
