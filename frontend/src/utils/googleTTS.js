export const languageCodes = {
  'en-IN': 'en',
  'hi-IN': 'hi',
  'kn-IN': 'kn',
  'ta-IN': 'ta',
  'te-IN': 'te',
  'ml-IN': 'ml'
};

const splitText = (text, maxLength = 180) => {
  const parts = [];
  for (let i = 0; i < text.length; i += maxLength) {
    parts.push(text.substring(i, i + maxLength));
  }
  return parts;
};

export const playGoogleTTS = (text, lang = 'en') => {
  if (!text) return Promise.reject('No text provided');

  const parts = splitText(text);
  let currentIndex = 0;

  return new Promise((resolve, reject) => {
    const playNext = () => {
      if (currentIndex >= parts.length) {
        resolve();
        return;
      }

      const encodedText = encodeURIComponent(parts[currentIndex]);
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${lang}&client=tw-ob`;

      const audio = new Audio(url);

      audio.onerror = () => {
        console.error('Failed to load TTS audio');
        reject('TTS audio load failed');
      };

      audio.onended = () => {
        currentIndex++;
        playNext();
      };

      audio.play().catch((err) => {
        console.error('Speech playback failed:', err);
        reject(err);
      });
    };

    playNext();
  });
};
