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

// TODO: Make the gun fire when mouseDown and stop when mouseUp, also only show the weapon when it's selected
// TODO: Make a box arround the button areas so that the weapon mechanics dont fire in that area and we can click the buttons

export default class Game extends Phaser.Scene {
  private moveCam: boolean;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private fpsText!: Phaser.GameObjects.Text;
  private clickCountText!: Phaser.GameObjects.Text;
  private clickButton!: TextButton;
  private clickCount = 0;
  private fistButton!: TextButton;
  private knivesButton!: TextButton;
  private desertEagleButton!: TextButton;
  private tommyGunButton!: TextButton;
  private rocketLauncherButton!: TextButton;

  private starBody!: MatterJS.BodyType;
  private head!: Phaser.Physics.Matter.Image;
  private body!: Phaser.Physics.Matter.Image;
  private leftArm!: Phaser.Physics.Matter.Image;
  private rightArm!: Phaser.Physics.Matter.Image;
  private leftLeg!: Phaser.Physics.Matter.Image;
  private rightLeg!: Phaser.Physics.Matter.Image;
  private headText!: Phaser.GameObjects.Text;

  private deg!: Phaser.GameObjects.Image;
  private tommyGun!: Phaser.GameObjects.Image;
  private weaponTip!: Phaser.GameObjects.Arc;

  private currentWeapon?: Phaser.GameObjects.Image;
  private pointerOver: boolean = false;

  private barrelPoint!: Phaser.Math.Vector2;

  private weapon:
    | "fist"
    | "knives"
    | "desert-eagle"
    | "tommy-gun"
    | "rocket-launcher" = "desert-eagle";

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

  spawnProjectile(
    startPoint: Phaser.Math.Vector2,
    targetPoint: Phaser.Math.Vector2
  ): void {
    // Calculate angle between start and target points
    const angle = Phaser.Math.Angle.Between(
      startPoint.x,
      startPoint.y,
      targetPoint.x,
      targetPoint.y
    );
    const speed = 80;

    const bullet = this.add.circle(
      this.barrelPoint.x,
      this.barrelPoint.y,
      10,
      0xffff00
    );

    const matterBullet = this.matter.add.gameObject(bullet, {
      friction: 0,
      frictionStatic: 0,
      frictionAir: 0,
      restitution: 1,
      render: {
        fillColor: 0xffff00,
        lineColor: 0xffff00,
        lineThickness: 2,
        opacity: 1,
        visible: true,
      },
      ignorePointer: true,
      shape: {
        type: "circle",
        radius: 10,
      },
      onCollideCallback: () => {
        matterBullet.destroy();
      },
    });

    // Set velocity based on angle to target
    this.matter.setVelocity(
      matterBullet,
      speed * Math.cos(angle),
      speed * Math.sin(angle)
    );

    // Reduce health on impact
    this.health -= 2;
    if (this.health < 0) this.health = 0;

    // Emit health changed event
    this.events.emit("health-changed", this.health);
  }

  detectBulletImpacts() {
    // Check collisions between bullets and body parts
  }

  fireDeg() {
    if (this.weapon !== "fist" && this.deg && this.currentWeapon) {
      const pointer = this.input.activePointer;
      const worldPoint = pointer.positionToCamera(
        this.cameras.main
      ) as Phaser.Math.Vector2;

      // Calculate spawn position offset based on gun angle and flip
      const spawnOffset = this.deg.flipX ? -100 : 100;
      const spawnX = this.deg.x + spawnOffset;

      this.spawnProjectile(
        new Phaser.Math.Vector2(spawnX, this.deg.y),
        new Phaser.Math.Vector2(this.body.x, this.body.y)
      );
    }
  }

  setWeapon(
    weapon:
      | "fist"
      | "knives"
      | "desert-eagle"
      | "tommy-gun"
      | "rocket-launcher"
      | undefined
  ) {
    // Remove current weapon from display
    if (this.currentWeapon) {
      this.currentWeapon.removeFromDisplayList();
    }

    // Set and show the appropriate weapon
    switch (weapon) {
      case "desert-eagle":
        this.weapon = "desert-eagle";
        this.currentWeapon = this.deg;
        break;
      case "tommy-gun":
        this.weapon = "tommy-gun";
        this.currentWeapon = this.tommyGun;
        break;
      default:
        this.currentWeapon = undefined;
        return;
    }

    if (this.currentWeapon) {
      this.currentWeapon.addToDisplayList();
    }
  }

  updateWeaponPosition() {
    if (!this.currentWeapon || !this.currentWeapon.getDisplayList()) {
      return;
    }

    const pointer = this.input.activePointer;
    const worldPoint = pointer.positionToCamera(
      this.cameras.main
    ) as Phaser.Math.Vector2;
    this.currentWeapon.setPosition(worldPoint.x, worldPoint.y);

    // Calculate angle between weapon and body
    const angle = Phaser.Math.Angle.Between(
      this.currentWeapon.x,
      this.currentWeapon.y,
      this.body.x,
      this.body.y
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
      this.weapon === "tommy-gun"
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

    this.weaponTip.setPosition(tipX, tipY);
    this.barrelPoint = new Phaser.Math.Vector2(tipX, tipY);
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
      () => {
        console.log("desert-eagle");
        this.setWeapon("desert-eagle");
        // this.input.setDefaultCursor("none");
      }
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
      () => {
        console.log("tommy-gun");
        this.setWeapon("tommy-gun");
      }
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

  create() {
    this.add
      .image(1024 / 2, 768 / 2, "bg")
      .setDisplaySize(1024, 768)
      .setDepth(-2);
    this.matter.world.setBounds(0, 0, 1024, 768, 100, true, true, true, true);
    this.matter.add.mouseSpring({ length: 0.1, stiffness: 1 });
    this.matter.world.autoUpdate = true;
    EventBus.emit("current-scene-ready", this);
    this.renderCharacter();
    this.renderButtons();

    const text = this.add.text(0, 728, `Pointer Over ${this.pointerOver}`, {
      fontSize: "16px",
      color: "#ffffff",
    });

    const rec = this.add
      .rectangle(0, 0, 500, 768 * 2, 0x000000, 0.5)
      .setDepth(-1)
      .setInteractive()
      .on("pointerover", () => {
        this.pointerOver = true;
        text.setText(`Pointer Over ${this.pointerOver}`);
        rec.setFillStyle(0xff0000, 0.5);
      })
      .on("pointerout", () => {
        this.pointerOver = false;
        text.setText(`Pointer Over ${this.pointerOver}`);
        rec.setFillStyle(0x000000, 0.5);
      })
      .on("pointerdown", () => {
        rec.setFillStyle(0x00ff00, 0.5);
      })
      .on("pointerup", () => {
        rec.setFillStyle(0x000000, 0.5);
      });

    const weaponShapes = this.cache.json.get("weaponShapes");

    this.deg = this.add
      .image(1024 / 2, 768 / 2, "deg", undefined)
      .setDisplaySize(200, 100)
      .setInteractive()
      .removeFromDisplayList();

    this.tommyGun = this.add
      .image(1024 / 2, 768 / 2, "tommy", undefined)
      .setDisplaySize(200, 100)
      .setInteractive()
      .removeFromDisplayList();

    this.weaponTip = this.add.circle(this.deg.x, this.deg.y, 4, 0xff0000);

    this.input.on(
      "pointerdown",
      (pointer: Phaser.Input.Pointer) => {
        this.fireDeg()
        // if (pointer.x > 500) {
        //   // this.currentWeapon?.addToDisplayList();
        //   this.fireDeg();
        // }
        // Only spawn projectiles if weapon is not fist
      },
      this
    );
    // this.input.on("pointerup", () => {
    //   this.setWeapon(undefined);
    // });

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

    // this.input.on("pointermove", moveGun, this);

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

  update(time: number, delta: number): void {
    const cam = this.cameras.main;
    cam.centerToBounds();
    this.displayFps(delta);
    this.ensureCharacterBounds();
    this.updateWeaponPosition();

    // Move deg to cursor position if it exists and handle flipping
    // if (this.deg && this.deg.getDisplayList()) {
    //   const pointer = this.input.activePointer;
    //   const worldPoint = pointer.positionToCamera(
    //     this.cameras.main
    //   ) as Phaser.Math.Vector2;
    //   this.deg.setPosition(worldPoint.x, worldPoint.y);

    //   // Calculate angle between gun and body
    //   const angle = Phaser.Math.Angle.Between(
    //     this.deg.x,
    //     this.deg.y,
    //     this.body.x,
    //     this.body.y
    //   );
    //   // Add 180 degrees (π radians) to flip the gun around so barrel points at body
    //   const adjustedAngle = angle + Math.PI;
    //   // Normalize angle to be between -π and π
    //   const normalizedAngle =
    //     ((adjustedAngle + Math.PI) % (Math.PI * 2)) - Math.PI;
    //   // Flip gun when angle would make it appear upside down
    //   this.deg.setFlipX(
    //     normalizedAngle > Math.PI / 2 || normalizedAngle < -Math.PI / 2
    //   );
    //   // Set rotation, adjusting for flip
    //   this.deg.setRotation(
    //     this.deg.flipX ? adjustedAngle + Math.PI : adjustedAngle
    //   );

    //   // Update weapon tip position based on gun position and rotation

    //   // Constants based on gun display size
    //   const GUN_SCALE = {
    //     length: this.deg.displayWidth * 0.3, // 30% of gun width for barrel length
    //     barrelOffset: this.deg.displayHeight * 0.2, // 20% of gun height for barrel alignment
    //   };

    //   /**
    //    * Calculates weapon tip position based on gun position, rotation and flip state
    //    * @param {number} gunX - Gun x position
    //    * @param {number} gunY - Gun y position
    //    * @param {number} rotation - Current gun rotation
    //    * @param {boolean} isFlipped - Gun flip state
    //    * @returns {[number, number]} [tipX, tipY] coordinates
    //    */
    //   const calculateTipPosition = (
    //     gunX: number,
    //     gunY: number,
    //     rotation: number,
    //     isFlipped: boolean
    //   ) => {
    //     // Calculate total angle based on gun rotation and flip state
    //     const totalAngle = rotation + (isFlipped ? Math.PI : 0);
    //     // Calculate perpendicular angle for barrel alignment
    //     const perpAngle = totalAngle + Math.PI / 2;
    //     // Calculate final position with barrel alignment offset
    //     return [
    //       gunX +
    //         Math.cos(totalAngle) * -GUN_SCALE.length +
    //         Math.cos(perpAngle) *
    //           (isFlipped ? GUN_SCALE.barrelOffset : -GUN_SCALE.barrelOffset),
    //       gunY +
    //         Math.sin(totalAngle) * -GUN_SCALE.length +
    //         Math.sin(perpAngle) *
    //           (isFlipped ? GUN_SCALE.barrelOffset : -GUN_SCALE.barrelOffset),
    //     ];
    //   };

    //   // Get tip position and update weapon tip
    //   const [tipX, tipY] = calculateTipPosition(
    //     this.deg.x,
    //     this.deg.y,
    //     this.deg.rotation,
    //     this.deg.flipX
    //   );
    //   this.weaponTip.setPosition(tipX, tipY);
    // }
  }

  changeScene() {
    this.scene.start("GameOver");
  }

  ensureCharacterBounds() {
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
      const centerX = this.game.renderer.width / 2;
      const centerY = this.game.renderer.height / 2;

      this.head.setPosition(512, 200);
      this.body.setPosition(512, 384);
      this.leftArm.setPosition(750, 200);
      this.rightArm.setPosition(350, 200);
      this.leftLeg.setPosition(350, 500);
      this.rightLeg.setPosition(750, 500);
    }
  }

  displayFps(delta: number) {
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

