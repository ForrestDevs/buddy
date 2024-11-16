/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { IPair } from "matter";
import { EventBus } from "../EventBus";
import Phaser, { Scene } from "phaser";
/* END-USER-IMPORTS */

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

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

  private currentWeapon?: Phaser.GameObjects.Sprite;
  private pointerOver: boolean = false;

  private barrelPoint!: Phaser.Math.Vector2;

  private deaglePack!: Phaser.Loader.FileTypes.JSONFile;

  private weaponText!: Phaser.GameObjects.Text;
  private killCountText!: Phaser.GameObjects.Text;

  private weapon?:
    | "fist"
    | "knives"
    | "desert-eagle"
    | "tommy-gun"
    | "rocket-launcher";

  private bullets: MatterJS.BodyType[] = [];

  private health = 100;
  private killCount = 0;

  private weaponSelectionArea!: Phaser.GameObjects.Rectangle;
  private showWeapon = false;
  private firingTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super("MainGame");
  }

  init() {
    this.cursors = this.input?.keyboard?.createCursorKeys()!;
  }

  loadAssets() {
    this.deaglePack = this.cache.json.get("deaglePack");
    this.add
      .image(1280 / 2, 720 / 2, "bg1")
      .setDisplaySize(1280, 720)
      .setDepth(-2);
  }

  createHealthBar() {
    // Create health bar background
    const healthBarBackground = this.add.rectangle(
      1280 / 2,
      30,
      300,
      20,
      0x000000
    );
    healthBarBackground.setScrollFactor(0);

    // Create health bar fill
    const healthBarFill = this.add.rectangle(1280 / 2, 30, 300, 20, 0xff0000);
    healthBarFill.setScrollFactor(0);

    // Create health text
    const healthText = this.add.text(1280 / 2, 30, `${this.health}%`, {
      fontSize: "16px",
      color: "#ffffff",
    });

    healthText.setOrigin(0.5);
    healthText.setScrollFactor(0);

    this.killCountText = this.add.text(GAME_WIDTH / 2 + 310, 30, `Kills: 0`, {
      fontSize: "16px",
      color: "#ffffff",
    });

    // Update health bar when health changes
    this.events.on("health-changed", () => {
      console.log("health changed", this.health);
      const healthPercent = this.health / 100;
      healthBarFill.setScale(healthPercent, 1);
      healthBarFill.setX(GAME_WIDTH/2 - (300 * (1 - healthPercent)) / 2);
      healthText.setText(`${this.health}%`);
    });
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
      10,
      60,
      "Fists",
      {
        color: "#0f0",
        backgroundColor: "blue",
        padding: { left: 10, right: 10, top: 10, bottom: 10 },
        shadow: { color: "#000", offsetX: 1, offsetY: 1, blur: 1 },
      },
      () => {
        this.setWeapon(undefined);
      }
    );

    // this.knivesButton = new TextButton(
    //   this,
    //   16,
    //   125,
    //   "Equip Knives",
    //   {
    //     color: "#0f0",
    //     backgroundColor: "blue",
    //     padding: { left: 10, right: 10, top: 10, bottom: 10 },
    //     shadow: { color: "#000", offsetX: 1, offsetY: 1, blur: 1 },
    //   },
    //   () => {}
    // );

    this.desertEagleButton = new TextButton(
      this,
      10,
      100,
      "Deagle",
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
      10,
      140,
      "Tommy",
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

    // this.rocketLauncherButton = new TextButton(
    //   this,
    //   16,
    //   260,
    //   "Equip Rocket Launcher",
    //   {
    //     color: "#0f0",
    //     backgroundColor: "blue",
    //     padding: { left: 10, right: 10, top: 10, bottom: 10 },
    //     shadow: { color: "#000", offsetX: 1, offsetY: 1, blur: 1 },
    //   },
    //   () => {}
    // );

    this.add.existing(this.fistButton);
    // this.add.existing(this.knivesButton);
    this.add.existing(this.desertEagleButton);
    this.add.existing(this.tommyGunButton);
    // this.add.existing(this.rocketLauncherButton);
  }

  createWeaponSelectionArea() {
    const text = this.add.text(0, 728, `Pointer Over ${this.pointerOver}`, {
      fontSize: "16px",
      color: "#ffffff",
    });
    this.weaponSelectionArea = this.add
      .rectangle(0, 0, 200, 768 * 2, 0x000000, 0)
      .setDepth(-1)
      .setInteractive()
      .on("pointerover", () => {
        this.pointerOver = true;
        // text.setText(`Pointer Over ${this.pointerOver}`);
        // this.weaponSelectionArea.setFillStyle(0xff0000, 0.5);
      })
      .on("pointerout", () => {
        this.pointerOver = false;
        // text.setText(`Pointer Over ${this.pointerOver}`);
        // this.weaponSelectionArea.setFillStyle(0x000000, 0.5);
      })
      .on("pointerdown", () => {
        // this.weaponSelectionArea.setFillStyle(0x00ff00, 0.5);
      })
      .on("pointerup", () => {
        // this.weaponSelectionArea.setFillStyle(0x000000, 0.5);
      });
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

    // Destroy any previous weapon
    if (this.weapon && this.currentWeapon) {
      this.currentWeapon.destroy();
      this.weapon = undefined;
    }

    // Set and show the appropriate weapon
    switch (weapon) {
      case "desert-eagle":
        this.weapon = "desert-eagle";

        this.currentWeapon = this.add
          .sprite(1024 / 2, 768 / 2, "base-deg")
          .setDisplaySize(200, 100)
          .removeFromDisplayList()
          .setName("deagle");

        break;
      case "tommy-gun":
        this.weapon = "tommy-gun";
        this.currentWeapon = this.add
          .sprite(1024 / 2, 768 / 2, "tommy")
          .setDisplaySize(200, 100)
          .removeFromDisplayList()
          .setName("tommy");

        break;
      default:
        this.currentWeapon = undefined;
        return;
    }

    // if (!this.weaponTip && this.currentWeapon) {
    //   this.weaponTip = this.add.circle(
    //     this.currentWeapon.x,
    //     this.currentWeapon.y,
    //     4,
    //     0xff0000
    //   );
    // }
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
    const speed = 50;

    const bullet = this.add
      .image(this.barrelPoint.x, this.barrelPoint.y, "deg-bullet")
      .setScale(0.06, 0.1);

    const matterBullet = this.matter.add.gameObject(bullet, {
      friction: 0,
      frictionStatic: 0,
      frictionAir: 0,
      restitution: 1,
      angle: angle + Math.PI,
      ignorePointer: true,
      shape: {
        type: "circle",
        radius: 10,
      },
      onCollideCallback: () => {
        matterBullet.destroy();
        // Reduce health on impact
        this.health -= 0.5;
        if (this.health < 0) this.health = 0;
        this.events.emit("health-changed", this.health);
      },
    });

    // matterBullet.setAngle(angle);

    // Set velocity based on angle to target
    this.matter.setVelocity(
      matterBullet,
      speed * Math.cos(angle),
      speed * Math.sin(angle)
    );
  }

  fireWeapon() {
    // Don't fire if pointer is over weapon selection area
    if (this.pointerOver) {
      return;
    }

    // Don't fire if no weapon equipped or weapon not visible
    if (!this.currentWeapon || !this.currentWeapon.getDisplayList()) {
      return;
    }

    // Don't fire if using fists
    if (this.weapon === "fist") {
      return;
    }

    // Calculate spawn position offset based on gun angle and flip
    const spawnOffset = this.currentWeapon.flipX ? -100 : 100;
    const spawnX = this.currentWeapon.x + spawnOffset;

    // Play weapon firing animation if it exists
    if (this.weapon === "desert-eagle") {
      this.currentWeapon
        .play("fireDeagle")
        .on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
          this.events.emit("deagle-fired");
        });
      // Spawn the projectile
    } else if (this.weapon === "tommy-gun") {
      this.currentWeapon
        .play("fireTommy")
        .on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
          this.events.emit("tommy-fired");
        });
    }
    this.spawnProjectile(
      new Phaser.Math.Vector2(spawnX, this.currentWeapon.y),
      new Phaser.Math.Vector2(this.body.x, this.body.y)
    );

    // if (this.weapon !== "fist" && this.currentWeapon?.getDisplayList()) {
    //   const pointer = this.input.activePointer;
    //   const worldPoint = pointer.positionToCamera(
    //     this.cameras.main
    //   ) as Phaser.Math.Vector2;

    //   // Calculate spawn position offset based on gun angle and flip
    //   const spawnOffset = this.currentWeapon.flipX ? -100 : 100;
    //   const spawnX = this.currentWeapon.x + spawnOffset;

    //   this.spawnProjectile(
    //     new Phaser.Math.Vector2(spawnX, this.currentWeapon.y),
    //     new Phaser.Math.Vector2(this.body.x, this.body.y)
    //   );
    // }
  }

  showAndFireWeapon() {
    if (!this.showWeapon) {
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

    // Set up weapon-specific firing behavior
    let fireRate = 0;
    let fireEvent = "";
    let bulletsPerBurst = 1;
    let burstDelay = 0;

    switch (this.weapon) {
      case "tommy-gun":
        fireRate = 100; // Reduced overall fire rate
        fireEvent = "tommy-fired";
        bulletsPerBurst = 20; // Fewer bullets per burst
        burstDelay = 50; // Increased delay between bullets
        break;
      case "desert-eagle":
        fireRate = 500;
        fireEvent = "deagle-fired";
        bulletsPerBurst = 1;
        break;
      default:
        return; // Exit if no valid weapon
    }

    let canFire = true;

    // Start firing immediately on pointerdown
    if (this.input.activePointer.isDown) {
      this.fireWeapon();
    }

    this.firingTimer = this.time.addEvent({
      delay: fireRate,
      callback: () => {
        if (this.input.activePointer.isDown && canFire) {
          canFire = false;

          if (bulletsPerBurst > 1) {
            // For burst weapons like tommy gun
            let bulletsShot = 0;
            const burstTimer = this.time.addEvent({
              delay: burstDelay,
              callback: () => {
                this.fireWeapon();
                bulletsShot++;
                if (bulletsShot >= bulletsPerBurst) {
                  burstTimer.destroy();
                  // Allow next burst after a short delay
                  this.time.delayedCall(300, () => {
                    canFire = true;
                  });
                }
              },
              repeat: bulletsPerBurst - 1,
            });
          } else {
            // For single shot weapons like desert eagle
            this.fireWeapon();
            // Re-enable firing after animation completes
            this.events.once(fireEvent, () => {
              canFire = true;
            });
          }
        }
      },
      loop: true,
    });
  }

  hideWeapon() {
    if (this.currentWeapon && this.currentWeapon.getDisplayList()) {
      this.currentWeapon.removeFromDisplayList();
    }
  }

  create() {
    this.matter.world.setBounds(0, 0, 1280, 720, 100, true, true, true, true);
    this.matter.add.mouseSpring({ length: 0.1, stiffness: 1 });
    this.matter.world.autoUpdate = true;
    EventBus.emit("current-scene-ready", this);
    this.loadAssets();
    this.renderCharacter();
    this.renderButtons();
    this.createHealthBar();
    this.createWeaponSelectionArea();

    this.weaponText = this.add.text(
      10,
      30,
      `Weapon: ${this.weapon ?? "none"}`,
      {
        fontSize: "16px",
        color: "#ffffff",
      }
    );

    this.input.on("pointerdown", () => {
      this.showAndFireWeapon();
    });
    this.input.on("pointerup", () => {
      this.hideWeapon();
    });

    // const deg = this.add
    //   .sprite(1024 / 2, 768 / 2, "deg")
    //   .setDisplaySize(400, 200);

    // deg.play("fireDeagle");

    // this.input.on("pointerdown", function () {
    //   if (deg.anims.isPlaying) {
    //     deg.stop();
    //   } else {
    //     deg.play("fireDeagle");
    //   }
    // });

    // this.tommyGun = this.add
    //   .image(1024 / 2, 768 / 2, "tommy", undefined)
    //   .setDisplaySize(200, 100)
    //   .setInteractive()
    //   .removeFromDisplayList();

    // this.weaponTip = this.add.circle(this.deg.x, this.deg.y, 4, 0xff0000);
  }

  updateWeaponPosition() {
    if (!this.currentWeapon) {
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

    // this.weaponTip.setPosition(tipX, tipY);
    this.barrelPoint = new Phaser.Math.Vector2(tipX, tipY);
  }

  update(time: number, delta: number): void {
    const cam = this.cameras.main;
    cam.centerToBounds();
    this.displayFps(delta);
    this.ensureCharacterBounds();
    this.updateWeaponPosition();
    // Hide weapon if pointer is in weapon selection area and weapon is equipped
    this.weaponSelectionAreaPointerOver();

    this.weaponText.setText(`Weapon: ${this.weapon ?? "none"}`);

    if (this.health <= 0) {
      this.killCount++;
      this.killCountText.setText(`Kills: ${this.killCount}`);
      this.health = 100;
    }
  }

  weaponSelectionAreaPointerOver() {
    if (
      Phaser.Geom.Rectangle.Contains(
        this.weaponSelectionArea.getBounds(),
        this.input.activePointer.x,
        this.input.activePointer.y
      )
    ) {
      this.showWeapon = false;
    } else if (
      !Phaser.Geom.Rectangle.Contains(
        this.weaponSelectionArea.getBounds(),
        this.input.activePointer.x,
        this.input.activePointer.y
      ) &&
      !this.showWeapon
    ) {
      this.showWeapon = true;
    }
  }

  changeScene() {
    this.scene.start("GameOver");
  }

  ensureCharacterBounds() {
    const isOutOfBounds = (part: Phaser.Physics.Matter.Image) => {
      return part && (part.x > GAME_WIDTH || part.x < 0);
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
        .text(1100, 30, `FPS: ${fps}`, {
          fontSize: "18px",
          color: "#fff",
        })
        .setScrollFactor(0);
    } else {
      this.fpsText.setText(`FPS: ${fps}`);
    }
  }
}

// export class Weapon extends Phaser.GameObjects.Sprite {
//   private weaponType:
//     | "fist"
//     | "knives"
//     | "desert-eagle"
//     | "tommy-gun"
//     | "rocket-launcher";
//   public barrelPoint: Phaser.GameObjects.Arc;

//   constructor(
//     scene: Scene,
//     x: number,
//     y: number,
//     weaponType:
//       | "fist"
//       | "knives"
//       | "desert-eagle"
//       | "tommy-gun"
//       | "rocket-launcher",
//     texture: string
//   ) {
//     super(scene, x, y, texture);
//     this.weaponType = weaponType;
//     this.barrelPoint = scene.add.circle(x, y, 4, 0xff0000);
//   }

//   init() {
//     this.setDisplaySize(200, 100);
//     return this;
//   }

//   fire() {
//     // Don't fire if using fists
//     if (this.weaponType === "fist") {
//       return;
//     }

//     // Calculate spawn position offset based on gun angle and flip
//     const spawnOffset = this.flipX ? -100 : 100;
//     const spawnX = this.x + spawnOffset;

//     // Play weapon firing animation if it exists
//     if (this.weaponType === "desert-eagle") {
//       this.play("fireDeagle").on(
//         Phaser.Animations.Events.ANIMATION_COMPLETE,
//         () => {
//           this.scene.events.emit("weapon-fired");
//         }
//       );
//     } else if (this.weaponType === "tommy-gun") {
//       this.play("fireTommy");
//     }

//     // Spawn the projectile
//     this.spawnProjectile(
//       new Phaser.Math.Vector2(spawnX, this.y),
//       new Phaser.Math.Vector2(
//         this.scene.children.getByName("body")?.body?.position.x,
//         this.scene.children.getByName("body")?.body?.position.y
//       )
//     );
//   }

//   spawnProjectile(
//     startPoint: Phaser.Math.Vector2,
//     targetPoint: Phaser.Math.Vector2
//   ): void {
//     // Calculate angle between start and target points
//     const angle = Phaser.Math.Angle.Between(
//       startPoint.x,
//       startPoint.y,
//       targetPoint.x,
//       targetPoint.y
//     );
//     const speed = 50;

//     const bullet = this.scene.add
//       .image(this.barrelPoint.x, this.barrelPoint.y, "deg-bullet")
//       .setScale(0.06, 0.1);

//     const matterBullet = this.scene.matter.add.gameObject(bullet, {
//       friction: 0,
//       frictionStatic: 0,
//       frictionAir: 0,
//       restitution: 1,
//       angle: angle + Math.PI,
//       ignorePointer: true,
//       shape: {
//         type: "circle",
//         radius: 10,
//       },
//       onCollideCallback: () => {
//         matterBullet.destroy();
//         // Reduce health on impact
//         this.scene.health -= 2;
//         if (this.scene.health < 0) this.scene.health = 0;
//         this.scene.events.emit("health-changed", this.scene.health);
//       },
//     });

//     // Set velocity based on angle to target
//     this.scene.matter.setVelocity(
//       matterBullet,
//       speed * Math.cos(angle),
//       speed * Math.sin(angle)
//     );
//   }
// }

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

