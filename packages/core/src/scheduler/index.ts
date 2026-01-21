type Task = (timestamp: number) => boolean | void;

interface Scheduler {
  schedule(task: Task): void;
  cancel(): void;
}

export class RAFScheduler implements Scheduler {
  private rafId: number | null = null;
  private task: Task | null = null;

  schedule(task: Task): void {
    this.task = task;

    if (this.rafId === null) {
      this.loop();
    }
  }

  cancel(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.task = null;
  }

  private loop = () => {
    this.rafId = requestAnimationFrame((timestamp: number) => {
      if (!this.task) {
        this.rafId = null;
        return;
      }

      try {
        const shouldContinue = this.task(timestamp);

        if (shouldContinue !== false) {
          this.loop();
        } else {
          this.task = null;
          this.rafId = null;
        }
      } catch (error) {
        if (this.rafId !== null) {
          cancelAnimationFrame(this.rafId);
        }

        this.task = null;
        this.rafId = null;
        throw error;
      }
    });
  };
}
