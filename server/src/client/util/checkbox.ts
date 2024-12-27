import './checkbox.css';

export class Checkbox {
  private element: HTMLElement;

  constructor(parent: HTMLElement, checked: boolean = false, public label: string = '') {
    this.element = document.createElement('label');
    this.element.className = 'checkbox-container';
    this.buildStructure();
    parent.appendChild(this.element);
    this.checked = checked;
  }

  private buildStructure() {
    this.element.innerHTML = `
      <span class="label-text">${this.label}</span>
      <label class="switch">
        <input type="checkbox">
        <span class="cb-slider round"></span>
      </label>
    `;
  }

  public get checked() {
    return this.element.querySelector('input')?.checked ?? false;
  }

  public set checked(value: boolean) {
    (this.element.querySelector('input') as HTMLInputElement).checked = value;
  }

  dispose() {
    this.element.remove();
  }
}
