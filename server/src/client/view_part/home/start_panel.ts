import { EventEmitter } from 'events';
import './start_panel.css';

export class StartPanel extends EventEmitter {
  element?: HTMLDivElement;
  title?: HTMLHeadingElement;
  // button?: HTMLButtonElement;

  constructor(private parent: HTMLElement) {
    super();
    this.init();
  }

  private async init() {
    const userLanguage = navigator.language || (navigator as any).userLanguage;
    console.log(userLanguage); // e.g. "en-US", "fr-FR", etc.
    
    const title = (userLanguage === 'ko-KR') ? "랜덤 채팅 - 낯선 설레임" : 'Random Chat - Instant Chat with Strangers';

    this.parent.innerHTML += `
      <div class="start-panel">
        <h1 class="start-title">${title}</h1>
        <button id="start-btn" class="button">${(userLanguage === 'ko-KR') ? "시작하기" : 'Start'}</button>
      </div>
    `;

    // Add click event listener to the button
    document.getElementById('start-btn')?.addEventListener('click', this.onclick.bind(this));

    // this.parent.appendChild(this.element!);
    // getLocation
  }

  onclick(_: MouseEvent) {
    this.emit('start');
  }

  public dispose(): void {
    if (this.element) {
      // Remove the click event listener
      document.getElementById('start-btn')?.removeEventListener('click', this.onclick.bind(this));
      this.parent.removeChild(this.element);
    }
  }


  getLocation(): Promise<string> {
    return new Promise((res, rej) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
  
            // Use a reverse geocoding service (example using nominatim.openstreetmap.org)
            fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            )
              .then((response) => response.json())
              .then((data) => {
                const country = data.address.country;
                res(country);
                // updateGreeting(country);
              })
              .catch((error) => {
                console.error("Error:", error);
                // updateGreeting("");
                rej(error)
              });
          },
          (error) => {
            console.error("Error:", error);
            // updateGreeting("");
            switch(error.code) {
              case error.PERMISSION_DENIED:
                console.log("User denied the request for geolocation.");
                break;
              case error.POSITION_UNAVAILABLE:
                console.log("Location information is unavailable.");
                break;
              case error.TIMEOUT:
                console.log("The request to get user location timed out.");
                break;
              default:
                console.log("An unknown error occurred.");
                break;
            }
            rej(error)
          }
        );
      }
      else {
        console.log("Geolocation is not supported by this browser.");
        // updateGreeting("");
        rej("Geolocation is not supported by this browser.")
      }
    })
  }
}