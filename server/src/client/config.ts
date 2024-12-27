const server = 'https://janus.toktoktalk.com/janus'
const iceServer: RTCIceServer = {
  urls: 'stun:stun.l.google.com:19302'
};

const PORT = process.env.PORT || 30100;
const apiServer =
  process.env.NODE_ENV === "development"
    ? `http://localhost:${PORT}`
    : "https://toktoktalk.com";
    

function isDebug(): boolean {
  // Get the full query string
  const queryString = window.location.search;

  // Create a URLSearchParams object
  const urlParams = new URLSearchParams(queryString);

  // Get a specific parameter value
  const paramValue = urlParams.get('debug');

  if(paramValue == 'true') {
    return true;
  }

  return false;
}

function isKorean(): boolean {
  const userLanguage = navigator.language || (navigator as any).userLanguage;
  return userLanguage === 'ko-KR';
}

export { server, iceServer, apiServer, isDebug, isKorean }
