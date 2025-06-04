export interface DelayQueueItem<V> {
  date: number;
  value: V;
}

export class DelayQueue<T> {
  private items = new Array<DelayQueueItem<T>>();
  private intervalId = setInterval(() => this.processQueue(), 100);

  constructor(readonly callback: (value: T) => void) {}

  add(value: T, delay: number): void {
    this.items.push({ value, date: Date.now() + delay });
  }

  filter(predicate: (value: T) => boolean): void {
    this.items = this.items.filter((item) => predicate(item.value));
  }

  stop(): void {
    clearInterval(this.intervalId);
  }

  private processQueue(): void {
    const filteredItems = this.items.filter((item) => Date.now() >= item.date);

    filteredItems.forEach((item) => {
      this.filter((value) => value !== item.value);
      this.callback(item.value);
    });
  }
}
