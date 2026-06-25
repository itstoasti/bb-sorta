import { Audio } from 'expo-av';

const SOUNDS = {
  slurp: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav', // suction / slurp type click
  pour: 'https://assets.mixkit.co/active_storage/sfx/2192/2192-84.wav',   // bubbly liquid sound
  win: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav',    // clean chime / win sound
  click: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-84.wav',  // soft tap click
};

class AudioController {
  private enabled: boolean = true;
  private soundObjects: Record<string, Audio.Sound> = {};
  private loading: Record<string, boolean> = {};

  constructor() {
    // Enable audio playback in silent mode on iOS
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    }).catch(err => console.warn('Failed to set audio mode:', err));
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Preloads all sounds to ensure low-latency playback.
   */
  public async preloadAll() {
    for (const [key, url] of Object.entries(SOUNDS)) {
      await this.preloadSound(key, url);
    }
  }

  private async preloadSound(key: string, url: string): Promise<Audio.Sound | null> {
    if (this.soundObjects[key]) return this.soundObjects[key];
    if (this.loading[key]) return null;

    this.loading[key] = true;
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: false, volume: 1.0 }
      );
      this.soundObjects[key] = sound;
      this.loading[key] = false;
      return sound;
    } catch (error) {
      console.warn(`Failed to preload sound: ${key}`, error);
      this.loading[key] = false;
      return null;
    }
  }

  /**
   * Plays a preloaded sound, or loads it dynamically if not cached.
   */
  public async play(key: keyof typeof SOUNDS) {
    if (!this.enabled) return;

    try {
      let sound = this.soundObjects[key];
      if (!sound) {
        sound = await this.preloadSound(key, SOUNDS[key]) as Audio.Sound;
      }

      if (sound) {
        // Reset rate to normal
        await sound.setStatusAsync({ rate: 1.0, shouldCorrectPitch: true });
        // Re-play from beginning
        await sound.setPositionAsync(0);
        await sound.playAsync();
      }
    } catch (error) {
      console.warn(`Error playing sound: ${key}`, error);
    }
  }

  /**
   * Plays a sound with a custom pitch/playback rate.
   */
  public async playWithPitch(key: keyof typeof SOUNDS, rate: number) {
    if (!this.enabled) return;

    try {
      let sound = this.soundObjects[key];
      if (!sound) {
        sound = await this.preloadSound(key, SOUNDS[key]) as Audio.Sound;
      }

      if (sound) {
        // Re-play from beginning
        await sound.setPositionAsync(0);
        // Set rate (play speed) and turn off pitch correction so pitch rises
        await sound.setStatusAsync({ 
          rate: Math.min(2.0, Math.max(0.5, rate)), 
          shouldCorrectPitch: false 
        });
        await sound.playAsync();
      }
    } catch (error) {
      console.warn(`Error playing sound with pitch: ${key}`, error);
    }
  }

  /**
   * Clean up resources when done.
   */
  public async unloadAll() {
    for (const key of Object.keys(this.soundObjects)) {
      try {
        await this.soundObjects[key].unloadAsync();
      } catch (error) {
        console.warn(`Failed to unload sound: ${key}`, error);
      }
    }
    this.soundObjects = {};
  }
}

export const audioController = new AudioController();
