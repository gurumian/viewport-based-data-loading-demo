import "./chat_messages.css";
import "./link_preview.css";

export class ChatMessages {
  private chatContainer?: HTMLElement;

  constructor(private parent: HTMLElement) {
    this.buildStructure();
  }

  private buildStructure() {
    this.chatContainer = document.createElement('div') as HTMLDivElement;
    this.chatContainer.className = 'chat-container';
    this.parent.appendChild(this.chatContainer);
  }

  public addMessage(text: string, isSent: boolean = true, sender: string = 'You') {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(isSent ? 'message-sent' : 'message-received');
    
    // let senderElement;
    // if(!isSent) {
    //   senderElement = document.createElement('div');
    //   senderElement.classList.add('message-sender');
    //   senderElement.textContent = sender;
    // }
    console.log(sender)
    
    const textElement = document.createElement('div');
    const formattedText = text.replace(/\n/g, '<br>');
    textElement.innerHTML = formattedText;
    
    const timeElement = document.createElement('div');
    timeElement.classList.add('message-time');
    timeElement.textContent = new Date().toLocaleTimeString();
    
    // if(senderElement) {
    //   messageElement.appendChild(senderElement);
    // }
    messageElement.appendChild(textElement);
    messageElement.appendChild(timeElement);

    this.chatContainer!.appendChild(messageElement);
    this.scrollToBottom();
  }

  public addPreview(url: string, preview: any, isSent: boolean = true, sender: string = 'You') {
    console.log(sender)
    const messageElement = document.createElement('div');
    messageElement.className = 'link-preview'
    messageElement.classList.add('message');
    messageElement.classList.add(isSent ? 'message-sent' : 'message-received');
    
  //   <img src="${previewData.image}" alt="Preview image">
  // <h3>${previewData.title}</h3>
  // <p>${previewData.description}</p>
  // <span>${previewData.domain}</span>
    // messageElement.addEventListener('click', (_) => {
    //   if (url) {
    //     window.open(url, '_blank', 'noopener,noreferrer');
    //   }
    // })
    


    if(preview.image) {
      const previewImageElement = document.createElement('div');
      previewImageElement.className = "preview-image";
      messageElement.appendChild(previewImageElement);

      const image = document.createElement('img') as HTMLImageElement
      image.src = preview.image
      previewImageElement.appendChild(image);
    }

    let previewContentElement = document.createElement('div');
    previewContentElement.className = "preview-content";
    messageElement.appendChild(previewContentElement);


    if(preview.title) {
      const title = document.createElement('h3') as HTMLHeadingElement
      title.textContent = preview.title;
      title.className = "preview-title";
      previewContentElement.appendChild(title);
    }

    if(preview.description) {
      const description = document.createElement('p') as HTMLParagraphElement
      description.textContent = preview.description
      previewContentElement.appendChild(description);
    }

    let link = document.createElement('a');
    link.href = "#";
    link.className = "preview-url";
    link.textContent = url
    previewContentElement.appendChild(link);
    

    // if(preview.domain) {
    //   const domain = document.createElement('span') as HTMLSpanElement
    //   domain.textContent = preview.domain
    //   previewContentElement.appendChild(domain);
    // }
    
    // let senderElement;
    // if(!isSent) {
    //   senderElement = document.createElement('div');
    //   senderElement.classList.add('message-sender');
    //   senderElement.textContent = sender;  
    // }

    // // const textElement = document.createElement('div');
    // // const formattedText = text.replace(/\n/g, '<br>');
    // // textElement.innerHTML = formattedText;
    
    // const timeElement = document.createElement('div');
    // timeElement.classList.add('message-time');
    // timeElement.textContent = new Date().toLocaleTimeString();
    
    // if(senderElement) {
    //   messageElement.appendChild(senderElement);
    // }
    // messageElement.appendChild(textElement);
    // messageElement.appendChild(timeElement);

    this.chatContainer!.appendChild(messageElement);
    this.scrollToBottom();
//     description
// : 
// "YouTube에서 마음에 드는 동영상과 음악을 감상하고, 직접 만든 콘텐츠를 업로드하여 친구, 가족뿐 아니라 전 세계 사람들과 콘텐츠를 공유할 수 있습니다."
// domain
// : 
// "youtube.com"
// image
// : 
// "https://www.youtube.com/img/desktop/yt_1200.png"
// title
// : 
// "YouTube"
  }

  private scrollToBottom() {
    this.chatContainer!.scrollTop = this.chatContainer!.scrollHeight;
  }

  public clear() {
    this.chatContainer!.innerHTML = '';
  }

  public dispose() {
    this.parent.removeChild(this.chatContainer!);
  }
}