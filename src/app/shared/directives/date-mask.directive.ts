import { Directive, ElementRef, HostListener, inject } from '@angular/core';

@Directive({
  selector: 'input[appDateMask]',
  standalone: true,
})
export class DateMaskDirective {
  private readonly host = inject<ElementRef<HTMLInputElement>>(ElementRef);

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = this.host.nativeElement;
    const isDeleting =
      event instanceof InputEvent &&
      (event.inputType === 'deleteContentBackward' ||
        event.inputType === 'deleteContentForward');

    const digits = input.value.replace(/\D/g, '').slice(0, 8);
    const formatted = this.format(digits);

    if (formatted === input.value) {
      return;
    }

    const previousSelection = input.selectionStart ?? formatted.length;
    input.value = formatted;

    if (!isDeleting) {
      const nextPos = this.adjustCursor(previousSelection, formatted.length);
      input.setSelectionRange(nextPos, nextPos);
    }
  }

  private format(digits: string): string {
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }

  private adjustCursor(previous: number, length: number): number {
    if (previous >= length) return length;
    if (previous === 3 || previous === 6) return previous + 1;
    return previous;
  }
}
