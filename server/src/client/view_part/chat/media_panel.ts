import { EventEmitter } from 'events';
import './media_panel.css';
import { Checkbox } from '../../util/checkbox';
export class MediaPanel extends EventEmitter {
  private element: HTMLDivElement;
  private avatarCheckbox?: Checkbox;
  private timeout?: NodeJS.Timeout;
  
  _headsetEnabled: boolean = false;
  _microphoneEnabled: boolean = false;
  _cameraEnabled: boolean = false;

  get headsetEnabled(): boolean {
    return this._headsetEnabled;
  }

  get microphoneEnabled(): boolean {
    return this._microphoneEnabled;
  }

  get cameraEnabled(): boolean {
    return this._cameraEnabled;
  }

  set headsetEnabled(enable: boolean) {
    this._headsetEnabled = enable;
    this.updateButtonState('headset', this.headsetEnabled);
    this.emit('click', 'headset');
  }

  set microphoneEnabled(enable: boolean) {
    this._microphoneEnabled = enable;
    this.updateButtonState('microphone', this.microphoneEnabled);
    this.emit('click', 'microphone');
  }

  set cameraEnabled(enable: boolean) {
    this._cameraEnabled = enable;
    this.updateButtonState('camera', this.cameraEnabled);
    this.emit('click', 'camera');
  }

  constructor(parent: HTMLElement) {
    super();
    this.element = document.createElement('div') as HTMLDivElement;
    this.element.className = 'media-panel';
    parent.appendChild(this.element);
    this.buildStructure();
    this.addClickOutsideListener();
    if (this.isDesktop()) {
      this.addHoverOutListener();
    }
  }

  private isDesktop(): boolean {
    return !('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }

  private addHoverOutListener() {
    let hoverTimeout: NodeJS.Timeout;
    this.element.addEventListener('mouseleave', () => {
      if (this.isVisible) {
        hoverTimeout = setTimeout(() => {
          this.visible = false;
        }, 2000); // Hide after 2 seconds
      }
    });
  
    this.element.addEventListener('mouseenter', () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    });
  }

  private addClickOutsideListener() {
    document.addEventListener('click', (event: MouseEvent) => {
      if (!this.element.contains(event.target as Node) && this.isVisible) {
        this.visible = false;
      }
    });
  }

  private buildStructure() {
    this.element.innerHTML = `
        <div class="media-panel-content">
          <button id="camera-button" class="media-option ">
            <img src="../images/svg/video-solid.svg" alt="Camera" width="24" height="24">
          </button>
          <button id="microphone-button" class="media-option ">
            <img src="../images/svg/microphone-solid.svg" alt="Microphone" width="24" height="24">
          </button>
          <button id="headset-button" class="media-option ">
            <img src="../images/svg/headset-solid.svg" alt="Headset" width="24" height="24">
          </button>
        </div>
    `;
    
    document.querySelector('.close-button')?.addEventListener('click', () => {
      this.visible = false;
    });

    document.getElementById('camera-button')?.addEventListener('click', () => {
      this.cameraEnabled = !this.cameraEnabled;
      // this.updateButtonState('camera', this.cameraEnabled);
      // this.emit('click', 'camera');
    //   this.resetTimeout();
    });
    document.getElementById('microphone-button')?.addEventListener('click', () => {
      this.microphoneEnabled = !this.microphoneEnabled;
      // this.updateButtonState('microphone', this.microphoneEnabled);
      // this.emit('click', 'microphone');
    //   this.resetTimeout();
    });
    document.getElementById('headset-button')?.addEventListener('click', () => {
      this.headsetEnabled = !this.headsetEnabled;
      // this.updateButtonState('headset', this.headsetEnabled);
      // this.emit('click', 'headset');
    //   this.resetTimeout();
    });

    this.avatarCheckbox = new Checkbox(document.querySelector('.media-panel-content')!, true, 'Use Avatar');
  }

  public get isVisible(): boolean {
    // return this.element.style.display === 'block';
    return this.element.classList.contains('open');
  }

  private resetTimeout() {
    if(this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(() => {
      this.visible = false;
    }, 3000);
  }

  public set visible(visible: boolean) {
    // this.element.style.display = visible ? 'block' : 'none';
    this.element.classList.toggle('open', visible);
    // this.resetTimeout();
  }

  private updateButtonState(buttonId: string, enabled: boolean) {
    const button = document.getElementById(`${buttonId}-button`);
    if (button) {
      button.classList.toggle('enabled', enabled);
    }
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

  private enableButton(li: HTMLUListElement, enable: boolean) {
    if (li) {
      const button = li.querySelector('.rounded-button');
      button?.classList.toggle('enabled');
      if (enable) {
        button?.classList.add('enabled');
      } else {
        button?.classList.remove('enabled');
      }
    }
  }

  public set enableHeadsetButton(enable: boolean) {
    console.log(`enableHeadsetButton ${enable}`);
    let li = document.getElementById('headset-solid') as HTMLUListElement;
    if (li) this.enableButton(li, enable);
  }

  public set enableAudioButton(enable: boolean) {
    let li = document.getElementById('microphone-solid') as HTMLUListElement;
    if (li) this.enableButton(li, enable);
  }

  public set enableVideoButton(enable: boolean) {
    let li = document.getElementById('video-solid') as HTMLUListElement;
    if (li) this.enableButton(li, enable);
  }

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

  public get avatarEnabled() {
    return this.avatarCheckbox?.checked;
  }

  public dispose(): void {
    if(this.element) {
      this.element.remove();
    }
  }
}
