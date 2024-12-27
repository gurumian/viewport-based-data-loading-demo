export class Timer {
    private timerId: NodeJS.Timeout | null = null;
  
    constructor(private callback: () => void, private delay: number) {}
  
    start(): void {
      if (!this.timerId) {
        this.timerId = setInterval(this.callback, this.delay);
      }
    }
  
    stop(): void {
      if (this.timerId) {
        clearInterval(this.timerId);
        this.timerId = null;
      }
    }
  
    isRunning(): boolean {
      return this.timerId !== null;
    }
  }
  
  // Usage
  // To stop the timer later:
  // timer.stop();