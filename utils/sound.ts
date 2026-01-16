// Simple Sound Utility using HTML5 Audio
export const SOUNDS = {
  CLICK: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Pop click
  DICE_ROLL: 'https://assets.dpsteam.xyz/gridx-assets/dice.mp3', // Updated Dice
  MOVE: 'https://assets.dpsteam.xyz/gridx-assets/tick.mp3', // Updated Tick Sound
  BUILD: 'https://assets.mixkit.co/active_storage/sfx/95/95-preview.mp3', // Construction/Hammer sound
  
  // New Sounds
  NOTICE: 'https://assets.dpsteam.xyz/gridx-assets/notice.mp3', // Other player action
  GET_MONEY: 'https://assets.dpsteam.xyz/gridx-assets/getmoney2.mp3', // Gain money
  POPUP: 'https://assets.dpsteam.xyz/gridx-assets/popup.mp3', // Modal Open
  BANKRUPT: 'https://assets.dpsteam.xyz/gridx-assets/bell.mp3', // Bankruptcy bell

  PAY_TOLL: 'https://assets.mixkit.co/active_storage/sfx/228/228-preview.mp3', // Coin drop (paying)
  TURN_START: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // My turn notification
  ERROR: 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3', // Error beep
};

const audioCache: Record<string, HTMLAudioElement> = {};

// Preload sounds
Object.values(SOUNDS).forEach(url => {
    const audio = new Audio(url);
    audio.load();
});

export const playSound = (soundName: keyof typeof SOUNDS) => {
  try {
    const url = SOUNDS[soundName];
    // Always create new audio for overlapping sounds (essential for rapid movement steps)
    const audio = new Audio(url);
    
    // Adjust volume: Tick sound should be subtle as it plays frequently
    if (soundName === 'MOVE') {
        audio.volume = 0.3; 
    } else {
        audio.volume = 0.5;
    }

    audio.play().catch(e => {
      // Ignore autoplay policy errors usually happen if no user interaction yet
      console.warn("Audio play failed", e);
    });
  } catch (error) {
    console.error("Audio error", error);
  }
};