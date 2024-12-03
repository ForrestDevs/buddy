import { EventBus } from "../EventBus";
import { CHARACTER_WIDTH, CHARACTER_HEIGHT, JOINT_LENGTH } from "../config";

interface CharacterConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  tier?: string;
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

export class Character {
  private scene: Phaser.Scene;
  private health: number = 100;
  private tier: string;
  private bodyParts: Map<string, Phaser.Physics.Matter.Image | null> = new Map([
    ["head", null],
    ["body", null],
    ["leftArm", null],
    ["rightArm", null],
    ["leftLeg", null],
    ["rightLeg", null],
  ]);
  private effects: Map<string, Phaser.GameObjects.Sprite | null> = new Map([
    ["bloodSplatter", null],
    ["bloodSplatter2", null],
    ["bloodSplatter3", null],
    ["bloodSplatter4", null],
    ["explosion", null],
  ]);
  private sounds: Map<string, Phaser.Sound.BaseSound | null> = new Map([
    ["hit", null],
    ["grunt", null],
    ["death", null],
  ]);

  constructor(config: CharacterConfig) {
    this.scene = config.scene;
    this.tier = config.tier || "paper";
    this.createCharacter(config.x, config.y);
    this.createEffects();
    this.setupEventListeners();
    this.loadSounds();
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
        texture: `${this.tier}-Head`,
        shape: characterShapes.head,
        config: {
          friction: 0.1,
          restitution: 0.3,
          density: 0.001, // Light head for better swinging
        },
      },
      body: {
        x,
        y: y + 184,
        width: CHARACTER_WIDTH,
        height: CHARACTER_HEIGHT,
        depth: 2,
        texture: `${this.tier}-Body`,
        shape: characterShapes.body,
        config: {
          friction: 0.1,
          restitution: 0.3,
          density: 0.005, // Heavier body acts as center of mass
        },
      },
      leftArm: {
        x: x + 238, // 750 - 512 = 238
        y: y, // 200 - 200 = 0
        width: CHARACTER_WIDTH,
        height: CHARACTER_HEIGHT,
        depth: 1,
        texture: `${this.tier}-Rarm`,
        shape: characterShapes.larm,
        config: {
          friction: 0.1,
          density: 0.001,
        },
      },
      rightArm: {
        x: x - 162, // 350 - 512 = -162
        y: y, // 200 - 200 = 0
        width: CHARACTER_WIDTH,
        height: CHARACTER_HEIGHT,
        depth: 1,
        texture: `${this.tier}-Larm`,
        shape: characterShapes.rarm,
        config: {
          friction: 0.1,
          density: 0.001,
        },
      },
      leftLeg: {
        x: x - 162, // 350 - 512 = -162
        y: y + 300, // 500 - 200 = 300
        width: CHARACTER_WIDTH - 30,
        height: CHARACTER_HEIGHT - 30,
        depth: 1,
        texture: `${this.tier}-Rleg`,
        shape: characterShapes.lleg,
        config: {
          friction: 0.1,
          density: 0.002,
        },
      },
      rightLeg: {
        x: x - 162, // 350 - 512 = -162
        y: y + 300, // 500 - 200 = 300
        width: CHARACTER_WIDTH - 30,
        height: CHARACTER_HEIGHT - 30,
        depth: 1,
        texture: `${this.tier}-Lleg`,
        shape: characterShapes.rleg,
        config: {
          friction: 0.1,
          density: 0.002,
        },
      },
    };
    for (const [part, config] of Object.entries(bodyPartConfigs)) {
      this.bodyParts.set(part, this.createBodyPart(config));
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
    return this.scene.matter.add
      .image(x, y, texture, undefined, {
        shape,
        ...config,
      })
      .setDisplaySize(width, height)
      .setCollisionCategory(1)
      .setDepth(depth);
  }

  private createJoints(): void {
    // Create neck joints
    const jointConfigs: JointConfig = {
      neckLeft: {
        bodyA: "head",
        bodyB: "body",
        length: 10,
        stiffness: 0.1,
        options: {
          pointA: { x: 0, y: CHARACTER_HEIGHT / 2.6 },
          pointB: { x: -25, y: -CHARACTER_HEIGHT / 2.6 },
          angularStiffness: 0.2,
          stiffness: 0.2,
        },
      },
      neckRight: {
        bodyA: "head",
        bodyB: "body",
        length: 10,
        stiffness: 0.1,
        options: {
          pointA: { x: 0, y: CHARACTER_HEIGHT / 2.6 },
          pointB: { x: 25, y: -CHARACTER_HEIGHT / 2.6 },
          angularStiffness: 0.2,
          stiffness: 0.2,
        },
      },
      leftShoulder: {
        bodyA: "leftArm",
        bodyB: "body",
        length: JOINT_LENGTH,
        stiffness: 0.3,
        options: {
          pointA: { x: 35, y: -15 },
          pointB: { x: -25, y: -35 },
          angularStiffness: 0.2,
        },
      },
      rightShoulder: {
        bodyA: "rightArm",
        bodyB: "body",
        length: JOINT_LENGTH,
        stiffness: 0.3,
        options: {
          pointA: { x: -35, y: -15 },
          pointB: { x: 25, y: -35 },
          angularStiffness: 0.2,
        },
      },
      leftKnee: {
        bodyA: "leftLeg",
        bodyB: "body",
        length: 1,
        stiffness: 0.4,
        options: {
          pointA: { x: 0, y: -20 },
          pointB: { x: -25, y: 35 },
          angularStiffness: 0.3,
        },
      },
      rightKnee: {
        bodyA: "rightLeg",
        bodyB: "body",
        length: 1,
        stiffness: 0.4,
        options: {
          pointA: { x: 0, y: -20 },
          pointB: { x: 25, y: 35 },
          angularStiffness: 0.3,
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
  }

  private createEffects(): void {
    const bodyPosition = {
      x: this.bodyParts.get("body")!.x,
      y: this.bodyParts.get("body")!.y,
    };

    const effectsConfig = [
      { key: "bloodSplatter", texture: "blood1_00018" },
      { key: "bloodSplatter2", texture: "bloodgush3_018" },
      { key: "bloodSplatter3", texture: "bloodgut3_022" },
      { key: "bloodSplatter4", texture: "darkerblood1_00018" },
      { key: "explosion", texture: "firstexplosion_00094" },
    ];

    effectsConfig.forEach(({ key, texture }) => {
      const sprite = this.scene.add
        .sprite(bodyPosition.x, bodyPosition.y, texture)
        .setDepth(4);
      this.effects.set(key, sprite);
    });
  }

  private setupEventListeners(): void {
    EventBus.on("projectile-hit", this.onProjectileHit, this);
  }

  private loadSounds(): void {
    // Define sound configurations
    const soundConfigs = [
      { key: "ouch", path: "ouch" },
      { key: "grunt", path: "grunt" },
      { key: "death", path: "death" },
      { key: "thump", path: "thump" },
    ];

    // Load and store sounds
    soundConfigs.forEach(({ key, path }) => {
      const sound = this.scene.sound.add(path, {
        volume: 0.5,
        rate: 1,
      });
      this.sounds.set(key, sound);
    });
  }

  private onProjectileHit({
    damage,
    isExplosion,
  }: {
    damage: number;
    isExplosion?: boolean;
  }): void {
    this.damage(damage);
    this.playHitEffects(isExplosion);

    // Play appropriate sound based on damage/health
    this.sounds.get("thump")?.play();
    if (this.health <= 0) {
      this.sounds.get("death")?.play();
    } else if (damage > 20) {
      this.sounds.get("grunt")?.play();
    } else {
      this.sounds.get("ouch")?.play();
    }
  }

  public damage(amount: number): void {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 100;
      const currentKills = this.scene.data.get("killCount") || 0;
      this.scene.data.set("killCount", currentKills + 1);
    }
    this.scene.data.set("health", this.health);
    EventBus.emit("character-health-changed", this.health);
  }

  private playHitEffects(isExplosion?: boolean): void {
    this.effects.get("bloodSplatter")?.play("b1");
    this.effects.get("bloodSplatter2")?.play("b2");
    this.effects.get("bloodSplatter3")?.play("b3");
    this.effects.get("bloodSplatter4")?.play("b4");

    if (isExplosion) {
      this.effects.get("explosion")?.play("explosion");
    }
  }

  public getPosition(): Phaser.Math.Vector2 {
    const body = this.bodyParts.get("body");
    if (!body) {
      return new Phaser.Math.Vector2(0, 0);
    }

    return new Phaser.Math.Vector2(body.x, body.y);
  }

  public changeTier(newTier: string): void {
    this.tier = newTier;
    this.updateTextures();
  }

  private updateTextures(): void {
    this.bodyParts.get("head")?.setTexture(`${this.tier}-Head`);
    this.bodyParts.get("body")?.setTexture(`${this.tier}-Body`);
    this.bodyParts.get("leftArm")?.setTexture(`${this.tier}-Rarm`);
    this.bodyParts.get("rightArm")?.setTexture(`${this.tier}-Larm`);
    this.bodyParts.get("leftLeg")?.setTexture(`${this.tier}-Rleg`);
    this.bodyParts.get("rightLeg")?.setTexture(`${this.tier}-Lleg`);
  }

  public update(): void {
    this.updateEffectsPosition();
    this.ensureCharacterBounds();
  }

  private updateEffectsPosition(): void {
    const body = this.bodyParts.get("body");
    if (!body) {
      return;
    }

    this.effects.forEach((effect) => {
      effect?.setPosition(body.x, body.y);
    });
  }

  private ensureCharacterBounds(): void {
    const gameWidth = this.scene.game.config.width as number;
    const gameHeight = this.scene.game.config.height as number;

    const isOutOfBounds = (
      part: Phaser.Physics.Matter.Image | null
    ): boolean => {
      if (!part) return false;
      return (
        part.x > gameWidth || part.x < 0 || part.y > gameHeight || part.y < 0
      );
    };

    // Check if any body part is out of bounds
    const outOfBounds = Array.from(this.bodyParts.values()).some(isOutOfBounds);

    if (outOfBounds) {
      this.resetPosition();
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

  public destroy(): void {
    EventBus.off("projectile-hit", this.onProjectileHit, this);

    // Clean up all body parts
    this.bodyParts.forEach((part) => {
      if (part) {
        part.destroy();
      }
    });

    // Clean up all effects
    this.effects.forEach((effect) => {
      if (effect) {
        effect.destroy();
      }
    });

    // Clear the maps
    this.bodyParts.clear();
    this.effects.clear();

    // Clean up sounds
    this.sounds.forEach((sound) => {
      if (sound) {
        sound.destroy();
      }
    });
    this.sounds.clear();
  }
}

