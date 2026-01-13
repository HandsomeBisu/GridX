// Simple Sound Utility using HTML5 Audio
// In a real production app, you would host these files on a CDN or in the public folder.
// Using short generic sound URLs for demonstration.

export const SOUNDS = {
  CLICK: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Pop click
  DICE_ROLL: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3', // Rolling
  MOVE: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3', // Short tick
  BUILD: 'https://assets.mixkit.co/active_storage/sfx/95/95-preview.mp3', // Cash register/Coin
  PAY_TOLL: 'https://assets.mixkit.co/active_storage/sfx/228/228-preview.mp3', // Coin drop
  TURN_START: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // Notification
  ERROR: 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3', // Error beep
};

export const playSound = (soundName: keyof typeof SOUNDS) => {
  try {
    const audio = new Audio(SOUNDS[soundName]);
    audio.volume = 0.5;
    audio.play().catch(e => {
      // Ignore autoplay policy errors usually happen if no user interaction yet
      console.warn("Audio play failed", e);
    });
  } catch (error) {
    console.error("Audio error", error);
  }
};