import { EventEmitter } from 'events';
import './chat_header.css';

export class ChatHeader extends EventEmitter {
    private element: HTMLDivElement;

    constructor(parent: HTMLElement, uid: string, room: number) {
        super();
        this.element = document.createElement('div') as HTMLDivElement;
        this.element.className = 'chat-header';
        parent.appendChild(this.element);

        this.buildStructure(uid, room);
    }

    private buildStructure(uid: string, room: number) {
        this.element.innerHTML = `
          <button id="back-button" class="back-button">❮</button>
          <div class="user-info">${uid} <br> #${room}</div>
      `;

        this.element.querySelector('#back-button')?.addEventListener('click', (event) => {
            console.log('back button clicked');
            event.stopPropagation();
            this.emit('click', 'exit');
        });
    }

    dispose() {
        this.element.remove();
    }
}
