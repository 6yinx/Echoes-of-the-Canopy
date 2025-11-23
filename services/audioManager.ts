
// Audio has been removed as per user request.
// Keeping a stub to ensure any missed imports do not crash the app, though all should be removed.

class AudioManager {
  init() {}
  resume() {}
  startAmbience() {}
  playFootstep(isSprinting: boolean) {}
  playPickup() {}
  playThrow() {}
  playAttack() {}
  playEat() {}
}

export const audioManager = new AudioManager();
