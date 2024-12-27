import './dialog.css';

export class Dialog {
  constructor(str: string) {
    console.log('Dialog')
    this.buildStructure(str);
  }

  private buildStructure(str: string) {
    console.log('buildStructure');
    let dialog = document.createElement('dialog') as HTMLDialogElement
    dialog.id = 'dialog';
    dialog.innerHTML = `
      <h2>Notice</h2>
      <p>${str}</p>
      <div class="dialog-buttons">
        <button id="cancelBtn">Cancel</button>
        <button id="acceptBtn">Accept</button>
      </div>
    `;

    document.body.appendChild(dialog);
  }

  show(): Promise<boolean> {
    return new Promise((res, rej) => {
      let dialog = document.getElementById('dialog') as HTMLDialogElement
      console.assert(dialog);
      if(!dialog) {
        rej('no dialog');
        return;
      }
      
      // const showDialogBtn = document.getElementById('showDialogBtn');
      const cancelBtn = document.getElementById('cancelBtn');
      const acceptBtn = document.getElementById('acceptBtn');
  
      if(!cancelBtn || !acceptBtn) {
        console.assert(cancelBtn);
        console.assert(acceptBtn);
        return;
      }
  
  
  
    cancelBtn.addEventListener('click', () => {
      dialog.close('Cancel');
      res(false);
    });
  
    acceptBtn.addEventListener('click', () => {
      dialog.close('Accept');
      res(true);
    });
  
    dialog.addEventListener('close', () => {
      if (dialog.returnValue === 'Accept') {
        console.log('스피커가 활성화되었습니다.');
        // 여기에 스피커를 활성화하는 로직을 추가하세요
      }
      else {
        console.log('스피커 활성화가 취소되었습니다.');
      }
    });
      dialog.showModal();  
    })
  }

  dispose() {
    let dialog = document.getElementById('dialog') as HTMLDialogElement
    console.assert(dialog);
    if(!dialog) {
      return;
    }

    dialog.remove();
  }
}
