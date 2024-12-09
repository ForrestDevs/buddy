import { EventBus } from "../EventBus";
import { Character } from "./Character";
import { GameWeaponKey, SpecialWeaponKey } from "../types";
import { Effects, EffectType } from "./Effects";
import { InputState } from "./InputState";
import { Events } from "phaser";

interface WeaponConfig {
  texture: string;
  width: number;
  height: number;
  name: string;
  fireRate: number;
  burstSize: number;
  burstDelay?: number;
  fireSound?: string[];
  impactSound?: string[];
  animationKey?: string;
  damage: number;
  isThrowable: boolean;
  specialCase: boolean;
  projectileSpeed?: number;
  projectileScale?: { x: number; y: number };
  projectileDisplaySize?: { width: number; height: number };
  projectileTexture?: string;
  projectileConfig?: {
    shape: { type: string; radius: number };
    angularVelocity: number;
    label: string;
  };
}

//TODO: Make sure to remove the joints for sticky bombs working on it

export class Weapon {
  private flipX = false;
  private flipY = false;
  private isOvercharged: boolean = false;
  private inputState: InputState;
  private scene: Phaser.Scene;
  private character: Character;
  private effects: Effects;
  private currentWeapon?: Phaser.GameObjects.Sprite;
  private weapon?: GameWeaponKey;
  private firingTimer?: Phaser.Time.TimerEvent;
  private barrelPoint: Phaser.Math.Vector2;
  private stickyBombNumber = 0;

  private chargeStartTime?: number;
  private isCharging: boolean = false;
  private triggerHoldStartTime?: number;
  private static readonly TRIGGER_DELAY = 100; // 100ms hold requirement before firing
  private debugGraphics?: Phaser.GameObjects.Graphics;

  // Add to class properties
  private static readonly FLAMETHROWER_CONFIG = {
    offsetX: 350, // Adjust these values based on your texture
    offsetY: 175,
    damageRadius: 50,
    damageInterval: 100, // How often to apply damage in ms
    damagePerTick: 1, // How much damage per tick
  };

  private lastFlameDamageTime: number = 0;

  private readonly RAILGUN_CONFIG = {
    minChargeTime: 500, // 0.5 seconds minimum charge
    maxChargeTime: 3000, // 2 seconds before overcharge
    overchargeDelay: 1000, // 1 seconds penalty for overcharging
    holdSound: "railgun-hold",
    chargeSound: "railgun-charge",
    fireSound: "railgun-fire2",
    overchargeSound: "railgun-explode",
  };

  private static readonly WEAPON_CONFIGS: Record<GameWeaponKey, WeaponConfig> =
    {
      knife: {
        texture: "knife",
        width: 120,
        height: 80,
        name: "knife",
        fireSound: ["throwknife-fire"],
        impactSound: ["throwknife-impact"],
        fireRate: 500,
        burstSize: 1,
        damage: 0.4,
        isThrowable: true,
        specialCase: false,
        projectileSpeed: 40,
        projectileDisplaySize: { width: 120, height: 80 },
        projectileTexture: "knife",
      },
      deagle: {
        texture: "deaglefiring_00018",
        width: 200,
        height: 100,
        name: "deagle",
        fireRate: 500,
        burstSize: 1,
        fireSound: ["deagle-fire", "deagle-cock"],
        animationKey: "deagleFire",
        damage: 0.5,
        isThrowable: false,
        specialCase: false,
        projectileSpeed: 75,
        projectileScale: { x: 0.06, y: 0.1 },
        projectileTexture: "deagle-bullet",
      },
      grenade: {
        texture: "grenade",
        width: 100,
        height: 80,
        name: "grenade",
        fireRate: 1000,
        burstSize: 1,
        fireSound: ["grenade-fire"],
        damage: 0.8,
        isThrowable: true,
        specialCase: false,
        projectileSpeed: 25,
        projectileDisplaySize: { width: 100, height: 80 },
        projectileTexture: "grenade",
        projectileConfig: {
          shape: { type: "circle", radius: 15 },
          angularVelocity: 0.2, // Increased rotation speed
          label: "grenade", // Used to identify projectile type in collision
        },
      },
      tommy: {
        texture: "tommy",
        width: 300,
        height: 150,
        name: "tommy",
        fireRate: 60,
        burstSize: 4,
        burstDelay: 400,
        fireSound: ["tommy-fire"],
        animationKey: "tommyFire",
        damage: 0.3,
        isThrowable: false,
        specialCase: false,
        projectileSpeed: 50,
        projectileScale: { x: 0.04, y: 0.08 },
        projectileTexture: "tommy-bullet",
      },
      "sticky-bomb": {
        texture: "sticky-bomb",
        width: 200,
        height: 100,
        name: "sticky-bomb",
        fireRate: 1000,
        burstSize: 1,
        fireSound: ["throwknife-fire"],
        impactSound: ["sticky-bomb-impact"],
        damage: 0.7,
        isThrowable: true,
        specialCase: false,
        projectileSpeed: 25,
        projectileDisplaySize: { width: 200, height: 100 },
        projectileTexture: "sticky-bomb",
        projectileConfig: {
          shape: { type: "circle", radius: 15 },
          angularVelocity: 0.2, // Increased rotation speed
          label: "sticky-bomb", // Used to identify projectile type in collision
        },
      },
      chainsaw: {
        texture: "chainsaw",
        width: 300,
        height: 150,
        name: "chainsaw",
        fireRate: 100,
        burstSize: 1,
        fireSound: ["chainsaw-fire"],
        animationKey: "chainsawFire",
        damage: 0.3,
        isThrowable: false,
        specialCase: true,
      },
      rpg: {
        texture: "rpg",
        width: 350,
        height: 200,
        name: "rpg",
        fireRate: 1000,
        burstSize: 1,
        fireSound: ["rpg-fire"],
        animationKey: "rpgFire",
        damage: 1.0,
        isThrowable: false,
        specialCase: false,
        projectileSpeed: 50,
        projectileScale: { x: 0.25, y: 0.25 },
        projectileTexture: "rpg-bullet",
      },
      mg: {
        texture: "mg",
        width: 350,
        height: 200,
        name: "mg",
        fireRate: 100,
        burstSize: 1,
        fireSound: ["mg-fire"],
        animationKey: "mgFire",
        damage: 0.4,
        isThrowable: false,
        specialCase: false,
        projectileSpeed: 50,
        projectileScale: { x: 0.08, y: 0.08 },
        projectileTexture: "mg-bullet",
      },
      "fire-bomb": {
        texture: "fire-bomb",
        width: 170,
        height: 70,
        name: "fire-bomb",
        fireRate: 1000,
        burstSize: 1,
        fireSound: ["fire-bomb-fire"],
        impactSound: ["fire-bomb-impact"],
        damage: 0.6,
        isThrowable: true,
        specialCase: false,
        projectileSpeed: 25,
        projectileDisplaySize: { width: 170, height: 70 },
        projectileTexture: "fire-bomb",
        projectileConfig: {
          shape: { type: "circle", radius: 15 },
          angularVelocity: 0.2, // Increased rotation speed
          label: "fire-bomb", // Used to identify projectile type in collision
        },
      },
      lightsaber: {
        texture: "lightsaber-unlit",
        width: 300,
        height: 150,
        name: "lightsaber",
        fireRate: 1000,
        burstSize: 1,
        damage: 0.5,
        isThrowable: false,
        specialCase: true,
      },
      railgun: {
        texture: "railgun",
        width: 300,
        height: 150,
        name: "railgun",
        fireRate: 1000,
        burstSize: 1,
        damage: 0.5,
        isThrowable: false,
        specialCase: true,
      },
      raygun: {
        texture: "raygun",
        width: 200,
        height: 100,
        name: "raygun",
        fireRate: 200,
        burstSize: 1,
        fireSound: ["raygun-fire"],
        impactSound: ["raygun-impact"],
        animationKey: "raygunFire",
        damage: 5,
        isThrowable: false,
        specialCase: false,
        projectileSpeed: 50,
        projectileScale: { x: 0.7, y: 0.7 },
        projectileTexture: "raygun-bullet",
      },
      dynamite: {
        texture: "dynamite",
        width: 80,
        height: 120,
        name: "dynamite",
        fireRate: 1000,
        burstSize: 1,
        fireSound: ["dynamite-fuze", "dynamite-flick"],
        animationKey: "dynamiteFire",
        damage: 0.7,
        isThrowable: true,
        specialCase: false,
        projectileSpeed: 25,
        projectileDisplaySize: { width: 80, height: 120 },
        projectileTexture: "dynamite",
        projectileConfig: {
          shape: { type: "circle", radius: 15 },
          angularVelocity: 0.2, // Increased rotation speed
          label: "dynamite", // Used to identify projectile type in collision
        },
      },
      katana: {
        texture: "katana",
        width: 300,
        height: 150,
        name: "katana",
        animationKey: "katanaFire",
        fireRate: 1000,
        burstSize: 1,
        damage: 0.5,
        isThrowable: false,
        specialCase: true,
      },
      kar98: {
        texture: "kar98",
        width: 350,
        height: 175,
        name: "kar98",
        animationKey: "kar98Fire",
        fireSound: ["kar98-fire", "kar98-cock"],
        fireRate: 1000,
        burstSize: 1,
        damage: 0.5,
        isThrowable: false,
        specialCase: false,
        projectileSpeed: 50,
        projectileScale: { x: 0.05, y: 0.05 },
        projectileTexture: "deagle-bullet",
      },
      flamethrower: {
        texture: "flamethrower",
        width: 700,
        height: 350,
        name: "flamethrower",
        fireRate: 1000,
        burstSize: 1,
        animationKey: "flamethrowerFire",
        damage: 0.5,
        isThrowable: false,
        specialCase: true,
      },
    };

  constructor(scene: Phaser.Scene, character: Character, effects: Effects) {
    this.scene = scene;
    this.character = character;
    this.effects = effects;
    this.inputState = InputState.getInstance();
    this.barrelPoint = new Phaser.Math.Vector2(0, 0);
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Add any event listeners needed
    EventBus.on("set-weapon", this.setWeapon, this);
    EventBus.on("stop-firing", this.stopFiring, this);
  }

  private getCurrentWeaponConfig(): WeaponConfig | undefined {
    return this.weapon ? Weapon.WEAPON_CONFIGS[this.weapon] : undefined;
  }

  private setWeapon(weapon: GameWeaponKey | undefined): void {
    // Remove and destroy current weapon
    if (this.currentWeapon) {
      this.currentWeapon.destroy();
      this.currentWeapon = undefined;
    }

    if (!weapon) {
      this.weapon = undefined;
      return;
    }

    const config = Weapon.WEAPON_CONFIGS[weapon];
    if (!config) return;

    this.weapon = weapon;
    this.currentWeapon = this.scene.add
      .sprite(0, 0, config.texture)
      .setDisplaySize(config.width, config.height)
      .setName(config.name)
      .removeFromDisplayList();
  }

  private railgunOvercharge(): void {
    if (this.isOvercharged) return;
    this.isOvercharged = true;

    this.scene.sound.stopByKey(this.RAILGUN_CONFIG.holdSound);

    // Play overcharge effects
    this.scene.sound.play(this.RAILGUN_CONFIG.overchargeSound);
    this.effects.playEffect(
      "explosion1",
      this.barrelPoint.x,
      this.barrelPoint.y
    );

    this.currentWeapon?.stop();

    // Hide the weapon
    if (this.currentWeapon?.getDisplayList()) {
      this.currentWeapon.removeFromDisplayList();
    }

    // Reset everything after delay
    this.scene.time.delayedCall(this.RAILGUN_CONFIG.overchargeDelay, () => {
      this.isOvercharged = false;
      this.isCharging = false;
      this.chargeStartTime = undefined;
      if (this.firingTimer) {
        this.firingTimer.destroy();
        this.firingTimer = undefined;
      }
    });
  }

  private updateRailgunCharge = (): void => {
    if (!this.chargeStartTime || this.isOvercharged) return;

    const currentTime = this.scene.time.now;
    const chargeTime = currentTime - this.chargeStartTime;

    // Visual feedback based on charge
    this.updateChargeEffect(chargeTime);

    // Check for overcharge
    if (chargeTime >= this.RAILGUN_CONFIG.maxChargeTime) {
      this.railgunOvercharge();
    }
  };

  private updateChargeEffect(chargeTime: number): void {
    // Calculate charge percentage from 0 to 1 over 3 seconds
    const chargePercent = Math.min(chargeTime / 3000, 1);

    // Update visual effects based on charge percentage
    if (this.currentWeapon) {
      // Start with white (no tint)
      if (chargePercent === 0) {
        this.currentWeapon.setTint(0xffffff);
      }
      // Gradually shift from white to red
      else {
        const intensity = Math.floor(255 * (1 - chargePercent));
        this.currentWeapon.setTint(
          Phaser.Display.Color.GetColor(255, intensity, intensity)
        );
      }
    }
  }

  private startRailgunCharge(): void {
    this.isCharging = true;
    this.chargeStartTime = this.scene.time.now;

    // Play charging sound
    this.scene.sound.play(this.RAILGUN_CONFIG.chargeSound);
    // Play charge animation
    this.currentWeapon?.play("railgunCharge");
    this.currentWeapon?.on("animationcomplete", () => {
      this.currentWeapon?.play("railgunHold");
      this.scene.sound.play(this.RAILGUN_CONFIG.holdSound, {
        volume: 0.5,
      });
      // this.scene.sound.stopByKey(this.RAILGUN_CONFIG.chargeSound);
    });

    // Start the charge timer
    this.firingTimer = this.scene.time.addEvent({
      delay: 16,
      callback: this.updateRailgunCharge,
      callbackScope: this,
      loop: true,
    });
  }

  private fireRailgun(chargeTime: number): void {
    // Calculate damage multiplier based on charge time
    const chargePercent = Math.min(
      (chargeTime - this.RAILGUN_CONFIG.minChargeTime) /
        (this.RAILGUN_CONFIG.maxChargeTime - this.RAILGUN_CONFIG.minChargeTime),
      1
    );

    const config = this.getCurrentWeaponConfig();
    if (!config) return;

    // Play fire animation and sound
    this.currentWeapon?.play("railgunFire");
    this.scene.sound.stopByKey(this.RAILGUN_CONFIG.holdSound);
    this.scene.sound.play(this.RAILGUN_CONFIG.fireSound);

    // Spawn projectile with increased damage based on charge
    // You'll need to modify your projectile spawning to handle the damage multiplier
    const baseDamage = config.damage;
    const chargedDamage = baseDamage * (1 + chargePercent);

    // TODO: Modify your projectile spawning to use chargedDamage
    this.spawnProjectile(config, chargedDamage);

    // Hide the weapon after firing
    if (this.currentWeapon?.getDisplayList()) {
      this.currentWeapon.removeFromDisplayList();
    }
  }

  private updateFlameDamage(): void {
    const currentTime = this.scene.time.now;

    // Check if enough time has passed since last damage
    if (
      currentTime - this.lastFlameDamageTime <
      Weapon.FLAMETHROWER_CONFIG.damageInterval
    ) {
      return;
    }

    if (!this.currentWeapon) return;
    EventBus.emit("health-changed", Weapon.FLAMETHROWER_CONFIG.damagePerTick);

    this.lastFlameDamageTime = currentTime;
  }

  public startFiring(): void {
    if (this.inputState.isLocked || this.isOvercharged) return;
    const config = this.getCurrentWeaponConfig();
    if (!config || !this.weapon) return;

    // Start tracking trigger hold time
    this.triggerHoldStartTime = this.scene.time.now;

    // Show current weapon if it exists but isn't displayed
    if (this.currentWeapon && !this.currentWeapon.getDisplayList()) {
      this.currentWeapon.addToDisplayList();
    }

    switch (this.weapon) {
      case "railgun":
        if (!this.isCharging) {
          this.startRailgunCharge();
        }
        break;
      case "lightsaber":
        this.currentWeapon?.play("lightsaberOpen");
        this.scene.sound.play("lightsaber-ignite");
        this.scene.sound.play("lightsaber-active", {
          loop: true,
        });
        break;

      case "chainsaw":
        this.currentWeapon?.play("chainsawFire");
        this.scene.sound.play("chainsaw-fire");
        break;

      case "flamethrower":
        if (!this.firingTimer) {
          this.currentWeapon?.play("flamethrowerFire");
          this.scene.sound.play("flamethrower-fire", { loop: true });

          // Start checking for flame damage
          this.firingTimer = this.scene.time.addEvent({
            delay: 16,
            callback: this.updateFlameDamage,
            callbackScope: this,
            loop: true,
          });
        }
        break;

      default: {
        // Clear any existing firing timer
        if (this.firingTimer) {
          this.firingTimer.destroy();
          this.firingTimer = undefined;
        }

        let lastFired = 0;
        let burstCount = 0;
        let canFire = true;

        const attemptFire = () => {
          const currentTime = this.scene.time.now;

          // Check if trigger has been held long enough
          if (
            !this.triggerHoldStartTime ||
            currentTime - this.triggerHoldStartTime < Weapon.TRIGGER_DELAY
          ) {
            return;
          }

          if (!this.scene.input.activePointer.isDown) {
            canFire = true;
            burstCount = 0;
            return;
          }

          // Only fire if enough time has passed and we can fire
          if (currentTime - lastFired >= config.fireRate && canFire) {
            this.fireWeapon(config);
            lastFired = currentTime;

            if (config.burstSize > 1) {
              burstCount++;
              if (burstCount >= config.burstSize) {
                canFire = false;
                burstCount = 0;
                this.scene.time.delayedCall(config.burstDelay || 300, () => {
                  canFire = true;
                });
              }
            }
          }
        };

        this.firingTimer = this.scene.time.addEvent({
          delay: 16,
          callback: attemptFire,
          loop: true,
        });
        break;
      }
    }
  }

  public stopFiring(): void {
    if (this.weapon === "flamethrower") {
      this.currentWeapon?.stop();
      this.scene.sound.stopByKey("flamethrower-fire");
    }

    if (this.firingTimer) {
      this.firingTimer.destroy();
      this.firingTimer = undefined;
    }

    // Don't allow stopping firing during overcharge
    if (this.isOvercharged) return;

    switch (this.weapon) {
      case "lightsaber":
        this.currentWeapon?.play("lightsaberClose");
        this.scene.sound.stopByKey("lightsaber-active");
        this.scene.sound.stopByKey("lightsaber-ignite");
        this.scene.sound.play("lightsaber-close");
        break;
      case "railgun":
        if (this.isCharging && this.chargeStartTime) {
          const chargeTime = this.scene.time.now - this.chargeStartTime;

          // Only fire if within valid charge window
          if (
            chargeTime >= this.RAILGUN_CONFIG.minChargeTime &&
            chargeTime < this.RAILGUN_CONFIG.maxChargeTime
          ) {
            this.fireRailgun(chargeTime);
          }

          // Reset charging state
          this.scene.sound.stopByKey(this.RAILGUN_CONFIG.chargeSound);
          this.currentWeapon?.setTint(0xffffff);
          this.isCharging = false;
          this.chargeStartTime = undefined;
          if (this.currentWeapon && this.currentWeapon.getDisplayList()) {
            this.currentWeapon.removeFromDisplayList();
          }
        }
        break;
      default:
        if (this.currentWeapon && this.currentWeapon.getDisplayList()) {
          this.currentWeapon.removeFromDisplayList();
        }
        const config = this.getCurrentWeaponConfig();
        if (config) {
          config.fireSound?.forEach((sound) => {
            this.scene.sound.stopByKey(sound);
          });
        }
        break;
    }

    return;
  }

  private debugDrawFlameArea(): void {
    if (!this.currentWeapon) return;

    // Get or create debug graphics
    if (!this.debugGraphics) {
      this.debugGraphics = this.scene.add.graphics();
    }

    // Clear previous frame
    this.debugGraphics.clear();

    // Draw flame area
    this.debugGraphics.lineStyle(2, 0xff0000, 1);
    this.debugGraphics.strokeCircle(
      this.barrelPoint.x,
      this.barrelPoint.y,
      Weapon.FLAMETHROWER_CONFIG.damageRadius
    );

    // Optionally draw barrel point
    this.debugGraphics.fillStyle(0x00ff00, 1);
    this.debugGraphics.fillCircle(this.barrelPoint.x, this.barrelPoint.y, 5);
  }

  public fireWeapon(config: WeaponConfig): void {
    if (config.specialCase) {
      switch (config.name as SpecialWeaponKey) {
        case "chainsaw":
          this.scene.sound.play("chainsaw-fire");
          this.currentWeapon?.play("chainsawFire");
          break;
        case "lightsaber":
          this.scene.sound.play("lightsaber-ignite");
          this.scene.sound.play("lightsaber-active");
          this.currentWeapon?.play("lightsaberOpen");
          break;
        case "katana":
          this.scene.sound.play("katana-pullout");
          this.scene.sound.play("katana-slash");
          break;
        case "flamethrower":
          this.currentWeapon?.play("flamethrowerFire");
          break;
        case "railgun":
          this.currentWeapon?.play("railgunFire");
          break;
        default:
          return;
      }
    } else {
      if (config.animationKey) {
        this.currentWeapon?.play(config.animationKey);
      }
      if (config.fireSound) {
        config.fireSound.forEach((sound) => {
          this.scene.sound.play(sound, {
            volume: 0.5,
          });
        });
      }
      this.spawnProjectile(config);
    }
  }

  private spawnProjectile(config: WeaponConfig, chargedDamage?: number): void {
    let hasCollided = false;
    const characterPos = this.character.getPosition();
    // Calculate angle between start and target points
    const angle = Phaser.Math.Angle.Between(
      this.barrelPoint.x,
      this.barrelPoint.y,
      characterPos.x,
      characterPos.y
    );

    // Add railgun case
    if (this.weapon === "railgun") {
      // Calculate the distance between barrel and target
      const distance = Phaser.Math.Distance.Between(
        this.barrelPoint.x,
        this.barrelPoint.y,
        characterPos.x,
        characterPos.y
      );

      // Create the laser beam
      const laser = this.scene.add.rectangle(
        this.barrelPoint.x,
        this.barrelPoint.y,
        distance,
        4,
        0xff0000,
        1
      );

      // Set the origin to left center for proper rotation
      laser.setOrigin(0, 0.5);

      // Rotate the laser to point at the target
      laser.setRotation(angle);

      // Add glow effect
      laser.setPostPipeline("GlowPostFX");

      // Optional: Add some particle effects at the impact point
      this.effects.playEffect("explosion1", characterPos.x, characterPos.y);

      // Apply damage
      const damage =
        chargedDamage || this.getCurrentWeaponConfig()?.damage || 0.05;
      EventBus.emit("health-changed", damage);

      // Fade out and destroy the laser
      this.scene.tweens.add({
        targets: laser,
        alpha: 0,
        duration: 100,
        ease: "Power2",
        onComplete: () => {
          laser.destroy();
        },
      });

      // Spawn coins at character position
      for (let i = 0; i < 5; i++) {
        this.effects.spawnCoin(characterPos.x, characterPos.y);
      }

      return;
    }

    const speed = config.projectileSpeed || 50;
    const projectileConfig = {
      friction: 0,
      frictionStatic: 0,
      frictionAir: 0.005, // Add air friction for arcing motion
      restitution: 0.3, // Reduce bounce
      angle: angle + Math.PI,
      density: 0.001, // Light enough to arc
      ignorePointer: true,
      ...config.projectileConfig,
    };
    const distance = Phaser.Math.Distance.Between(
      this.barrelPoint.x,
      this.barrelPoint.y,
      characterPos.x,
      characterPos.y
    );
    const throwForce = Math.min(distance * 0.02, 25);
    const projectile = this.scene.add
      .image(
        this.barrelPoint.x,
        this.barrelPoint.y,
        config.projectileTexture ?? ""
      )
      .setName(this.weapon ?? "")
      // .setFlipX(this.flipX)
      .setFlipY(this.flipY);

    config.projectileDisplaySize
      ? projectile.setDisplaySize(
          config.projectileDisplaySize.width,
          config.projectileDisplaySize.height
        )
      : projectile.setScale(
          config.projectileScale?.x ?? 1,
          config.projectileScale?.y ?? 1
        );
    // let projectileConfig = {
    //   friction: 0,
    //   frictionStatic: 0,
    //   frictionAir: 0.005, // Add air friction for arcing motion
    //   restitution: 0.3, // Reduce bounce
    //   angle: angle + Math.PI,
    //   density: 0.001, // Light enough to arc
    //   ignorePointer: true,
    // };
    // switch (this.weapon) {
    //   case "deagle":
    //     speed = 75;
    //     projectile = this.scene.add
    //       .image(this.barrelPoint.x, this.barrelPoint.y, "deagle-bullet")
    //       .setScale(0.06, 0.1);
    //     break;
    //   case "tommy":
    //     speed = 50;
    //     projectile = this.scene.add
    //       .image(this.barrelPoint.x, this.barrelPoint.y, "tommy-bullet")
    //       .setScale(0.04, 0.08);
    //     break;
    //   case "rpg":
    //     speed = 50;
    //     projectile = this.scene.add
    //       .image(this.barrelPoint.x, this.barrelPoint.y, "rpg-bullet")
    //       .setScale(0.1, 0.1);
    //     break;
    //   case "knife":
    //     speed = 40;
    //     projectile = this.scene.add
    //       .image(this.barrelPoint.x, this.barrelPoint.y, "knife")
    //       .setScale(0.08, 0.08);
    //     break;
    //   case "raygun":
    //     speed = 50;
    //     projectile = this.scene.add
    //       .image(this.barrelPoint.x, this.barrelPoint.y, "raygun-bullet")
    //       .setScale(1, 1);
    //     break;
    //   case "mg":
    //     speed = 50;
    //     projectile = this.scene.add
    //       .image(this.barrelPoint.x, this.barrelPoint.y, "mg-bullet")
    //       .setScale(0.08, 0.08);
    //     break;
    //   case "grenade":
    //   case "sticky-bomb":
    //   case "fire-bomb":
    //     projectile = this.scene.add
    //       .image(this.barrelPoint.x, this.barrelPoint.y, this.weapon)
    //       .setScale(0.15)
    //       .setName(this.weapon);

    //     // Add rotation to the throwable
    //     projectileConfig = {
    //       ...projectileConfig,
    //       //@ts-ignore
    // shape: { type: "circle", radius: 15 },
    // angularVelocity: 0.2, // Increased rotation speed
    // label: this.weapon, // Used to identify projectile type in collision
    //     };

    //     // Calculate throw force based on distance to target with increased force
    //     const distance = Phaser.Math.Distance.Between(
    //       this.barrelPoint.x,
    //       this.barrelPoint.y,
    //       characterPos.x,
    //       characterPos.y
    //     );
    //     throwForce = Math.min(distance * 0.02, 25); // Slightly reduced multiplier and max force

    //     break;
    //   default:
    //     return;
    // }

    if (
      this.weapon === "grenade" ||
      this.weapon === "sticky-bomb" ||
      this.weapon === "fire-bomb"
    ) {
      console.log("spawn projectile bomb");
      const matterBomb = this.scene.matter.add.gameObject(projectile, {
        ...projectileConfig,
        ignorePointer: true,
        onCollideCallback: (collision: MatterJS.ICollisionPair) => {
          if (hasCollided) return;
          hasCollided = true;
          // //@ts-ignore
          // if (collision.bodyA.label === "grenade") {
          //   return;
          // }
          const bodyA = collision.bodyA;
          const bodyB = collision.bodyB;

          // console.log(collision);

          const collisionPoint = {
            x: collision.collision.supports[0]?.x,
            y: collision.collision.supports[0]?.y,
          };

          switch (this.weapon) {
            case "sticky-bomb": {
              //@ts-ignore
              if (bodyA.label === "sticky-bomb") {
                return;
              }
              // Stick to the first thing hit
              if (!matterBomb.getData("stuck")) {
                matterBomb.setData("stuck", true);
                //@ts-ignore

                const joint = this.scene.matter.constraint.create({
                  bodyA: bodyA,
                  bodyB: bodyB,
                  pointA: { x: 0, y: 0 },
                  pointB: { x: 0, y: 0 },
                  length: 10,
                  stiffness: 1,
                  label: `sticky-bomb-joint-${this.stickyBombNumber}`,
                });
                console.log("joint", joint);
                this.scene.matter.world.add(joint);
                // Explode after delay
                this.scene.time.delayedCall(2000, () => {
                  this.effects.playEffect(
                    "explosion2",
                    collisionPoint.x,
                    collisionPoint.y
                  );

                  console.log(this.scene.matter.world.getAllConstraints());

                  this.scene.matter.world
                    .getAllConstraints()
                    .filter(
                      (joint) =>
                        joint.label ===
                        `sticky-bomb-joint-${this.stickyBombNumber}`
                      // joint.bodyB?.label === "sticky-bomb" ||
                      // joint.bodyA?.label === "sticky-bomb"
                    )
                    .forEach((joint) => {
                      this.scene.matter.world.removeConstraint(joint);
                    });
                  // this.createExplosion(collisionPoint.x, collisionPoint.y);
                  matterBomb.destroy();
                });
              }
              break;
            }
            case "fire-bomb": {
              this.scene.sound.play("fire-bomb-impact");
              this.randomFireEffect(characterPos);
              matterBomb.destroy();
              break;
            }
            case "grenade": {
              this.scene.sound.play("explode");
              this.randomExplosionEffect(characterPos);
              matterBomb.destroy();
              break;
            }
          }

          this.randomBloodEffect(characterPos);

          this.scene.sound.play("coin-drop");
          for (let i = 0; i < 3; i++) {
            this.effects.spawnCoin(characterPos.x, characterPos.y);
          }

          const damage = this.getCurrentWeaponConfig()?.damage || 0.05;

          EventBus.emit("health-changed", damage);
        },
      });
      this.stickyBombNumber++;

      // Apply arc trajectory
      this.scene.matter.setVelocity(
        matterBomb,
        Math.cos(angle) * throwForce,
        Math.sin(angle) * throwForce - 5 // Negative Y for upward arc
      );
    } else {
      console.log("spawn projectile");
      const matterBullet = this.scene.matter.add.gameObject(projectile, {
        friction: 0,
        frictionStatic: 0,
        frictionAir: 0,
        restitution: 1,
        density: 0.005,
        angle: angle + Math.PI,
        ignorePointer: true,
        shape: {
          type: "circle",
          radius: 10,
        },
        onCollideCallback: (collision: MatterJS.ICollisionPair) => {
          if (hasCollided) return;
          hasCollided = true;

          const collisionPoint = {
            x: collision.collision.supports[0]?.x,
            y: collision.collision.supports[0]?.y,
          };

          if (this.weapon === "rpg") {
            this.scene.sound.play("explode");
          } else if (this.weapon === "raygun") {
            this.scene.sound.play("raygun-impact");
          }

          const damage = this.getCurrentWeaponConfig()?.damage || 0.05;
          const characterPos = this.character.getPosition();
          this.randomBloodEffect(characterPos);

          EventBus.emit("health-changed", damage);
          this.scene.sound.play("coin-drop");
          for (let i = 0; i < 3; i++) {
            this.effects.spawnCoin(characterPos.x, characterPos.y);
          }
          matterBullet.destroy();
        },
      });

      // Set velocity based on angle to target
      this.scene.matter.setVelocity(
        matterBullet,
        speed * Math.cos(angle),
        speed * Math.sin(angle)
      );
    }
  }

  private randomBloodEffect(characterPos: Phaser.Math.Vector2): void {
    const bloodEffect = `b${Math.floor(Math.random() * 3) + 1}` as EffectType;
    const offset = {
      x: 0,
      y: (Math.random() - 0.5) * 50,
    };
    this.effects.playEffect(
      bloodEffect,
      characterPos.x + offset.x,
      characterPos.y + offset.y
    );
  }

  private randomExplosionEffect(characterPos: Phaser.Math.Vector2): void {
    const explosionEffect = `explosion${
      Math.random() < 0.5 ? 1 : 2
    }` as EffectType;
    const offset = {
      x: 0,
      y: 0,
    };
    this.effects.playEffect(
      explosionEffect,
      characterPos.x + offset.x,
      characterPos.y + offset.y
    );
  }

  private randomFireEffect(characterPos: Phaser.Math.Vector2): void {
    const fireEffect = `fire${Math.random() < 0.5 ? 1 : 2}` as EffectType;
    const offset = {
      x: 0,
      y: 0,
    };
    this.effects.playEffect(
      fireEffect,
      characterPos.x + offset.x,
      characterPos.y + offset.y
    );
  }

  public updateWeaponPosition() {
    if (!this.currentWeapon || !this.character) return;
    const characterPos = this.character.getPosition();
    const pointer = this.scene.input.activePointer;

    const worldPoint = pointer.positionToCamera(
      this.scene.cameras.main
    ) as Phaser.Math.Vector2;

    this.currentWeapon.setPosition(worldPoint.x, worldPoint.y);

    // Calculate angle between weapon and body
    const angle = Phaser.Math.Angle.Between(
      this.currentWeapon.x,
      this.currentWeapon.y,
      characterPos.x,
      characterPos.y
    );

    // Add 180 degrees to point barrel at body
    const adjustedAngle = angle + Math.PI;

    // Normalize angle between -π and π
    const normalizedAngle =
      ((adjustedAngle + Math.PI) % (Math.PI * 2)) - Math.PI;

    // Flip weapon when angle would make it appear upside down
    this.flipX =
      normalizedAngle > Math.PI / 2 || normalizedAngle < -Math.PI / 2;

    this.flipY =
      normalizedAngle > Math.PI / 2 || normalizedAngle < -Math.PI / 2;
    this.currentWeapon.setFlipX(this.flipX);

    // Set rotation with flip adjustment
    this.currentWeapon.setRotation(
      this.currentWeapon.flipX ? adjustedAngle + Math.PI : adjustedAngle
    );

    // Scale constants for weapon tip positioning
    // Different weapons need different scale multipliers
    let GUN_SCALE;

    switch (this.weapon) {
      case "knife":
        GUN_SCALE = {
          length: this.currentWeapon.displayWidth * 0.3,
          barrelOffset: this.currentWeapon.displayHeight * 0.001,
        };
        break;
      case "railgun":
        GUN_SCALE = {
          length: this.currentWeapon.displayWidth * 0.3,
          barrelOffset: this.currentWeapon.displayHeight * 0.001,
        };
        break;
      case "tommy":
        GUN_SCALE = {
          length: this.currentWeapon.displayWidth * 0.5,
          barrelOffset: this.currentWeapon.displayHeight * 0.08,
        };
        break;
      case "rpg":
        GUN_SCALE = {
          length: this.currentWeapon.displayWidth * 0.3,
          barrelOffset: this.currentWeapon.displayHeight * 0.05,
        };
        break;
      case "mg":
        GUN_SCALE = {
          length: this.currentWeapon.displayWidth * 0.3,
          barrelOffset: this.currentWeapon.displayHeight * 0.15,
        };
        break;
      case "kar98":
        GUN_SCALE = {
          length: this.currentWeapon.displayWidth * 0.3,
          barrelOffset: this.currentWeapon.displayHeight * 0.05,
        };
        break;
      case "flamethrower":
        GUN_SCALE = {
          length: this.currentWeapon.displayWidth * 0.3,
          barrelOffset: this.currentWeapon.displayHeight * 0.2,
        };

        // Calculate the offset based on rotation
        const FLAMETHROWER_OFFSET = 200; // Adjust this value as needed
        const offsetX = Math.cos(normalizedAngle) * FLAMETHROWER_OFFSET;
        const offsetY = Math.sin(normalizedAngle) * FLAMETHROWER_OFFSET;

        // Adjust the world point position before setting weapon position
        const adjustedWorldPoint = {
          x: worldPoint.x - offsetX,
          y: worldPoint.y - offsetY,
        };

        // Set position with offset
        this.currentWeapon.setPosition(
          adjustedWorldPoint.x,
          adjustedWorldPoint.y
        );
        // Update flame damage if weapon is active
        if (
          this.weapon === "flamethrower" &&
          this.scene.input.activePointer.isDown
        ) {
          this.updateFlameDamage();
        }
        break;
      default:
        GUN_SCALE = {
          length: this.currentWeapon.displayWidth * 0.3,
          barrelOffset: this.currentWeapon.displayHeight * 0.2,
        };
        break;
    }

    // Calculate weapon tip position
    const totalAngle =
      this.currentWeapon.rotation + (this.currentWeapon.flipX ? Math.PI : 0);
    const perpAngle = totalAngle + Math.PI / 2;

    const tipX =
      this.currentWeapon.x +
      Math.cos(totalAngle) * -GUN_SCALE.length +
      Math.cos(perpAngle) *
        (this.currentWeapon.flipX
          ? GUN_SCALE.barrelOffset
          : -GUN_SCALE.barrelOffset);

    const tipY =
      this.currentWeapon.y +
      Math.sin(totalAngle) * -GUN_SCALE.length +
      Math.sin(perpAngle) *
        (this.currentWeapon.flipX
          ? GUN_SCALE.barrelOffset
          : -GUN_SCALE.barrelOffset);

    this.barrelPoint.set(tipX, tipY);
  }

  public destroy(): void {
    this.stopFiring();
  }
}

// private playWeaponAnimation(): void {
//   if (!this.currentWeapon || !this.weapon) return;

//   switch (this.weapon) {
//     case "deagle":
//       this.currentWeapon.play("deagleFire");
//       break;
//     case "tommy":
//       this.currentWeapon.play("tommyFire");
//       break;
//     case "rpg":
//       this.currentWeapon.play("rpgFire");
//       break;
//     case "mg":
//       this.currentWeapon.play("mgFire");
//       break;
//     case "raygun":
//       this.currentWeapon.play("raygunFire");
//       break;
//     default:
//       return;
//   }
// }

// private playWeaponSound(config: WeaponConfig): void {
//   if (config.fireSound) {
//     this.scene.sound.play(config.fireSound);
//   }
// }

