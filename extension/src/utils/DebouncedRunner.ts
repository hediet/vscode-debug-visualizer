export class DebouncedRunner {
	private timeout: NodeJS.Timeout | undefined;

	constructor(private readonly debounceTimeout: number) {}

	public run(action: () => void): void {
		this.clear();
		this.timeout = setTimeout(action, this.debounceTimeout);
	}

	private clear() {
		if (this.timeout) {
			clearTimeout(this.timeout);
			this.timeout = undefined;
		}
	}

	public dispose(): void {
		this.clear();
	}
}
