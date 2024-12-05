import { GameSoundKey } from "../types";

export class SoundManager {
  private scene: Phaser.Scene;
  private sounds: Map<string, Phaser.Sound.BaseSound>;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.sounds = new Map();

    // Initialize common game sounds
    this.initializeSounds();
  }

  private initializeSounds(): void {
    // Weapon sounds
    // Weapon sounds
    this.sounds.set(
      "deagle-cock",
      this.scene.sound.add("deagle-cock", { volume: 0.5 })
    );
    this.sounds.set(
      "deagle-fire",
      this.scene.sound.add("deagle-fire", { volume: 0.5 })
    );
    this.sounds.set(
      "rpg-fire",
      this.scene.sound.add("rpg-fire", { volume: 0.5 })
    );
    this.sounds.set(
      "railgun-fire",
      this.scene.sound.add("railgun-fire", { volume: 0.5 })
    );
    this.sounds.set(
      "railgun-fire2",
      this.scene.sound.add("railgun-fire2", { volume: 0.5 })
    );
    this.sounds.set(
      "raygun-fire",
      this.scene.sound.add("raygun-fire", { volume: 0.5 })
    );

    // Impact sounds
    this.sounds.set(
      "explode",
      this.scene.sound.add("explode", { volume: 0.5 })
    );
    this.sounds.set(
      "railgun-explode",
      this.scene.sound.add("railgun-explode", { volume: 0.5 })
    );
    this.sounds.set(
      "raygun-impact",
      this.scene.sound.add("raygun-impact", { volume: 0.5 })
    );
    this.sounds.set(
      "fire-bomb-impact",
      this.scene.sound.add("fire-bomb-impact", { volume: 0.5 })
    );

    // Character sounds
    this.sounds.set("death", this.scene.sound.add("death", { volume: 0.5 }));
    this.sounds.set("grunt", this.scene.sound.add("grunt", { volume: 0.5 }));
    this.sounds.set("ouch", this.scene.sound.add("ouch", { volume: 0.5 }));
    this.sounds.set("thump", this.scene.sound.add("thump", { volume: 0.5 }));

    // UI sounds
    this.sounds.set("click", this.scene.sound.add("click", { volume: 0.5 }));
    this.sounds.set(
      "click-deny",
      this.scene.sound.add("click-deny", { volume: 0.5 })
    );
    this.sounds.set(
      "page-turn",
      this.scene.sound.add("page-turn", { volume: 0.5 })
    );

    // Special weapon sounds
    this.sounds.set(
      "railgun-charge",
      this.scene.sound.add("railgun-charge", { volume: 0.5 })
    );
    this.sounds.set(
      "railgun-power",
      this.scene.sound.add("railgun-power", { volume: 0.5 })
    );
    this.sounds.set(
      "fire-bomb-fire",
      this.scene.sound.add("fire-bomb-fire", { volume: 0.5 })
    );
  }
  public play(soundKey: GameSoundKey): void {
    const sound = this.sounds.get(soundKey);
    if (sound) {
      sound.play();
    } else {
      console.warn(`Sound ${soundKey} not found`);
    }
  }

  public stop(soundKey: GameSoundKey): void {
    const sound = this.sounds.get(soundKey);
    if (sound) {
      sound.stop();
    }
  }

  public stopAll(): void {
    this.sounds.forEach((sound) => sound.stop());
  }
}
