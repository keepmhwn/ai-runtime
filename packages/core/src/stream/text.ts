interface TextStreamerOptions {
  charsPerUpdate: number;
  updateInterval: number;
}

class TextStreamer {
  private options: TextStreamerOptions = {
    charsPerUpdate: 1,
    updateInterval: 10,
  };

  private queue = "";
  private lastUpdateTime: number | null = null;

  constructor(
    private onFlush: (text: string) => void,
    options?: Partial<TextStreamerOptions>,
  ) {
    if (options) {
      const { charsPerUpdate, updateInterval } = options;

      if (charsPerUpdate !== undefined) {
        if (charsPerUpdate <= 0) {
          throw new Error("charsPerUpdate must be greater than 0");
        }
        this.options.charsPerUpdate = charsPerUpdate;
      }

      if (updateInterval !== undefined) {
        if (updateInterval < 0) {
          throw new Error("updateInterval must be non-negative");
        }
        this.options.updateInterval = updateInterval;
      }
    }
  }

  enqueue(text: string): void {
    this.queue += text;
  }

  tick = (timestamp: number): boolean => {
    if (this.queue.length === 0) {
      return false;
    }

    if (this.lastUpdateTime === null) {
      this.lastUpdateTime = timestamp;
      return true;
    }

    const elapsed = timestamp - this.lastUpdateTime;
    if (elapsed < this.options.updateInterval) {
      return true;
    }

    const textToAdd = this.queue.slice(0, this.options.charsPerUpdate);
    this.queue = this.queue.slice(this.options.charsPerUpdate);

    this.onFlush(textToAdd);
    this.lastUpdateTime = timestamp;

    return this.queue.length > 0;
  };

  reset(): void {
    this.queue = "";
    this.lastUpdateTime = 0;
  }
}
