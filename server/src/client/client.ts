import { App } from './app'
import { startDataChannel, stopDataChannel, sendMessage, startAudioChannel, stopAudioChannel, startVideoChannel, stopVideoChannel } from './interface';


document.addEventListener("touchmove", function (e) {
  if (e.changedTouches[0].pageY < 0) {
    e.preventDefault();
    document.dispatchEvent(new Event('touchend'))
  }
})

// function handleViewportChange() {
//   if(window.visualViewport) {
//     const viewportHeight = window.visualViewport?.height;
//     document.documentElement.style.setProperty('--viewport-height', `${viewportHeight}px`);
//   }
// }

// window.visualViewport?.addEventListener('resize', handleViewportChange);



// if ("serviceWorker" in navigator) {
//   window.addEventListener("load", function() {
//     navigator.serviceWorker
//       .register("/service-worker.js")
//       .then(res => console.log(`service worker registered ${res}`))
//       .catch(err => console.log("service worker not registered", err))
//   })
// }

// remove service-worker
// navigator.serviceWorker.getRegistrations().then(function(registrations) {
//   for(let registration of registrations) {
//    registration.unregister()
// }})

// <body data-page="sub"> in sub.html
const page = document.body.dataset.page;
if (page !== 'sub') {
  const app = new App()
  app.init()
  // animate()
  
  function animate() {
    requestAnimationFrame(animate)
    app.update()
  }
}
else {
  // for test
  console.log('sub module for webrtc. It will export startDataChannel, stopDataChannel, sendMessage, startAudioChannel, stopAudioChannel, startVideoChannel, stopVideoChannel')
}

export { startDataChannel, stopDataChannel, sendMessage, startAudioChannel, stopAudioChannel, startVideoChannel, stopVideoChannel };
