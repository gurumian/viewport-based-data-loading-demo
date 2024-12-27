import './loader.css';

export class Loader {
  private container: HTMLDivElement;
  private overlay: HTMLDivElement;
  private textElement: HTMLParagraphElement;
  private cancelButton: HTMLButtonElement;
  private onCancel: (() => void) | null = null;

  constructor(public parent: HTMLDivElement, public text: string = 'Searching...') {
    this.container = document.createElement('div');
    this.overlay = document.createElement('div');
    this.textElement = document.createElement('p');
    this.cancelButton = document.createElement('button');

    this.container.className = 'loader';
    this.overlay.className = 'loader-overlay';
    this.textElement.className = 'loader-text';
    this.cancelButton.className = 'loader-cancel-button';

    this.textElement.textContent = text;
    this.cancelButton.textContent = 'Cancel';

    this.createDots();
    this.setupCancelButton();
  }

  private createDots(): void {
    const colors = ['#93939673', '#93939673', '#93939673', '#93939673'];
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'dots-container';

    colors.forEach((color, index) => {
      const dot = document.createElement('div');
      dot.className = 'dot';
      dot.style.backgroundColor = color;
      dot.style.animationDelay = `${-0.32 + 0.16 * index}s`;
      dotsContainer.appendChild(dot);
    });

    this.container.appendChild(dotsContainer);
    this.container.appendChild(this.textElement);
    this.container.appendChild(this.cancelButton);
  }

  private setupCancelButton(): void {
    this.cancelButton.addEventListener('click', () => {
      if (this.onCancel) {
        this.onCancel();
      }
      this.hide();
    });
  }

  show(): void {
    this.parent.appendChild(this.overlay);
    this.overlay.appendChild(this.container);
  }

  hide(): void {
    if (this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }

  setText(text: string): void {
    this.textElement.textContent = text;
  }

  setOnCancel(callback: () => void): void {
    this.onCancel = callback;
  }

  dispose(): void {
    this.hide();
    this.onCancel = null;
  }
}