// utils/speechSynthesis.js
export const speakText = (text) => {
  return new Promise((resolve, reject) => {
    if (!text) {
      reject("No text provided");
      return;
    }

    if ("speechSynthesis" in window) {
      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);

      // Configure utterance
      utterance.lang = "en-US";
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Optional - select a voice if available
      // const voices = window.speechSynthesis.getVoices();
      // if (voices.length > 0) {
      //   utterance.voice = voices.find(voice => voice.name === 'Google US English') || voices[0];
      // }

      // Handle events
      utterance.onend = () => {
        resolve();
      };

      utterance.onerror = (event) => {
        reject(`Speech synthesis error: ${event.error}`);
      };

      // Speak the utterance
      window.speechSynthesis.speak(utterance);
    } else {
      reject("Speech synthesis not supported in this browser");
    }
  });
};

export const getAvailableVoices = () => {
  if ("speechSynthesis" in window) {
    return window.speechSynthesis.getVoices();
  }
  return [];
};
