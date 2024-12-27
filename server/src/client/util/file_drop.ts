import { EventEmitter } from 'events'

function preventDefaults(e: Event | DragEvent | MouseEvent): void {
  e.preventDefault();
  e.stopPropagation();
}

export class FileDrop extends EventEmitter {
  
  constructor(public element: HTMLDivElement) {
    super();

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event_name => {
      this.element.addEventListener(event_name, preventDefaults as EventListener, false);
      document.body.addEventListener(event_name, preventDefaults as EventListener, false)
    });

    // ['dragenter', 'dragover'].forEach(event_name => {
    //   this.dom.addEventListener(event_name, (e) => {this.highlight(e)}, false)
    // });
    
    // ['dragleave', 'drop'].forEach(event_name => {
    //   this.dom.addEventListener(event_name, (e) => {this.unhighlight(e)}, false)
    // });

    this.element.addEventListener('drop', this.onFileDrop.bind(this), false)
  }

  private onFileDrop(e: DragEvent): void {
    e.preventDefault();
    const dt = e.dataTransfer;
    if (dt) {
      const files = dt.files;
      this.handleFiles(files);
    }
  }

  // private highlight(e: Event) {
  //   // this.dom.classList.add('highlight');
  // }

  // private unhighlight(e: Event) {
  //   // this.dom.classList.remove('highlight');
  // }

  private handleFiles(files: FileList): void {
    Array.from(files).forEach((file: File) => {
      console.log(file)
    })

    // model/vrml
    // const mediaFiles = Array.from(files).filter(file => 
    //   file.type.startsWith('model/') || 
    //   file.type.startsWith('audio/') || 
    //   file.type.startsWith('video/') || 
    //   file.type.startsWith('image/')
    // );
    const mediaFiles = Array.from(files);

    this.emit('onfiledrop', mediaFiles)

    // console.log(mediaFiles)
  }


  dispose() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event_name => {
      if(this.element) this.element.removeEventListener(event_name, preventDefaults);
      document.body.removeEventListener(event_name, preventDefaults);
    });
    this.element.removeEventListener('drop', this.onFileDrop);
  }
}
