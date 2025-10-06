/**
 * Sound Alert System for Incidents
 * Plays audio alerts based on severity
 */

class SoundAlertManager {
  constructor() {
    this.sounds = {
      critical: null,
      high: null,
      medium: null,
      low: null,
      comment: null,
    };
    this.enabled = true;
    this.volume = 0.5;
    
    // Load settings from localStorage
    this.loadSettings();
  }

  loadSettings() {
    try {
      const settings = localStorage.getItem('soundAlertSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        this.enabled = parsed.enabled !== undefined ? parsed.enabled : true;
        this.volume = parsed.volume !== undefined ? parsed.volume : 0.5;
      }
    } catch (error) {
      console.error('Error loading sound settings:', error);
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('soundAlertSettings', JSON.stringify({
        enabled: this.enabled,
        volume: this.volume
      }));
    } catch (error) {
      console.error('Error saving sound settings:', error);
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.saveSettings();
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }

  /**
   * Play alert sound based on severity
   * For now, uses Web Audio API to generate beeps
   * Can be replaced with actual audio files later
   */
  playAlert(severity = 'medium') {
    if (!this.enabled) return;

    try {
      // Use Web Audio API to generate beeps
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Set frequency based on severity
      const frequencies = {
        critical: [800, 1000, 800, 1000], // Alternating high-pitched
        high: [600, 800],                  // Two tones
        medium: [500],                     // Single tone
        low: [400],                        // Lower tone
        comment: [300]                     // Very low tone
      };

      const freq = frequencies[severity?.toLowerCase()] || frequencies.medium;
      
      gainNode.gain.setValueAtTime(this.volume, audioContext.currentTime);
      
      let time = audioContext.currentTime;
      freq.forEach((f, index) => {
        oscillator.frequency.setValueAtTime(f, time);
        gainNode.gain.setValueAtTime(this.volume, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
        time += 0.2;
      });

      oscillator.start(audioContext.currentTime);
      oscillator.stop(time);

      // Cleanup
      oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();
      };

    } catch (error) {
      console.error('Error playing alert sound:', error);
    }
  }

  /**
   * Play alert for incident
   */
  playIncidentAlert(incident) {
    const severity = incident.severity?.toLowerCase() || 'medium';
    this.playAlert(severity);
  }

  /**
   * Play alert for comment
   */
  playCommentAlert() {
    this.playAlert('comment');
  }

  /**
   * Test sound
   */
  test(severity = 'medium') {
    this.playAlert(severity);
  }
}

// Singleton instance
const soundAlertManager = new SoundAlertManager();

export default soundAlertManager;

// Export functions for easy use
export const playIncidentAlert = (incident) => soundAlertManager.playIncidentAlert(incident);
export const playCommentAlert = () => soundAlertManager.playCommentAlert();
export const enableSounds = (enabled) => soundAlertManager.setEnabled(enabled);
export const setSoundVolume = (volume) => soundAlertManager.setVolume(volume);
export const testSound = (severity) => soundAlertManager.test(severity);
