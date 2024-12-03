import { EventBus } from "../EventBus";

interface WeaponConfig {
  scene: Phaser.Scene;
  type: string;
  ammo: number;
  fireRate: number;
  damage: number;
}

export class Weapon {
  private scene: Phaser.Scene;
  private type: string;
  private ammo: number;
  private fireRate: number;
  private damage: number;
  private lastFired: number = 0;

  constructor(config: WeaponConfig) {
    this.scene = config.scene;
    this.type = config.type;
    this.ammo = config.ammo;
    this.fireRate = config.fireRate;
    this.damage = config.damage;
  }

  public fire(target: Phaser.Math.Vector2): void {
    const currentTime = this.scene.time.now;

    if (currentTime - this.lastFired < this.fireRate || this.ammo <= 0) {
      return; // Prevent firing if not enough time has passed or no ammo
    }

    this.lastFired = currentTime;
    this.ammo--;

    // Emit an event to create a projectile
    EventBus.emit("fire-weapon", {
      type: this.type,
      target,
      damage: this.damage,
    });

    // Play firing sound
    this.scene.sound.play(`${this.type}-fire`);
  }

  public reload(amount: number): void {
    this.ammo += amount;
    this.scene.sound.play("reload");
  }

  public getAmmo(): number {
    return this.ammo;
  }

  public getType(): string {
    return this.type;
  }
}
