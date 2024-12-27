import { EventEmitter } from 'events';
import './input_panel.css';

export class InputPanel extends EventEmitter {
  private element: HTMLDivElement;
  // private inputField?: HTMLTextAreaElement;
  // private sendButton?: HTMLButtonElement;
  // private commandTooltip?: HTMLDivElement;
  // private avatarCheckbox?: HTMLInputElement;

  constructor(parent: HTMLElement) {
    super();
    this.element = document.createElement('div') as HTMLDivElement;
    this.element.className = 'input-panel';
    parent.appendChild(this.element);
    this.buildStructure();
  }

  private buildStructure() {
    this.element.innerHTML = `
      <button class='plus-button'>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"></path>
          </svg>
      </button>
      <textarea placeholder="Type a message..." class="chat-input"></textarea>
      <button class="send-button">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"></path>
        </svg>
      </button>
    `;

    let plusButton = document.querySelector('.plus-button') as HTMLButtonElement;
    plusButton?.addEventListener('click', (event) => {
      event.stopPropagation();
      this.emit('click', 'plus');
    });

    let sendButton = document.querySelector('.send-button') as HTMLButtonElement;
    sendButton?.addEventListener('click', (event) => {
      event.stopPropagation();
      const inputText = inputField.value.trim();
      if (inputText) {
        this.emit('message', inputText);
        inputField.value = '';
      }
    });

    let inputField = document.querySelector('.chat-input') as HTMLTextAreaElement;
    inputField?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        const inputText = inputField.value.trim();
        if (inputText) {
          this.emit('message', inputText);
          inputField.value = '';
        }
        inputField.value = '';
      }
    });

    inputField?.addEventListener('change', (event) => {
      event.stopPropagation();
      this.emit('change', (event.target as HTMLTextAreaElement).value);
    });
    inputField?.addEventListener('focus', (event) => {
      event.stopPropagation();
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        setTimeout(() => {
          window.scrollTo(0, document.body.scrollHeight);
        }, 300);
      }
    });
  }

//   private async getSVGContent(icon: string): Promise<string> {
//     try {
//       const response = await fetch(`../images/svg/${icon}.svg`);
//       return await response.text();
//     } catch (error) {
//       console.error(`Error loading SVG: ${icon}`, error);
//       return '';
//     }
//   }

//   private async createIcon(icon: string): Promise<HTMLElement> {
//     const wrapper = document.createElement('div');
//     wrapper.classList.add('rounded-button');
//     const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGElement;
//     const svgContent = await this.getSVGContent(icon);
//     svg.innerHTML = svgContent;
//     wrapper.appendChild(svg);
//     return wrapper;
//   }

//   private async buildStructure(): Promise<void> {
//     const chatInterface = this.createElement('div', 'chat-interface');
//     this.element.appendChild(chatInterface);
//     this.createInputField(chatInterface);
//     this.createAvatarCheckbox(chatInterface);
//     await this.createBottomUtilities(chatInterface);
//   }

//   private createInputField(parent: HTMLElement): void {
//     const inputContainer = this.createElement('div', 'input-container');
//     parent.appendChild(inputContainer);
//     this.inputField = this.createElement('textarea', 'reply-input') as HTMLTextAreaElement;
//     this.inputField.placeholder = 'Reply...';
//     this.inputField.style.resize = 'none';
//     inputContainer.appendChild(this.inputField);
//     this.commandTooltip = this.createElement('div', 'tooltip') as HTMLDivElement;
//     inputContainer.appendChild(this.commandTooltip);
//     this.inputField.addEventListener('keypress', this.handleKeyPress.bind(this));
//     this.inputField.addEventListener('keydown', this.handleKeyDown.bind(this));
//     this.inputField.addEventListener('focus', () => {
//       if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
//         setTimeout(() => {
//           window.scrollTo(0, document.body.scrollHeight);
//         }, 300);
//       }
//     });
//   }

//   private createAvatarCheckbox(parent: HTMLElement): void {
//     const checkboxContainer = this.createElement('div', 'avatar-checkbox-container');
//     this.avatarCheckbox = this.createElement('input', 'avatar-checkbox') as HTMLInputElement;
//     this.avatarCheckbox.type = 'checkbox';
//     this.avatarCheckbox.id = 'avatar-checkbox';
//     this.avatarCheckbox.checked = true;
    
//     const label = this.createElement('label') as HTMLLabelElement;
//     label.htmlFor = 'avatar-checkbox';
//     label.textContent = 'Avatar';
    
//     checkboxContainer.appendChild(this.avatarCheckbox);
//     checkboxContainer.appendChild(label);
//     parent.appendChild(checkboxContainer);
    
//     this.avatarCheckbox.addEventListener('change', this.handleAvatarCheckboxChange.bind(this));
//   }

//   private handleAvatarCheckboxChange(): void {
//     if (this.avatarCheckbox) {
//       const isChecked = this.avatarCheckbox.checked;
//       console.log('Avatar checkbox changed:', isChecked);
//       this.emit('avatarCheckboxChange', isChecked);
//     }
//   }

//   private handleKeyDown(event: KeyboardEvent): void {
//     if (event.key === '/') {
//       this.showTooltip();
//     } else {
//       this.hideTooltip();
//     }
//   }

//   private showTooltip() {
//     const rect = this.inputField!.getBoundingClientRect();
//     this.commandTooltip!.style.left = rect.left + 'px';
//     this.commandTooltip!.style.top = (rect.bottom - 50) + 'px';
//     this.commandTooltip!.style.display = 'block';
//     this.updateTooltip();
//   }

//   private hideTooltip() {
//     this.commandTooltip!.style.display = 'none';
//   }

//   private updateTooltip() {
//     const commands = ['/create', '/list', '/join', '/destroy', '/leave'];
//     const inputValue = this.inputField!.value.toLowerCase();
//     const matchedCommands = commands.filter(cmd => cmd.startsWith(inputValue));
//     if (matchedCommands.length > 0) {
//       this.commandTooltip!.innerHTML = matchedCommands.map(cmd => `<div class="tooltip-item">${cmd}</div>`).join('');
//       this.commandTooltip!.style.display = 'block';
//       const tooltipItems = this.commandTooltip!.querySelectorAll('.tooltip-item');
//       tooltipItems.forEach(item => {
//         item.addEventListener('click', (event) => {
//           const selectedCommand = (event.target as HTMLElement).textContent;
//           if (selectedCommand) {
//             this.inputField!.value = selectedCommand;
//             this.hideTooltip();
//             this.inputField!.focus();
//           }
//         });
//       });
//     } else {
//       this.hideTooltip();
//     }
//   }

//   private handleKeyPress(event: KeyboardEvent): void {
//     if (event.key === 'Enter' && !event.shiftKey) {
//       event.preventDefault();
//       this.handleSendClick();
//     }
//   }

//   private async createBottomUtilities(parent: HTMLElement): Promise<void> {
//     const inputContainer = parent.querySelector('.input-container') as HTMLElement;
//     this.sendButton = this.createElement('button', 'send-button') as HTMLButtonElement;
//     const icon = await this.createIcon('paper-plane-solid');
//     this.sendButton.appendChild(icon);
//     inputContainer.appendChild(this.sendButton);
//     this.sendButton.addEventListener('click', this.handleSendClick.bind(this));

//     const utilities = this.createElement('div', 'utilities');
//     parent.appendChild(utilities);
//     const lists = [
//       ['plus-solid', 'microphone-solid', 'headset-solid', 'video-solid'],
//       ['exit']
//     ];
//     for (const items of lists) {
//       const ul = this.createElement('ul');
//       utilities.appendChild(ul);
//       for (const item of items) {
//         const li = this.createElement('li');
//         const icon = await this.createIcon(item);
//         li.appendChild(icon);
//         ul.appendChild(li);
//         li.id = item;
//       }
//     }

//     let plus_button = document.getElementById('plus-solid');
//     plus_button?.addEventListener('click', this.handlePlusButtonClick.bind(this));
//     let audio_button = document.getElementById('microphone-solid');
//     audio_button?.addEventListener('click', this.handleAudioButtonClick.bind(this));
//     let headset_button = document.getElementById('headset-solid');
//     headset_button?.addEventListener('click', this.handleHeadsetButtonClick.bind(this));
//     let video_button = document.getElementById('video-solid');
//     video_button?.addEventListener('click', this.handleVideoButtonClick.bind(this));
//     let exit_button = document.getElementById('exit');
//     exit_button?.addEventListener('click', this.handleExitButtonClick.bind(this));
//   }

//   private handlePlusButtonClick(): void {
//     console.log('plus button click');
//     this.emit('click', 'plus');
//   }

//   private handleAudioButtonClick(): void {
//     console.log('audio button click');
//     this.emit('click', 'audio');
//   }

//   private handleHeadsetButtonClick(): void {
//     console.log('headset button click');
//     this.emit('click', 'headset');
//   }

//   private handleVideoButtonClick(): void {
//     console.log('video button click');
//     this.emit('click', 'video');
//   }


//   private handleExitButtonClick(): void {
//     console.log('exit button click');
//     this.emit('click', 'exit');
//   }

//   private handleSendClick(): void {
//     if (this.inputField) {
//       const inputText = this.inputField.value.trim();
//       if (inputText) {
//         this.emit('message', inputText);
//         this.inputField.value = '';
//       }
//     }
//   }

  // private enableButton(li: HTMLUListElement, enable: boolean) {
  //   if (li) {
  //     const button = li.querySelector('.rounded-button');
  //     button?.classList.toggle('enabled');
  //     if (enable) {
  //       button?.classList.add('enabled');
  //     } else {
  //       button?.classList.remove('enabled');
  //     }
  //   }
  // }

  // public set enableHeadsetButton(enable: boolean) {
  //   console.log(`enableHeadsetButton ${enable}`);
  //   let li = document.getElementById('headset-solid') as HTMLUListElement;
  //   if (li) this.enableButton(li, enable);
  // }

  // public set enableAudioButton(enable: boolean) {
  //   let li = document.getElementById('microphone-solid') as HTMLUListElement;
  //   if (li) this.enableButton(li, enable);
  // }

  // public set enableVideoButton(enable: boolean) {
  //   let li = document.getElementById('video-solid') as HTMLUListElement;
  //   if (li) this.enableButton(li, enable);
  // }

//   private createElement(tag: string, className?: string, type?: string): HTMLElement {
//     const element = document.createElement(tag);
//     if (className) element.className = className;
//     if (type && tag === 'input') (element as HTMLInputElement).type = type;
//     return element;
//   }

//   public dispose(): void {
//     if (this.element && this.element.parentNode) {
//       this.element.parentNode.removeChild(this.element);
//     }
//     if (this.inputField) {
//       this.inputField.removeEventListener('keypress', this.handleKeyPress);
//       this.inputField.removeEventListener('keydown', this.handleKeyDown);
//     }
//     if (this.sendButton) {
//       this.sendButton.removeEventListener('click', this.handleSendClick);
//     }
//     if (this.avatarCheckbox) {
//       this.avatarCheckbox.removeEventListener('change', this.handleAvatarCheckboxChange);
//     }
//   }

  // public get avatarEnabled() {
  //   // return this.avatarCheckbox?.checked;
  //   return true;
  // }

  public dispose(): void {
    if(this.element) {
      this.element.remove();
    }
  }
}
