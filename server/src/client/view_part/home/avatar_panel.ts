import { EventEmitter } from "events";
import "./avatar_panel.css";
import { VRMAvatar } from "../../util/avatar/vrm_avatar";

function splitFileExtension(filename: string): [string, string] {
  const lastDotIndex = filename.lastIndexOf(".");
  if (lastDotIndex === -1) {
    return [filename, ""];
  }
  const name = filename.slice(0, lastDotIndex);
  const extension = filename.slice(lastDotIndex);
  return [name, extension];
}

export class AvatarPanel extends EventEmitter {
  element?: HTMLDivElement;
  avatar?: VRMAvatar;
  currentSlide: number = 0;
  totalSlides: number = 0;
  selectAvatarUrl: string | null = null;

  constructor(private parent: HTMLElement, public files: string[]) {
    super();
    // this.init();
    console.log(this.files);
  }

  showSlide(index: number) {
    console.log(index);
    // slider.style.transform = `translateX(-${index * 100}%)`;
    const slider = document.querySelector('.slider') as HTMLDivElement;
    console.assert(slider);
    // const offset = -index * 100;
    // slider.style.transform = `translateX(-${index * 100}%)`;
    // slider.style.transform = `translateX(${offset}%)`;
    // slider.style.transform = `translateX(-${index * 100}%)`;
    const offset = -index * 200; // Adjust based on slide width
    slider.style.transform = `translateX(${offset}px)`;
  }

  // function updateSlider() {
  //   const offset = -currentIndex * 100;
  //   slider.style.transform = `translateX(${offset}%)`;
  // }

  async init() {
    
    try {
      this.element = document.createElement("div") as HTMLDivElement;
      this.element.className = "avatar-panel";
  
      const sliderContainer = document.createElement('div') as HTMLDivElement;
      let slider: HTMLDivElement | null = null;
      if(sliderContainer) {
        sliderContainer.className = "slider-container";
        slider = document.createElement('div') as HTMLDivElement;
        if(slider) {
          slider.className = "slider";
          sliderContainer.appendChild(slider);
        }

        const previousButton = document.createElement('button') as HTMLButtonElement;
        previousButton.className = "prev-button";
        previousButton.innerText = "Previous";
        previousButton.addEventListener('click', () => {
          // this.currentSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
          this.currentSlide = (this.currentSlide > 0) ? this.currentSlide - 1 : this.totalSlides - 1; // Go to the previous slide
          this.showSlide(this.currentSlide);
        });
        
        const nextButton = document.createElement('button') as HTMLButtonElement;
        nextButton.className = "next-button";
        nextButton.innerText = "Next";
        nextButton.addEventListener('click', () => {
          // this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
          this.currentSlide = (this.currentSlide < this.totalSlides - 1) ? this.currentSlide + 1 : 0; 
          this.showSlide(this.currentSlide);
        });


        sliderContainer.appendChild(previousButton);
        sliderContainer.appendChild(nextButton);

        // const 
        
        this.element.appendChild(sliderContainer);
      }


      // console.log(files);
      // assumption. png - vrm
      // validation check
      // it should filename.png : filename.vrm
      const files = this.files;
      for (let i = 0; i < files.length; i += 2) {
        console.log(`${files[i]} : ${files[i + 1]}`);
        // check 1
        // if(!files[i].endsWith('.png')) {
        //   console.error(`not png ${files[i]}`);
        // }
  
        // if(!files[i+1].endsWith('.vrm')) {
        //   console.error(`not vrm ${files[i]}`);
        // }
  
        const [name, ext] = splitFileExtension(files[i]);
        const [name1, ext1] = splitFileExtension(files[i+1]);
  
        if (ext !== ".png" && ext !== ".svg") {
          console.error(`not png ${files[i]}`);
        }
  

        if (ext1 !== ".vrm") {
          console.error(`not vrm ${files[i+1]} ${ext1}`);
        }
  
        if (name !== name1) {
          console.error(`${name} !== ${name1}`);
        }

        const slide = document.createElement('div') as HTMLDivElement;
        if(slider) {
          slide.addEventListener('click', (event) => {
            console.log(`click! ${files[i+1]}`)
            this.selectAvatarUrl = files[i+1];
            console.log(`select avatar URL: ${this.selectAvatarUrl}`);

            // mark selected
            const slides = document.querySelectorAll('.slide');
            slides.forEach(slide => slide.classList.remove('selected'));
            const clickedSlide = event.currentTarget as HTMLDivElement;
            console.assert(clickedSlide);
            if(clickedSlide) {
              clickedSlide.classList.add('selected');
            }
          });
          slide.className = "slide"
          if(i == 0) {
            slide.classList.add('selected');
          }

          const img = document.createElement("img") as HTMLImageElement;
          img.src = files[i];
          // img.setAttribute("alt", "Description of the image");
          // img.style.border = "1px solid gray";
          // img.style.borderRadius = "20px";
          // img.className = "slide"
          
          
          // this.element.appendChild(img);
          console.assert(slider);
          slide?.appendChild(img);
          
          slider.appendChild(slide);
          this.totalSlides++;
        }
        
        // this.element.addEventListener('click', this.onclick.bind(this), false);
      }

      // document.getElementsByClassName("start-panel")[0]?.appendChild(img);
  
  
      // const avatarUrl = files[1];
      // const avatar = new VRMAvatar();
      // await avatar.init(avatarUrl);

      this.parent.appendChild(this.element!);

      if(files.length > 0) {
        this.selectAvatarUrl = files[1];
        console.log(`default avatar URL: ${this.selectAvatarUrl}`);
      }
      // return avatar;
    }
    catch(e) {
      console.error(e);
    }
    

    // // Create and add the title
    // this.title = document.createElement('h1');
    // this.title.className = 'start-title';
    // this.title.textContent = title;
    // this.element.appendChild(this.title);

    // // Create and add the button
    // this.button = document.createElement('button');
    // this.button.textContent = 'Start';
    // this.button.className = 'start-button';
    // this.element.appendChild(this.button);

    // // Add click event listener to the button
    // this.button.addEventListener('click', () => {
    //   this.emit('start');
    // });

    
    // getLocation
  }

  onclick(e: Event) {
    e.preventDefault();
    e.stopPropagation();

    console.log('onclick')
    // TODO: open overlay
  }

  public dispose(): void {
    if (this.element) {
      // Remove the click event listener
      //   this.button?.removeEventListener('click', () => {
      //     this.emit('start');
      //   });
      this.element.remove();
      // this.parent.removeChild(this.element);
    }
  }
}
