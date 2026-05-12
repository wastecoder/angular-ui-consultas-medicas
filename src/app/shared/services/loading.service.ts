import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private pendingRequests = signal(0);
  isLoading = computed(() => this.pendingRequests() > 0);

  start(): void {
    this.pendingRequests.update((n) => n + 1);
  }

  end(): void {
    this.pendingRequests.update((n) => Math.max(0, n - 1));
  }
}
