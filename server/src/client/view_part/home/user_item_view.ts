import { EventEmitter } from "events";
export class UserItemView extends EventEmitter {
    name: string = "";
    age: number = 0;
    bio: string = "";
    country: string = "";
    sex: string = "";
    // profile: string = "";
    element: HTMLDivElement | null = null;
  
    constructor(public parent: HTMLDivElement, public user: any) {
      super();
      this.element = document.createElement('div');
      this.element.className = 'user';
      this.element.innerHTML = `
        <p>${user.name}</p>
        <p>${user.age}</p>
        <p>${user.bio}</p>
        <p>${user.country}</p>
        <p>${user.sex}</p>
      `;
      this.element.style.cursor = 'pointer';
      this.element.style.backgroundColor = 'lightgray';
      this.element.addEventListener('click', () => {
        console.log(`user clicked ${user.name}`);
        // Router.getInstance().requestStart(Parts.user, {
        //   "client": this.restClient,
        //   "room": room,
        //   "uid" : this.uid,
        //   "avatar": this.avatar,
        // });
        this.emit('click', user);
      });
      this.parent.appendChild(this.element);
    }
    
    dispose(): void {
      if(this.element) {
        this.element.remove();
        this.element = null;
      }
    }
  }