/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { IPair } from "matter";
import { EventBus } from "../EventBus";
import Phaser, { Scene } from "phaser";
/* END-USER-IMPORTS */

const JOINT_LENGTH = 10;
const JOINT_STIFFNESS = 1;
const CHARACTER_HEIGHT = 100;
const CHARACTER_WIDTH = 100;
const SLOP = 10;

export default class Game extends Phaser.Scene {
  private moveCam: boolean;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private fpsText!: Phaser.GameObjects.Text;
  private clickCountText!: Phaser.GameObjects.Text;
  private clickButton!: TextButton;
  private clickCount = 0;

  private starBody!: MatterJS.BodyType;
  private head!: Phaser.Physics.Matter.Image;
  private body!: Phaser.Physics.Matter.Image;
  private leftArm!: Phaser.Physics.Matter.Image;
  private rightArm!: Phaser.Physics.Matter.Image;
  private leftLeg!: Phaser.Physics.Matter.Image;
  private rightLeg!: Phaser.Physics.Matter.Image;
  private headText!: Phaser.GameObjects.Text;

  private weapon:
    | "fist"
    | "knives"
    | "desert-eagle"
    | "tommy-gun"
    | "rocket-launcher" = "fist";

  private fistButton!: TextButton;
  private knivesButton!: TextButton;
  private desertEagleButton!: TextButton;
  private tommyGunButton!: TextButton;
  private rocketLauncherButton!: TextButton;
  private bullets: MatterJS.BodyType[] = [];

  private health = 100;

  constructor() {
    super("MainGame");
  }

  init() {
    this.cursors = this.input?.keyboard?.createCursorKeys()!;
  }

  renderCharacter() {
    const characterShapes = this.cache.json.get("characterShapes");
    this.head = this.matter.add
      .image(512, 200, "head", undefined, {
        shape: characterShapes.head,
      })
      .setDisplaySize(CHARACTER_WIDTH, CHARACTER_HEIGHT)
      .setCollisionCategory(1);
    this.body = this.matter.add
      .image(512, 384, "body", undefined, {
        shape: characterShapes.body,
      })
      .setDisplaySize(CHARACTER_WIDTH, CHARACTER_HEIGHT)
      .setCollisionCategory(1);
    this.leftArm = this.matter.add
      .image(750, 200, "left-arm", undefined, {
        shape: characterShapes.larm,
      })
      .setDisplaySize(CHARACTER_WIDTH, CHARACTER_HEIGHT)
      .setCollisionCategory(1);
    this.rightArm = this.matter.add
      .image(350, 200, "right-arm", undefined, {
        shape: characterShapes.rarm,
      })
      .setDisplaySize(CHARACTER_WIDTH, CHARACTER_HEIGHT)
      .setCollisionCategory(1);
    this.rightLeg = this.matter.add
      .image(750, 500, "right-leg", undefined, {
        shape: characterShapes.rleg,
      })
      .setDisplaySize(CHARACTER_WIDTH - 30, CHARACTER_HEIGHT - 30);
    this.leftLeg = this.matter.add
      .image(350, 500, "left-leg", undefined, {
        shape: characterShapes.lleg,
      })
      .setDisplaySize(CHARACTER_WIDTH - 30, CHARACTER_HEIGHT - 30);

    //@ts-ignore
    const neckLeft = this.matter.add.joint(this.head, this.body, 10, 0.5, {
      pointA: { x: 0, y: CHARACTER_HEIGHT / 2.6 },
      pointB: { x: -25, y: -CHARACTER_HEIGHT / 2.6 },
      angularStiffness: 0.5,
    });
    //@ts-ignore
    const neckRight = this.matter.add.joint(this.head, this.body, 10, 0.5, {
      pointA: { x: 0, y: CHARACTER_HEIGHT / 2.6 },
      pointB: { x: 25, y: -CHARACTER_HEIGHT / 2.6 },
      angularStiffness: 0.5,
    });

    const leftShoulder = this.matter.add.joint(
      //@ts-ignore
      this.leftArm,
      this.body,
      JOINT_LENGTH,
      JOINT_STIFFNESS,
      {
        pointA: { x: 35, y: -15 },
        pointB: { x: -25, y: -35 },
      }
    );

    const rightShoulder = this.matter.add.joint(
      //@ts-ignore
      this.rightArm,
      this.body,
      JOINT_LENGTH,
      JOINT_STIFFNESS,
      {
        pointA: { x: -35, y: -15 },
        pointB: { x: 25, y: -35 },
      }
    );

    const leftKnee = this.matter.add.joint(
      //@ts-ignore
      this.leftLeg,
      this.body,
      1,
      JOINT_STIFFNESS,
      {
        pointA: { x: 0, y: -20 },
        pointB: { x: -25, y: 35 },
      }
    );

    const rightKnee = this.matter.add.joint(
      //@ts-ignore
      this.rightLeg,
      this.body,
      1,
      JOINT_STIFFNESS,
      {
        pointA: { x: 0, y: -20 },
        pointB: { x: 25, y: 35 },
      }
    );
  }

  renderButtons() {
    this.fistButton = new TextButton(
      this,
      16,
      80,
      "Equip Fist",
      {
        color: "#0f0",
        backgroundColor: "blue",
        padding: { left: 10, right: 10, top: 10, bottom: 10 },
        shadow: { color: "#000", offsetX: 1, offsetY: 1, blur: 1 },
      },
      () => {}
    );

    this.knivesButton = new TextButton(
      this,
      16,
      125,
      "Equip Knives",
      {
        color: "#0f0",
        backgroundColor: "blue",
        padding: { left: 10, right: 10, top: 10, bottom: 10 },
        shadow: { color: "#000", offsetX: 1, offsetY: 1, blur: 1 },
      },
      () => {}
    );

    this.desertEagleButton = new TextButton(
      this,
      16,
      170,
      "Equip Desert Eagle",
      {
        color: "#0f0",
        backgroundColor: "blue",
        padding: { left: 10, right: 10, top: 10, bottom: 10 },
        shadow: { color: "#000", offsetX: 1, offsetY: 1, blur: 1 },
      },
      () => {}
    );

    this.tommyGunButton = new TextButton(
      this,
      16,
      215,
      "Equip Tommy Gun",
      {
        color: "#0f0",
        backgroundColor: "blue",
        padding: { left: 10, right: 10, top: 10, bottom: 10 },
        shadow: { color: "#000", offsetX: 1, offsetY: 1, blur: 1 },
      },
      () => {}
    );

    this.rocketLauncherButton = new TextButton(
      this,
      16,
      260,
      "Equip Rocket Launcher",
      {
        color: "#0f0",
        backgroundColor: "blue",
        padding: { left: 10, right: 10, top: 10, bottom: 10 },
        shadow: { color: "#000", offsetX: 1, offsetY: 1, blur: 1 },
      },
      () => {}
    );

    this.add.existing(this.fistButton);
    this.add.existing(this.knivesButton);
    this.add.existing(this.desertEagleButton);
    this.add.existing(this.tommyGunButton);
    this.add.existing(this.rocketLauncherButton);
  }

  spawnProjectile(
    startPoint: Phaser.Math.Vector2,
    targetPoint: Phaser.Math.Vector2
  ): void {
    // Calculate angle between start and target points
    const angle = Phaser.Math.Angle.Between(
      startPoint.x,
      startPoint.y,
      targetPoint.x,
      targetPoint.y - 50
    );
    const speed = 80;

    // // Create triangular bullet at start point
    const projectile = this.matter.add
      .image(startPoint.x + 20, startPoint.y, "circle", undefined, {
        angle: Math.random() * 6.28,
        friction: 0,
        frictionStatic: 0,
        frictionAir: 0,
        restitution: 1,
        render: { fillColor: 0xffff00 },
        ignorePointer: true,
        onCollideCallback: (pair: MatterJS.Pair) => {
          destroy();
        },

        // Store when bullet should be removed
        // lifespan: this.time.now + 1500 // 1.5 seconds
      })
      .setCollisionCategory(2);

    const destroy = () => {
      projectile.destroy();
    };

    // Set velocity based on angle to target
    this.matter.setVelocity(
      projectile,
      speed * Math.cos(angle),
      speed * Math.sin(angle)
    );

    // // Add random spin
    // this.matter.setAngularVelocity(projectile, (Math.random() - 0.5) * 1);

    // // Track bullet for cleanup
    //
    // this.bullets.push(projectile);

    // Reduce health on impact
    this.health -= 2;
    if (this.health < 0) this.health = 0;

    // Emit health changed event
    this.events.emit("health-changed", this.health);

    // Remove the bullet
    // const bulletIndex = this.bullets.indexOf(projectile);
    // if (bulletIndex > -1) {
    //   this.bullets.splice(bulletIndex, 1);
    // }
  }

  detectBulletImpacts() {
    // Check collisions between bullets and body parts
  }

  create() {
    this.add.image(1024 / 2, 768 / 2, "bg").setDisplaySize(1024, 768);
    this.matter.world.setBounds(0, 0, 1024, 768, 100, true, true, true, true);
    this.matter.add.mouseSpring({ length: 0.1, stiffness: 1 });
    this.matter.world.autoUpdate = true;
    EventBus.emit("current-scene-ready", this);
    this.renderCharacter();
    this.renderButtons();

    const weaponShapes = this.cache.json.get("weaponShapes");
    const deg = this.matter.add
      .image(1024 / 2, 768 / 2, "deg", undefined, {
        shape: weaponShapes.deg,
        ignorePointer: true,
        ignoreGravity: true,
      })
      .setDisplaySize(200, 100)
      .setCollisionCategory(2);

    this.input.on(
      "pointerdown",
      (pointer: Phaser.Input.Pointer) => {
        this.input.mouse?.requestPointerLock();
        // Create circle with physics body
        console.log(pointer.x, pointer.y);
        this.spawnProjectile(
          new Phaser.Math.Vector2(
            deg.angle < 0 ? deg.x - 100 : deg.x + 100,
            deg.y
          ),
          new Phaser.Math.Vector2(this.body.x, this.body.y)
        );
        // this.matter.add.image(pointer.x, pointer.y, "circle", undefined, {
        //   shape: {
        //     type: "circle",
        //     radius: 40,
        //   },
        // });
      },
      this
    );

    const moveGun = (pointer: Phaser.Input.Pointer) => {
      if (this?.input?.mouse?.locked) {
        deg.x += pointer.movementX;
        deg.y += pointer.movementY;

        // Force the sprite to stay on screen
        deg.x = Phaser.Math.Wrap(deg.x, 0, this.game.renderer.width);
        deg.y = Phaser.Math.Wrap(deg.y, 0, this.game.renderer.height);

        const angle = Phaser.Math.Angle.Between(
          this.body.x,
          this.body.y,
          deg.x,
          deg.y
        );

        deg.setAngle(Phaser.Math.RadToDeg(angle)); // Add 90 degrees to point the left side

        if (pointer.movementX > 0) {
          // deg.setRotation(0.1);
        } else if (pointer.movementX < 0) {
          // deg.setRotation(-0.1);
        } else {
          // deg.setRotation(0);
        }
      }
    };

    this.input.on("pointermove", moveGun, this);

    // Create health bar background
    const healthBarBackground = this.add.rectangle(512, 30, 300, 20, 0x000000);
    healthBarBackground.setScrollFactor(0);

    // Create health bar fill
    const healthBarFill = this.add.rectangle(512, 30, 300, 20, 0xff0000);
    healthBarFill.setScrollFactor(0);

    // Create health text
    const healthText = this.add.text(512, 30, `${this.health}%`, {
      fontSize: "16px",
      color: "#ffffff",
    });
    healthText.setOrigin(0.5);
    healthText.setScrollFactor(0);

    // Update health bar when health changes
    this.events.on("health-changed", () => {
      console.log("health changed", this.health);
      const healthPercent = this.health / 100;
      healthBarFill.setScale(healthPercent, 1);
      healthBarFill.setX(512 - (300 * (1 - healthPercent)) / 2);
      healthText.setText(`${this.health}%`);
    });

    this.events.on(
      "collisionStart",
      (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
        console.log("collision start", event);
        const pairs = event.pairs;

        for (const pair of pairs) {
          const bodyA = pair.bodyA;
          const bodyB = pair.bodyB;

          // Check if one body is a bullet
          const bullet = this.bullets.find((b) => b === bodyA || b === bodyB);
          if (!bullet) continue;

          // Check if other body is a character part
          const characterParts = [
            this.head,
            this.body,
            this.leftArm,
            this.rightArm,
            this.leftLeg,
            this.rightLeg,
          ];

          const hitPart = characterParts.find(
            (part) => part.body === bodyA || part.body === bodyB
          );
        }
      }
    );

    // this.updateClickCountText();

    // this.starBody.onCollideCallback = (pair: MatterJS.Pair) => {
    //   console.log(pair);
    // };

    // this.scoreText = this.add.text(16, 16, "score: 0", {
    //   fontSize: "32px",
    //   color: "#ffffff",
    // });
  }

  // updateClickCountText() {
  //   this.clickCountText.setText(
  //     `Button has been clicked ${this.clickCount} times.`
  //   );
  //   this.clickCount++;
  // }

  updateStarBody() {
    this.score++;
    this.scoreText.setText(`score: ${this.score}`);
  }

  changeScene() {
    this.scene.start("GameOver");
  }

  update(time: number, delta: number): void {
    const cam = this.cameras.main;
    cam.centerToBounds();

    // Display FPS counter
    const fps = Math.round(1000 / delta);
    if (!this.fpsText) {
      this.fpsText = this.add
        .text(16, 50, `FPS: ${fps}`, {
          fontSize: "18px",
          color: "#fff",
        })
        .setScrollFactor(0);
    } else {
      this.fpsText.setText(`FPS: ${fps}`);
    }

    const isOutOfBounds = (part: Phaser.Physics.Matter.Image) => {
      return part && (part.x > 1024 || part.x < 0);
    };

    if (
      isOutOfBounds(this.head) ||
      isOutOfBounds(this.body) ||
      isOutOfBounds(this.leftArm) ||
      isOutOfBounds(this.rightArm) ||
      isOutOfBounds(this.leftLeg) ||
      isOutOfBounds(this.rightLeg)
    ) {
      const centerX = 1024 / 2;
      const centerY = 768 / 2;

      this.head.setPosition(512, 200);
      this.body.setPosition(512, 384);
      this.leftArm.setPosition(750, 200);
      this.rightArm.setPosition(350, 200);
      this.leftLeg.setPosition(350, 500);
      this.rightLeg.setPosition(750, 500);
    }
  }
}

export class TextButton extends Phaser.GameObjects.Text {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    style: Phaser.Types.GameObjects.Text.TextStyle,
    callback: () => void
  ) {
    super(scene, x, y, text, style);

    this.setInteractive({ useHandCursor: true })
      .on("pointerover", () => this.enterButtonHoverState())
      .on("pointerout", () => this.enterButtonRestState())
      .on("pointerdown", () => this.enterButtonActiveState())
      .on("pointerup", () => {
        this.enterButtonHoverState();
        callback();
      });
  }

  enterButtonHoverState() {
    this.setStyle({ fill: "#ff0" });
  }

  enterButtonRestState() {
    this.setStyle({ fill: "#0f0" });
  }

  enterButtonActiveState() {
    this.setStyle({ fill: "#0ff" });
  }
}

