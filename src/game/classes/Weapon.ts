import { EventBus } from "../EventBus";
import { Character } from "./Character";
import { GameWeaponKey } from "../types";
import { Effects } from "./Effects";

interface WeaponConfig {
  texture: string;
  width: number;
  height: number;
  name: string;
  fireRate: number;
  burstSize: number;
  burstDelay?: number;
  sound?: string;
  damage: number;
  projectileSpeed: number;
  projectileScale: { x: number; y: number };
}

export class Weapon {
  private scene: Phaser.Scene;
  private character: Character;
  private effects: Effects;
  private currentWeapon?: Phaser.GameObjects.Sprite;
  private weapon?: GameWeaponKey;
  private firingTimer?: Phaser.Time.TimerEvent;
  private barrelPoint: Phaser.Math.Vector2;
  private showWeapon: boolean = true;
  private pointerOver: boolean = false;

  private static readonly WEAPON_CONFIGS: Record<GameWeaponKey, WeaponConfig> =
    {
      knife: {
        texture: "knife",
        width: 100,
        height: 50,
        name: "knife",
        fireRate: 500,
        burstSize: 1,
        damage: 0.4,
        projectileSpeed: 40,
        projectileScale: { x: 0.08, y: 0.08 },
      },
      deagle: {
        texture: "deaglefiring_00018",
        width: 200,
        height: 100,
        name: "deagle",
        fireRate: 500,
        burstSize: 1,
        sound: "deagle-fire",
        damage: 0.5,
        projectileSpeed: 75,
        projectileScale: { x: 0.06, y: 0.1 },
      },
      grenade: {
        texture: "grenade",
        width: 50,
        height: 50,
        name: "grenade",
        fireRate: 1000,
        burstSize: 1,
        sound: "fire-bomb-fire",
        damage: 0.8,
        projectileSpeed: 25,
        projectileScale: { x: 0.15, y: 0.15 },
      },
      tommy: {
        texture: "tommy",
        width: 300,
        height: 150,
        name: "tommy",
        fireRate: 60,
        burstSize: 4,
        burstDelay: 400,
        sound: "deagle-fire",
        damage: 0.3,
        projectileSpeed: 50,
        projectileScale: { x: 0.04, y: 0.08 },
      },
      "sticky-bomb": {
        texture: "sticky-bomb",
        width: 100,
        height: 100,
        name: "sticky-bomb",
        fireRate: 1000,
        burstSize: 1,
        sound: "fire-bomb-fire",
        damage: 0.7,
        projectileSpeed: 25,
        projectileScale: { x: 0.15, y: 0.15 },
      },
      chainsaw: {
        texture: "chainsaw",
        width: 300,
        height: 150,
        name: "chainsaw",
        fireRate: 100,
        burstSize: 1,
        damage: 0.3,
        projectileSpeed: 50,
        projectileScale: { x: 0.08, y: 0.08 },
      },
      rpg: {
        texture: "rpg",
        width: 300,
        height: 150,
        name: "rpg",
        fireRate: 1000,
        burstSize: 1,
        sound: "rpg-fire",
        damage: 1.0,
        projectileSpeed: 50,
        projectileScale: { x: 0.1, y: 0.1 },
      },
      mg: {
        texture: "mg",
        width: 300,
        height: 150,
        name: "mg",
        fireRate: 100,
        burstSize: 1,
        sound: "deagle-fire",
        damage: 0.4,
        projectileSpeed: 50,
        projectileScale: { x: 0.08, y: 0.08 },
      },
      "fire-bomb": {
        texture: "fire-bomb",
        width: 120,
        height: 70,
        name: "fire-bomb",
        fireRate: 1000,
        burstSize: 1,
        sound: "fire-bomb-fire",
        damage: 0.6,
        projectileSpeed: 25,
        projectileScale: { x: 0.15, y: 0.15 },
      },
      lightsaber: {
        texture: "lightsaber",
        width: 300,
        height: 150,
        name: "lightsaber",
        fireRate: 1000,
        burstSize: 1,
        damage: 0.5,
        projectileSpeed: 50,
        projectileScale: { x: 0.1, y: 0.1 },
      },
      railgun: {
        texture: "railgun",
        width: 300,
        height: 150,
        name: "railgun",
        fireRate: 1000,
        burstSize: 1,
        damage: 0.5,
        projectileSpeed: 50,
        projectileScale: { x: 0.1, y: 0.1 },
      },
      raygun: {
        texture: "raygun",
        width: 300,
        height: 150,
        name: "raygun",
        fireRate: 200,
        burstSize: 1,
        sound: "raygun-fire",
        damage: 25,
        projectileSpeed: 50,
        projectileScale: { x: 1, y: 1 },
      },
    };

  constructor(scene: Phaser.Scene, character: Character, effects: Effects) {
    this.scene = scene;
    this.character = character;
    this.effects = effects;
    this.barrelPoint = new Phaser.Math.Vector2(0, 0);
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Add any event listeners needed
    EventBus.on("set-weapon", this.setWeapon, this);
  }

  public updateWeaponPosition() {
    if (!this.currentWeapon) {
      return;
    }

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
    this.currentWeapon.setFlipX(
      normalizedAngle > Math.PI / 2 || normalizedAngle < -Math.PI / 2
    );

    // Set rotation with flip adjustment
    this.currentWeapon.setRotation(
      this.currentWeapon.flipX ? adjustedAngle + Math.PI : adjustedAngle
    );

    // Scale constants for weapon tip positioning
    // Different weapons need different scale multipliers
    const GUN_SCALE =
      this.weapon === "tommy"
        ? {
            length: this.currentWeapon.displayWidth * 0.5,
            barrelOffset: this.currentWeapon.displayHeight * 0.08,
          }
        : {
            length: this.currentWeapon.displayWidth * 0.3,
            barrelOffset: this.currentWeapon.displayHeight * 0.2,
          };

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

  public fireWeapon(): void {
    const config = this.getCurrentWeaponConfig();
    if (!config) return;
    this.playWeaponAnimation();
    this.playWeaponSound(config);
    this.spawnProjectile();
  }

  private getCurrentWeaponConfig(): WeaponConfig | undefined {
    return this.weapon ? Weapon.WEAPON_CONFIGS[this.weapon] : undefined;
  }

  private playWeaponAnimation(): void {
    if (!this.currentWeapon || !this.weapon) return;

    switch (this.weapon) {
      case "deagle":
        this.currentWeapon.play("deagleFire");
        break;
      case "tommy":
        this.currentWeapon.play("tommyFire");
        break;
      case "rpg":
        this.currentWeapon.play("rpgFire");
        break;
      case "mg":
        this.currentWeapon.play("mgFire");
        break;
      case "raygun":
        this.currentWeapon.play("raygunFire");
        break;
      default:
        return;
    }
  }

  private playWeaponSound(config: WeaponConfig): void {
    if (config.sound) {
      this.scene.sound.play(config.sound);
    }
  }

  private spawnProjectile(): void {
    const characterPos = this.character.getPosition();

    // Calculate angle between start and target points
    const angle = Phaser.Math.Angle.Between(
      this.barrelPoint.x,
      this.barrelPoint.y,
      characterPos.x,
      characterPos.y
    );

    let speed = 50;
    let projectile;
    let throwForce = 0;
    let projectileConfig = {
      friction: 0,
      frictionStatic: 0,
      frictionAir: 0.005, // Add air friction for arcing motion
      restitution: 0.3, // Reduce bounce
      angle: angle + Math.PI,
      density: 0.001, // Light enough to arc
      ignorePointer: true,
    };

    switch (this.weapon) {
      case "deagle":
        speed = 75;
        projectile = this.scene.add
          .image(this.barrelPoint.x, this.barrelPoint.y, "deagle-bullet")
          .setScale(0.06, 0.1);
        break;
      case "tommy":
        speed = 50;
        projectile = this.scene.add
          .image(this.barrelPoint.x, this.barrelPoint.y, "tommy-bullet")
          .setScale(0.04, 0.08);
        break;
      case "rpg":
        speed = 50;
        projectile = this.scene.add
          .image(this.barrelPoint.x, this.barrelPoint.y, "rpg-bullet")
          .setScale(0.1, 0.1);
        break;
      case "knife":
        speed = 40;
        projectile = this.scene.add
          .image(this.barrelPoint.x, this.barrelPoint.y, "knife")
          .setScale(0.08, 0.08);
        break;
      case "raygun":
        speed = 50;
        projectile = this.scene.add
          .image(this.barrelPoint.x, this.barrelPoint.y, "raygun-bullet")
          .setScale(1, 1);
        break;
      case "mg":
        speed = 50;
        projectile = this.scene.add
          .image(this.barrelPoint.x, this.barrelPoint.y, "mg-bullet")
          .setScale(0.08, 0.08);
        break;
      case "grenade":
      case "sticky-bomb":
      case "fire-bomb":
        projectile = this.scene.add
          .image(this.barrelPoint.x, this.barrelPoint.y, this.weapon)
          .setScale(0.15);

        // Add rotation to the throwable
        projectileConfig = {
          ...projectileConfig,
          //@ts-ignore
          shape: { type: "circle", radius: 15 },
          angularVelocity: 0.2, // Increased rotation speed
          label: this.weapon, // Used to identify projectile type in collision
        };

        // Calculate throw force based on distance to target with increased force
        const distance = Phaser.Math.Distance.Between(
          this.barrelPoint.x,
          this.barrelPoint.y,
          characterPos.x,
          characterPos.y
        );
        throwForce = Math.min(distance * 0.02, 25); // Slightly reduced multiplier and max force

        break;
      default:
        return;
    }

    if (
      this.weapon === "grenade" ||
      this.weapon === "sticky-bomb" ||
      this.weapon === "fire-bomb"
    ) {
      const matterBomb = this.scene.matter.add.gameObject(projectile, {
        ...projectileConfig,
        onCollideCallback: (collision: MatterJS.ICollisionPair) => {
          const bodyA = collision.bodyA;
          const bodyB = collision.bodyB;

          const collisionPoint = {
            x: collision.collision.supports[0]?.x,
            y: collision.collision.supports[0]?.y,
          };

          switch (this.weapon) {
            case "sticky-bomb": {
              // Stick to the first thing hit
              if (!matterBomb.getData("stuck")) {
                matterBomb.setData("stuck", true);
                //@ts-ignore
                this.scene.matter.add.joint(bodyA, bodyB, {
                  pointA: { x: 0, y: 0 },
                  pointB: { x: 0, y: 0 },
                });
                // this.matter.setStatic(matterBomb, true);

                // Explode after delay
                this.scene.time.delayedCall(2000, () => {
                  this.effects.playEffect(
                    "explosion2",
                    collisionPoint.x,
                    collisionPoint.y
                  );
                  // this.createExplosion(collisionPoint.x, collisionPoint.y);
                  matterBomb.destroy();
                });
              }
              break;
            }
            case "fire-bomb": {
              // Create fire effect and DOT damage
              this.effects.playEffect(
                "fire",
                collisionPoint.x,
                collisionPoint.y
              );
              matterBomb.destroy();
              break;
            }
            case "grenade": {
              // Explode immediately on impact
              this.effects.playEffect(
                "explosion2",
                collisionPoint.x,
                collisionPoint.y
              );
              matterBomb.destroy();
              break;
            }
          }

          const damage = this.getCurrentWeaponConfig()?.damage || 0.05;

          EventBus.emit("projectile-hit", damage);
        },
      });

      // Apply arc trajectory
      this.scene.matter.setVelocity(
        matterBomb,
        Math.cos(angle) * throwForce,
        Math.sin(angle) * throwForce - 5 // Negative Y for upward arc
      );
    } else {
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
          const collisionPoint = {
            x: collision.collision.supports[0]?.x,
            y: collision.collision.supports[0]?.y,
          };

          if (this.weapon === "rpg") {
            this.scene.sound.play("explode");
          } else if (this.weapon === "raygun") {
            this.scene.sound.play("raygun-impact");
          }

          // Calculate damage based on weapon type
          // let damage = 0.05; // default damage
          // switch (this.weapon) {
          //   case "rpg":
          //     damage = 1;
          //     break;
          //   case "deagle":
          //     damage = 0.5;
          //     break;
          //   case "tommy":
          //     damage = 0.3;
          //     break;
          //   case "mg":
          //     damage = 0.4;
          //     break;
          //   case "raygun":
          //     damage = 0.3;
          //     break;
          //   // Add other weapon damage values as needed
          // }
          const damage = this.getCurrentWeaponConfig()?.damage || 0.05;

          const characterPos = this.character.getPosition();

          const isExplosion = this.weapon === "rpg";
          EventBus.emit("health-changed", damage);
          // this.effects.playEffect("coin", collisionPoint.x, collisionPoint.y);
          this.effects.playEffect("b1", characterPos.x, characterPos.y);
          // EventBus.emit("projectile-hit", { damage, isExplosion });
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

    for (let i = 0; i < 5; i++) {
      this.effects.spawnCoin(characterPos.x, characterPos.y);
    }
  }

  public startFiring(): void {
    const config = this.getCurrentWeaponConfig();
    if (!config) return;

    if (!this.showWeapon || !this.weapon || this.pointerOver) {
      return;
    }

    // Show current weapon if it exists but isn't displayed
    if (this.currentWeapon && !this.currentWeapon.getDisplayList()) {
      this.currentWeapon.addToDisplayList();
    }

    // Clear any existing firing timer when changing weapons
    if (this.firingTimer) {
      this.firingTimer.destroy();
      this.firingTimer = undefined;
    }

    let lastFired = 0;
    let burstCount = 0;
    let canFire = true;

    // Initial fire
    this.fireWeapon();
    lastFired = this.scene.time.now;

    this.firingTimer = this.scene.time.addEvent({
      delay: 16,
      callback: () => {
        const currentTime = this.scene.time.now;

        if (!this.scene.input.activePointer.isDown) {
          canFire = true;
          burstCount = 0;
          return;
        }

        // Check if enough time has passed since last shot
        if (currentTime - lastFired >= config.fireRate && canFire) {
          if (config.burstSize > 1) {
            // Burst fire logic
            this.fireWeapon();
            burstCount++;
            lastFired = currentTime;

            if (burstCount >= config.burstSize) {
              canFire = false;
              burstCount = 0;
              // Reset after burst delay
              this.scene.time.delayedCall(config.burstDelay || 300, () => {
                canFire = true;
              });
            }
          } else {
            // Single shot logic
            this.fireWeapon();
            lastFired = currentTime;
          }

          // Play weapon sound
          //   if (config.sound) {
          //     this.scene.sound.play(config.sound);
          //   }
        }
      },
      loop: true,
    });
  }

  public stopFiring(): void {
    if (this.firingTimer) {
      this.firingTimer.destroy();
      this.firingTimer = undefined;
    }

    if (this.currentWeapon && this.currentWeapon.getDisplayList()) {
      this.currentWeapon.removeFromDisplayList();
    }
  }

  public setPointerOver(value: boolean): void {
    this.pointerOver = value;
  }

  public show(): void {
    this.showWeapon = true;
    if (this.currentWeapon) {
      this.currentWeapon.setVisible(true);
    }
  }

  public hide(): void {
    this.showWeapon = false;
    if (this.currentWeapon) {
      this.currentWeapon.setVisible(false);
    }
  }

  public destroy(): void {
    this.stopFiring();
  }
}

