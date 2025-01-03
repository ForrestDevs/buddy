import { EventBus } from "../EventBus";
import { CHARACTER_WIDTH, CHARACTER_HEIGHT, JOINT_LENGTH } from "../config";
import { Effects } from "./Effects";
import { InputState } from "./InputState";

interface CharacterConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  tier?: string;
  collisionGroup: number;
}

type BodyPartConfig = Record<
  string,
  {
    x: number;
    y: number;
    width: number;
    height: number;
    texture: string;
    depth: number;
    shape: string | Phaser.Types.Physics.Matter.MatterSetBodyConfig | undefined;
    config: Phaser.Types.Physics.Matter.MatterBodyConfig;
  }
>;

type JointConfig = Record<
  string,
  {
    bodyA: string;
    bodyB: string;
    length: number;
    stiffness: number;
    options: {
      pointA: { x: number; y: number };
      pointB: { x: number; y: number };
      angularStiffness?: number;
      stiffness?: number;
    };
  }
>;

enum DamageState {
  CLEAN = "clean",
  LIGHT = "light",
  HEAVY = "heavy",
  DEAD = "dead",
}

interface DamageThresholds {
  LIGHT: number;
  HEAVY: number;
  DEAD: number;
}

//TODO: Finish weapon projectiles
//TODO: Make it work on mobile
//TODO: Setup CDN Server

export class Character {
  private effects: Effects;
  private collisionGroup!: number;
  private scene: Phaser.Scene;
  private health: number = 100;
  private characterSkin: string;
  private bodyParts: Map<string, Phaser.Physics.Matter.Image | null> = new Map([
    ["head", null],
    ["body", null],
    ["leftArm", null],
    ["rightArm", null],
    ["leftLeg", null],
    ["rightLeg", null],
  ]);
  private currentDamageState: DamageState = DamageState.CLEAN;
  private readonly DAMAGE_THRESHOLDS: DamageThresholds = {
    LIGHT: 75, // 75% health remaining
    HEAVY: 35, // 35% health remaining
    DEAD: 0,
  };

  private headCategory = 0b0001;
  private bodyCategory = 0b0010;
  private armCategory = 0b0100;
  private legCategory = 0b1000;
  private worldCategory = 0b10000;
  private inputState: InputState;
  private isRespawning: boolean = false;

  constructor(config: CharacterConfig, effects: Effects) {
    this.scene = config.scene;
    this.effects = effects;
    this.characterSkin = config.tier || "paper";
    this.collisionGroup = config.collisionGroup;
    this.inputState = InputState.getInstance();
    this.createCharacter(config.x, config.y);
    this.setupEventListeners();
  }

  private createCharacter(x: number, y: number): void {
    const characterShapes = this.scene.cache.json.get("characterShapes");
    const bodyPartConfigs: BodyPartConfig = {
      head: {
        x,
        y,
        width: CHARACTER_WIDTH,
        height: CHARACTER_HEIGHT,
        depth: 3,
        texture: `${this.characterSkin}-head-${this.currentDamageState}`,
        shape: characterShapes.head,
        config: {
          friction: 1, // Reduced
          density: 0.5, // Reduced
        },
      },
      body: {
        x,
        y: y + 80,
        width: CHARACTER_WIDTH,
        height: CHARACTER_HEIGHT,
        depth: 2,
        texture: `${this.characterSkin}-body-${this.currentDamageState}`,
        shape: characterShapes.body,
        config: {
          friction: 1,
          density: 2, // Main body slightly heavier
        },
      },
      leftArm: {
        x: x - 62, // 750 - 512 = 238
        y: y + 100, // 200 - 200 = 0
        width: CHARACTER_WIDTH - 20,
        height: CHARACTER_HEIGHT - 20,
        depth: 1,
        texture: `${this.characterSkin}-rarm-${this.currentDamageState}`,
        shape: characterShapes.larm,
        config: {
          friction: 1,
          density: 0.05,
        },
      },
      rightArm: {
        x: x + 138, // 350 - 512 = -162
        y: y + 100, // 200 - 200 = 0
        width: CHARACTER_WIDTH - 20,
        height: CHARACTER_HEIGHT - 20,
        depth: 1,
        texture: `${this.characterSkin}-larm-${this.currentDamageState}`,
        shape: characterShapes.rarm,
        config: {
          friction: 1,
          density: 0.05,
        },
      },
      leftLeg: {
        x: x - 62, // 350 - 512 = -162
        y: y + 200, // 500 - 200 = 300
        width: CHARACTER_WIDTH - 30,
        height: CHARACTER_HEIGHT - 30,
        depth: 1,
        texture: `${this.characterSkin}-rleg-${this.currentDamageState}`,
        shape: characterShapes.lleg,
        config: {
          friction: 1,
          density: 3,
        },
      },
      rightLeg: {
        x: x + 138, // 350 - 512 = -162
        y: y + 200, // 500 - 200 = 300
        width: CHARACTER_WIDTH - 30,
        height: CHARACTER_HEIGHT - 30,
        depth: 1,
        texture: `${this.characterSkin}-lleg-${this.currentDamageState}`,
        shape: characterShapes.rleg,
        config: {
          friction: 1,
          density: 3,
        },
      },
    };
    for (const [part, config] of Object.entries(bodyPartConfigs)) {
      const bodyPart = this.createBodyPart(
        config
      ) as unknown as MatterJS.BodyType;
      bodyPart.inertia = 9999999;
      bodyPart.inverseInertia = 1 / 9999999;
      this.bodyParts.set(
        part,
        bodyPart as unknown as Phaser.Physics.Matter.Image
      );
    }
    this.createJoints();
  }

  private createBodyPart({
    x,
    y,
    width,
    height,
    depth,
    texture,
    shape,
    config,
  }: {
    x: number;
    y: number;
    width: number;
    height: number;
    depth: number;
    texture: string;
    shape: string | Phaser.Types.Physics.Matter.MatterSetBodyConfig | undefined;
    config: Phaser.Types.Physics.Matter.MatterBodyConfig;
  }): Phaser.Physics.Matter.Image {
    return (
      this.scene.matter.add
        .image(x, y, texture, undefined, {
          shape,
          ...config,
        })
        // .setFixedRotation()
        .setDisplaySize(width, height)
        .setCollisionCategory(1)
        .setDepth(depth)
        .setCollisionGroup(this.collisionGroup)
    );
  }

  private createJoints(): void {
    const jointConfigs: JointConfig = {
      neck: {
        bodyA: "head",
        bodyB: "body",
        length: 6, // Increased length
        stiffness: 0.9, // Reduced stiffness
        options: {
          pointA: { x: 0, y: CHARACTER_HEIGHT / 2.6 },
          pointB: { x: 0, y: -CHARACTER_HEIGHT / 2.6 },
        },
      },
      neckLeft: {
        bodyA: "head",
        bodyB: "body",
        length: 6,
        stiffness: 0.8,
        options: {
          pointA: { x: -15, y: CHARACTER_HEIGHT / 2.6 },
          pointB: { x: -25, y: -CHARACTER_HEIGHT / 2.6 },
        },
      },
      neckRight: {
        bodyA: "head",
        bodyB: "body",
        length: 6,
        stiffness: 0.8,
        options: {
          pointA: { x: 15, y: CHARACTER_HEIGHT / 2.6 },
          pointB: { x: 25, y: -CHARACTER_HEIGHT / 2.6 },
        },
      },
      leftShoulder: {
        bodyA: "leftArm",
        bodyB: "body",
        length: 10,
        stiffness: 0.9,
        options: {
          pointA: { x: 30, y: -15 },
          pointB: { x: -25, y: -35 },
        },
      },
      leftElbow: {
        bodyA: "leftArm",
        bodyB: "body",
        length: 40,
        stiffness: 0.8,
        options: {
          pointA: { x: -30, y: 20 },
          pointB: { x: -30, y: 35 },
        },
      },
      rightShoulder: {
        bodyA: "rightArm",
        bodyB: "body",
        length: 10,
        stiffness: 0.9,
        options: {
          pointA: { x: -35, y: -15 },
          pointB: { x: 25, y: -35 },
        },
      },
      rightElbow: {
        bodyA: "rightArm",
        bodyB: "body",
        length: 40,
        stiffness: 0.8,
        options: {
          pointA: { x: 30, y: 20 },
          pointB: { x: 30, y: 35 },
        },
      },
      leftKnee: {
        bodyA: "leftLeg",
        bodyB: "body",
        length: 10,
        stiffness: 0.9,
        options: {
          pointA: { x: -5, y: -20 },
          pointB: { x: -30, y: 35 },
        },
      },
      rightKnee: {
        bodyA: "rightLeg",
        bodyB: "body",
        length: 10,
        stiffness: 0.9,
        options: {
          pointA: { x: 0, y: -20 },
          pointB: { x: 30, y: 35 },
        },
      },
      legConnector: {
        bodyA: "leftLeg",
        bodyB: "rightLeg",
        length: 25,
        stiffness: 0.8,
        options: {
          pointA: { x: 20, y: 0 }, // Connect at heel of left leg
          pointB: { x: -20, y: 0 }, // Connect at heel of right leg
        },
      },
    };

    // Create all joints
    Object.values(jointConfigs).forEach((config) => {
      const bodyA = this.bodyParts.get(
        config.bodyA
      ) as unknown as MatterJS.BodyType;
      const bodyB = this.bodyParts.get(
        config.bodyB
      ) as unknown as MatterJS.BodyType;

      if (bodyA && bodyB) {
        this.scene.matter.add.joint(
          bodyA,
          bodyB,
          config.length,
          config.stiffness,
          config.options
        );
      }
    });

    // const head = this.bodyParts.get("head") as unknown as MatterJS.BodyType;
    // this.scene.matter.add.constraint(head, head, 50, 0.9, {
    //   pointB: { x: 0, y: -50 },
    // });
  }

  private setupEventListeners(): void {
    EventBus.on("health-changed", this.onHealthChanged, this);
    // EventBus.on("projectile-hit", this.onProjectileHit, this);
  }

  private onHealthChanged = (damage: number): void => {
    // If already dead or will be dead after damage, handle death immediately
    if (this.health <= 0 || this.health - damage <= 0) {
      this.health = 0;
      this.currentDamageState = DamageState.DEAD;
      EventBus.emit("damage-state-changed", DamageState.DEAD);
      this.updateCharacterAppearance();
      this.initiateDeathSequence();
      return;
    }

    // Otherwise process normal damage
    this.health -= damage;
    const previousState = this.currentDamageState;
    this.playRandomBuddySound();
    this.updateDamageState();

    if (previousState !== this.currentDamageState) {
      console.log("updateCharacterAppearance");
      this.updateCharacterAppearance();
    }
  };

  private updateDamageState(): void {
    const healthPercentage = (this.health / 100) * 100;
    // console.log("updateDamageState", healthPercentage);
    if (healthPercentage <= this.DAMAGE_THRESHOLDS.DEAD) {
      // console.log("updateDamageState DEAD");
      this.currentDamageState = DamageState.DEAD;
      EventBus.emit("damage-state-changed", DamageState.DEAD);
    } else if (healthPercentage <= this.DAMAGE_THRESHOLDS.HEAVY) {
      // console.log("updateDamageState HEAVY");
      this.currentDamageState = DamageState.HEAVY;
      this.effects.spawnCoin(this.getPosition().x, this.getPosition().y, 200);
      EventBus.emit("damage-state-changed", DamageState.HEAVY);
    } else if (healthPercentage <= this.DAMAGE_THRESHOLDS.LIGHT) {
      // console.log("updateDamageState LIGHT");
      this.currentDamageState = DamageState.LIGHT;
      this.effects.spawnCoin(this.getPosition().x, this.getPosition().y, 200);
      EventBus.emit("damage-state-changed", DamageState.LIGHT);
    } else {
      // console.log("updateDamageState CLEAN");
      this.currentDamageState = DamageState.CLEAN;
      EventBus.emit("damage-state-changed", DamageState.CLEAN);
    }
  }

  private updateCharacterAppearance(): void {
    const state = this.currentDamageState;
    this.bodyParts.forEach((part, partName) => {
      if (part) {
        const baseTexture = `${this.characterSkin}-${this.getPartBaseName(
          partName
        )}`;
        const damageTexture =
          state === DamageState.CLEAN ? baseTexture : `${baseTexture}-${state}`;
        part.setTexture(damageTexture);
      }
    });
  }

  private getPartBaseName(partName: string): string {
    const nameMap: Record<string, string> = {
      head: "head",
      body: "body",
      leftArm: "rarm",
      rightArm: "larm",
      leftLeg: "rleg",
      rightLeg: "lleg",
    };
    return nameMap[partName] || partName;
  }

  private async initiateDeathSequence(): Promise<void> {
    if (this.isRespawning) return;
    this.isRespawning = true;
    EventBus.emit("stop-firing");
    this.inputState.lock("character-death");
    // Play death sound
    // this.sounds.get("death")?.play();

    // First remove constraints to let parts disconnect
    const constraints = this.scene.matter.world.getAllConstraints();
    constraints.forEach((constraint) => {
      const bodyA = constraint.bodyA;
      const bodyB = constraint.bodyB;

      if (!bodyA || !bodyB) return;

      if (this.isCharacterBody(bodyA) || this.isCharacterBody(bodyB)) {
        this.scene.matter.world.removeConstraint(constraint);
      }
    });

    const characterPos = this.getPosition();
    for (let i = 0; i < 10; i++) {
      this.effects.spawnCoin(characterPos.x, characterPos.y, 75);
    }

    this.scene.sound.play("buddy-bone1");
    this.scene.sound.play("buddy-death");

    // Add stronger random forces to scatter parts dramatically
    this.bodyParts.forEach((part) => {
      if (part) {
        const randomForce = new Phaser.Math.Vector2(
          Phaser.Math.Between(-0.02, 0.02), // Increased force
          Phaser.Math.Between(-0.015, -0.005) // More upward bias
        );
        const randomTorque = Phaser.Math.Between(-0.001, 0.001);
        part.applyForce(randomForce);
        part.setAngularVelocity(randomTorque);
      }
    });

    // Wait for parts to scatter
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Start fading parts
    const fadePromises = Array.from(this.bodyParts.values()).map((part) => {
      if (part) {
        return new Promise<void>((resolve) => {
          // Slow down physics as we fade
          if (part.body) {
            const currentVel = part.body.velocity;
            part.setVelocity(currentVel.x * 0.5, currentVel.y * 0.5);
          }

          this.scene.tweens.add({
            targets: part,
            alpha: 0,
            duration: 2000, // Longer fade
            ease: "Power1",
            onComplete: () => {
              // Create smoke effect at final position
              // this.createSmokeEffect(part.x, part.y);
              resolve();
            },
          });
        });
      }
      return Promise.resolve();
    });

    // Wait for all fades and smoke effects
    await Promise.all(fadePromises);

    // Additional delay before respawn
    await new Promise((resolve) => setTimeout(resolve, 500));
    EventBus.emit("reset-health-bar");
    // Finally respawn
    this.respawnCharacter();
  }

  private playRandomBuddySound(): void {
    const sounds = ["grunt", "ouch", "scream", "swear", "thump", "buddy-bone2"];
    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
    this.scene.sound.play(randomSound);
  }

  private isCharacterBody(body: MatterJS.BodyType): boolean {
    return Array.from(this.bodyParts.values()).some(
      (part) => part && part.body === body
    );
  }

  private respawnCharacter(): void {
    // Reset health
    this.health = 100;
    this.currentDamageState = DamageState.CLEAN;
    // Clear existing body parts
    this.bodyParts.forEach((part) => part?.destroy());
    this.bodyParts.clear();

    // Recreate character at spawn position
    const centerX = (this.scene.game.config.width as number) / 2;
    const centerY = (this.scene.game.config.height as number) / 2;
    this.createCharacter(centerX, centerY);

    // Fade in new character
    this.bodyParts.forEach((part) => {
      if (part) {
        part.setAlpha(0);
        this.scene.tweens.add({
          targets: part,
          alpha: 1,
          duration: 500,
          ease: "Power2",
        });
      }
    });
    this.scene.sound.play("buddy-respawn");

    this.inputState.unlock("character-death");
    this.isRespawning = false;
    // Emit respawn event
    EventBus.emit("character-respawned");
  }

  public getPosition(): Phaser.Math.Vector2 {
    const body = this.bodyParts.get("body");
    if (!body) {
      return new Phaser.Math.Vector2(0, 0);
    }
    // Get the body bounds to find true center
    const bounds = body.getBounds();
    return new Phaser.Math.Vector2(bounds.centerX, bounds.centerY);
  }

  public changeSkin(newTier: string): void {
    this.characterSkin = newTier;
    this.bodyParts
      .get("head")
      ?.setTexture(`${this.characterSkin}-head-${this.currentDamageState}`);
    this.bodyParts
      .get("body")
      ?.setTexture(`${this.characterSkin}-body-${this.currentDamageState}`);
    this.bodyParts
      .get("leftArm")
      ?.setTexture(`${this.characterSkin}-rarm-${this.currentDamageState}`);
    this.bodyParts
      .get("rightArm")
      ?.setTexture(`${this.characterSkin}-larm-${this.currentDamageState}`);
    this.bodyParts
      .get("leftLeg")
      ?.setTexture(`${this.characterSkin}-rleg-${this.currentDamageState}`);
    this.bodyParts
      .get("rightLeg")
      ?.setTexture(`${this.characterSkin}-lleg-${this.currentDamageState}`);
  }

  public update(): void {
    this.ensureCharacterBounds();
  }

  private ensureCharacterBounds(): void {
    const gameWidth = this.scene.game.config.width as number;
    const gameHeight = this.scene.game.config.height as number;
    const inset = 50; // 50 pixel inset from bounds

    const isOutOfBounds = (
      part: Phaser.Physics.Matter.Image | null
    ): boolean => {
      if (!part) return false;
      return (
        part.x > gameWidth - inset ||
        part.x < inset ||
        part.y > gameHeight - inset ||
        part.y < inset
      );
    };

    // Check if any body part is out of bounds
    const outOfBounds = Array.from(this.bodyParts.values()).some(isOutOfBounds);

    if (outOfBounds) {
      EventBus.emit("character-out-of-bounds");
      this.bodyParts.forEach((part) => {
        if (part) {
          // Calculate force direction based on position
          const forceX = part.x > gameWidth ? -0.005 : part.x < 0 ? 0.005 : 0;
          const forceY = part.y > gameHeight ? -0.005 : part.y < 0 ? 0.005 : 0;

          // Apply force in opposite direction of out-of-bounds movement
          part.applyForce(new Phaser.Math.Vector2(forceX, forceY));
        }
      });
      // this.resetPosition();
    }
  }

  private resetPosition(): void {
    const centerX = (this.scene.game.config.width as number) / 2;
    const positions = [
      ["head", centerX, 200],
      ["body", centerX, 384],
      ["leftArm", centerX + 238, 200],
      ["rightArm", centerX - 162, 200],
      ["leftLeg", centerX - 162, 500],
      ["rightLeg", centerX + 238, 500],
    ];
    positions.forEach(([part, x, y]) => {
      this.bodyParts.get(part as string)?.setPosition(x as number, y as number);
    });
  }

  // Don't forget to clean up in the destroy method
  public destroy(): void {
    // EventBus.off("projectile-hit", this.onProjectileHit, this);

    // Clean up all body parts
    this.bodyParts.forEach((part) => {
      if (part) {
        part.destroy();
      }
    });

    // Clear the maps
    this.bodyParts.clear();
  }
}

