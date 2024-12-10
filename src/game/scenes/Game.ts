import Phaser from "phaser";
import { EventBus } from "../EventBus";
import { Character } from "../classes/Character";
import { GameButtons } from "../classes/GameButtons";
import { JournalManager } from "../classes/Journal";
import { ScoreBar } from "../classes/ScoreBar";
import { SoundManager } from "../classes/SoundManager";
import { Weapon } from "../classes/Weapon";
import { Effects } from "../classes/Effects";

export default class Game extends Phaser.Scene {
  private bg!: Phaser.GameObjects.Image;
  private character!: Character;
  private effects!: Effects;
  private gameButtons!: GameButtons;
  private journalManager!: JournalManager;
  // private soundManager!: SoundManager;
  private scoreBar!: ScoreBar;
  private weaponObject!: Weapon;
  private pointerConstraint!: Phaser.Physics.Matter.PointerConstraint;
  private fpsText!: Phaser.GameObjects.Text;
  private pointerOver: boolean = false;
  private readonly characterTiers: string[] = ["paper", "sol", "mil", "musk"];

  constructor() {
    super("MainGame");
  }

  init() {
    this.matter.world.autoUpdate = false;
    this.matter.world.setBounds(50, 50, 1180, 620, 1000);
    // this.pointerConstraint = new Phaser.Physics.Matter.PointerConstraint(
    //   this.scene.scene,
    //   this.matter.world,
    //   {
    //     length: 0.1,
    //     stiffness: 1,
    //   }
    // );
    // this.matter.add.pointerConstraint({});
    const canDrag = this.matter.world.nextGroup();
    // this.matter.add.pointerConstraint({
    //   collisionFilter: {
    //     category: COLLISION_CATEGORIES.POINTER,
    //     mask: COLLISION_CATEGORIES.BOUNDS,
    //   },
    // });

    // this.matter.add.mouse

    this.matter.add.mouseSpring({
      length: 1,
      stiffness: 1,
      // @ts-ignore
      collisionFilter: { group: canDrag },
    });

    // this.soundManager = new SoundManager(this);
    this.scoreBar = new ScoreBar({
      scene: this,
      x: 640, // Adjust based on your game width
      y: 30, // Adjust based on your game height
      width: 300,
      health: 100,
    });
    this.gameButtons = new GameButtons({
      scene: this,
      x: 75,
      y: 200,
      spacing: 110, // Optional: adjust button spacing
    });
    this.journalManager = new JournalManager({
      scene: this,
      x: 1450,
      // x: this.HIDDEN_X,
      y: 360, // Vertical center of the screen
    });
    this.character = new Character({
      scene: this,
      x: 512,
      y: 200,
      tier: this.characterTiers[this.data.get("tier")] ?? "paper",
      collisionGroup: canDrag,
    });
    this.effects = new Effects(this);
    this.weaponObject = new Weapon(this, this.character, this.effects);
    EventBus.on("bg-change", (bg: string) => {
      this.bg.setTexture(bg);
    });
    EventBus.on("pointer-over-button", () => {
      this.pointerOver = true;
    });
    EventBus.on("pointer-out-button", () => {
      this.pointerOver = false;
    });
    EventBus.on("skin-equipped", (skin: string) => {
      this.character.changeSkin(skin);
    });
    EventBus.on("character-out-of-bounds", () => {
      // this.pointerConstraint.stopDrag();
    });
    this.input.on("pointerdown", () => {
      if (!this.weaponObject) return;
      // this.pointerConstraint.active = false;
      this.weaponObject.startFiring();
    });
    this.input.on("pointerup", () => {
      if (!this.weaponObject) return;
      // this.pointerConstraint.active = true;
      this.weaponObject.stopFiring();
    });
    this.events.emit("scene-awake");
  }

  create() {
    this.bg = this.add
      .image(1280 / 2, 720 / 2, "bg-main")
      .setDisplaySize(1280, 720)
      .setDepth(-2);

    EventBus.emit("current-scene-ready", this);
  }

  update(time: number, delta: number): void {
    this.updatePhysics(delta);
    // Display FPS counter
    const fps = Math.round(1000 / delta);
    if (!this.fpsText) {
      this.fpsText = this.add
        .text(30, 10, `FPS: ${fps}`, {
          color: "#fff",
        })
        .setScrollFactor(0);
    } else {
      this.fpsText.setText(`FPS: ${fps}`);
    }

    this.character.update();
    this.weaponObject.updateWeaponPosition();
  }

  private updatePhysics(delta: number) {
    // Run physics at 60Hz (16.666ms per step) for smooth simulation
    // This is a common refresh rate that balances smoothness and performance
    const fixedTimeStep = 1000 / 300; // Increased to 120Hz for smoother physics

    // Allow up to 3 steps per frame to prevent spiral of death
    // if frame rate drops temporarily
    const maxSteps = Math.min(3, Math.floor(delta / fixedTimeStep));

    // Run physics updates to catch up with any accumulated time
    for (let i = 0; i < maxSteps; i++) {
      this.matter.world.step(fixedTimeStep);
    }
  }

  changeScene() {
    this.scene.start("GameOver");
  }

  shutdown() {
    this.character.destroy();
    this.weaponObject.destroy();
    this.fpsText.destroy();
    this.bg.destroy();
    this.input.destroy();
    this.events.destroy();
    this.sound.destroy();
    this.scoreBar.destroy();
    this.journalManager.destroy();
  }
}

// private head!: Phaser.Physics.Matter.Image;
// private body!: Phaser.Physics.Matter.Image;
// private leftArm!: Phaser.Physics.Matter.Image;
// private rightArm!: Phaser.Physics.Matter.Image;
// private leftLeg!: Phaser.Physics.Matter.Image;
// private rightLeg!: Phaser.Physics.Matter.Image;
// private bloodSplatter!: Phaser.GameObjects.Sprite;
// private explosion!: Phaser.GameObjects.Sprite;
// private currentTierText!: Phaser.GameObjects.Text;
// private currentWeapon?: Phaser.GameObjects.Sprite;
// private pointerOver: boolean = false;
// private barrelPoint!: Phaser.Math.Vector2;
// private killCountText!: Phaser.GameObjects.Text;
// // Weapons
// private showWeapon = false;
// private weapon?: GameWeaponKey;
// private weaponText!: Phaser.GameObjects.Text;
// private weaponButtons: Map<string, TextButton> = new Map();
// private weaponSelectionArea!: Phaser.GameObjects.Rectangle;
// private firingTimer?: Phaser.Time.TimerEvent;
// private debugButton!: TextButton;

// this.weaponText = this.add.text(
//   850,
//   30,
//   `Weapon: ${this.weapon ?? "none"}`,
//   {
//     fontSize: "16px",
//     color: "#ffffff",
//   }
// );

// this.currentTierText = this.add.text(
//   1150,
//   90,
//   `Tier: ${this.data.get("tier") ?? "none"}`,
//   {
//     fontSize: "16px",
//     color: "#ffffff",
//   }
// );

// this.updateWeaponPosition();
// Hide weapon if pointer is in weapon selection area and weapon is equipped
// this.weaponSelectionAreaPointerOver();
// this.weaponText.setText(`Weapon: ${this.weapon ?? "none"}`);
// this.currentTierText.setText(`Tier: ${this.data.get("tier") ?? "none"}`);

// updateWeaponPosition() {
//   if (!this.currentWeapon) {
//     return;
//   }

//   const characterPos = this.character.getPosition();

//   const pointer = this.input.activePointer;
//   const worldPoint = pointer.positionToCamera(
//     this.cameras.main
//   ) as Phaser.Math.Vector2;

//   this.currentWeapon.setPosition(worldPoint.x, worldPoint.y);

//   // Calculate angle between weapon and body
//   const angle = Phaser.Math.Angle.Between(
//     this.currentWeapon.x,
//     this.currentWeapon.y,
//     characterPos.x,
//     characterPos.y
//   );

//   // Add 180 degrees to point barrel at body
//   const adjustedAngle = angle + Math.PI;

//   // Normalize angle between -π and π
//   const normalizedAngle =
//     ((adjustedAngle + Math.PI) % (Math.PI * 2)) - Math.PI;

//   // Flip weapon when angle would make it appear upside down
//   this.currentWeapon.setFlipX(
//     normalizedAngle > Math.PI / 2 || normalizedAngle < -Math.PI / 2
//   );

//   // Set rotation with flip adjustment
//   this.currentWeapon.setRotation(
//     this.currentWeapon.flipX ? adjustedAngle + Math.PI : adjustedAngle
//   );

//   // Scale constants for weapon tip positioning
//   // Different weapons need different scale multipliers
//   const GUN_SCALE =
//     this.weapon === "tommy"
//       ? {
//           length: this.currentWeapon.displayWidth * 0.5,
//           barrelOffset: this.currentWeapon.displayHeight * 0.08,
//         }
//       : {
//           length: this.currentWeapon.displayWidth * 0.3,
//           barrelOffset: this.currentWeapon.displayHeight * 0.2,
//         };

//   // Calculate weapon tip position
//   const totalAngle =
//     this.currentWeapon.rotation + (this.currentWeapon.flipX ? Math.PI : 0);
//   const perpAngle = totalAngle + Math.PI / 2;

//   const tipX =
//     this.currentWeapon.x +
//     Math.cos(totalAngle) * -GUN_SCALE.length +
//     Math.cos(perpAngle) *
//       (this.currentWeapon.flipX
//         ? GUN_SCALE.barrelOffset
//         : -GUN_SCALE.barrelOffset);

//   const tipY =
//     this.currentWeapon.y +
//     Math.sin(totalAngle) * -GUN_SCALE.length +
//     Math.sin(perpAngle) *
//       (this.currentWeapon.flipX
//         ? GUN_SCALE.barrelOffset
//         : -GUN_SCALE.barrelOffset);

//   // this.weaponTip.setPosition(tipX, tipY);
//   this.barrelPoint = new Phaser.Math.Vector2(tipX, tipY);
// }

// updateEffectPosition() {
//   this.bloodSplatter.setPosition(this.body.x, this.body.y);
//   this.explosion.setPosition(this.body.x, this.body.y);
// }
// weaponSelectionAreaPointerOver() {
//   if (
//     Phaser.Geom.Rectangle.Contains(
//       this.weaponSelectionArea.getBounds(),
//       this.input.activePointer.x,
//       this.input.activePointer.y
//     )
//   ) {
//     this.showWeapon = false;
//   } else if (
//     !Phaser.Geom.Rectangle.Contains(
//       this.weaponSelectionArea.getBounds(),
//       this.input.activePointer.x,
//       this.input.activePointer.y
//     ) &&
//     !this.showWeapon
//   ) {
//     this.showWeapon = true;
//   }
// }

// ensureCharacterBounds() {
//   const isOutOfBounds = (part: Phaser.Physics.Matter.Image) => {
//     return (
//       part &&
//       (part.x > GAME_WIDTH || part.x < 0) &&
//       (part.y > GAME_HEIGHT || part.y < 0)
//     );
//   };
//   if (
//     isOutOfBounds(this.head) ||
//     isOutOfBounds(this.body) ||
//     isOutOfBounds(this.leftArm) ||
//     isOutOfBounds(this.rightArm) ||
//     isOutOfBounds(this.leftLeg) ||
//     isOutOfBounds(this.rightLeg)
//   ) {
//     this.pointerConstraint.stopDrag();
//     const centerX = this.game.renderer.width / 2;
//     const centerY = this.game.renderer.height / 2;

//     this.head.setPosition(512, 200);
//     this.body.setPosition(512, 384);
//     this.leftArm.setPosition(750, 200);
//     this.rightArm.setPosition(350, 200);
//     this.leftLeg.setPosition(350, 500);
//     this.rightLeg.setPosition(750, 500);
//   }
// }

// private createHealthBar() {
//   // Create health bar background
//   const healthBarBackground = this.add.rectangle(
//     1280 / 2,
//     30,
//     300,
//     20,
//     0x000000
//   );
//   healthBarBackground.setScrollFactor(0);

//   // Create health bar fill
//   const healthBarFill = this.add.rectangle(1280 / 2, 30, 300, 20, 0xff0000);
//   healthBarFill.setScrollFactor(0);

//   // Create health text
//   const healthText = this.add.text(1280 / 2, 30, `${this.health}%`, {
//     fontSize: "16px",
//     color: "#ffffff",
//   });

//   healthText.setOrigin(0.5);
//   healthText.setScrollFactor(0);

//   this.killCountText = this.add.text(1150, 60, `Kills: 0`, {
//     fontSize: "16px",
//     color: "#ffffff",
//   });

//   // Update health bar when health changes
//   this.events.on("health-changed", () => {
//     console.log("health changed", this.health);
//     const healthPercent = this.health / 100;
//     healthBarFill.setScale(healthPercent, 1);
//     healthBarFill.setX(GAME_WIDTH / 2 - (300 * (1 - healthPercent)) / 2);
//     healthText.setText(`${this.health.toFixed(2)}%`);
//   });
// }

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

// private renderCharacter() {
//   const characterShapes = this.cache.json.get("characterShapes");

//   // Create body parts with more realistic physics properties
//   this.head = this.matter.add
//     .image(
//       512,
//       200,
//       `${this.characterTiers[this.data.get("tier")] ?? "paper"}-Head`,
//       undefined,
//       {
//         shape: characterShapes.head,
//         friction: 0.1,
//         restitution: 0.3,
//         density: 0.001, // Light head for better swinging
//       }
//     )
//     .setDisplaySize(CHARACTER_WIDTH, CHARACTER_HEIGHT)
//     .setCollisionCategory(1)
//     .setDepth(3);

//   this.body = this.matter.add
//     .image(
//       512,
//       384,
//       `${this.characterTiers[this.data.get("tier")] ?? "paper"}-Body`,
//       undefined,
//       {
//         shape: characterShapes.body,
//         friction: 0.1,
//         restitution: 0.3,
//         density: 0.005, // Heavier body acts as center of mass
//       }
//     )
//     .setDisplaySize(CHARACTER_WIDTH, CHARACTER_HEIGHT)
//     .setCollisionCategory(1)
//     .setDepth(2);

//   this.bloodSplatter = this.add.sprite(512, 384, "blood1_00018").setDepth(4);
//   this.explosion = this.add
//     .sprite(512, 384, "firstexplosion_00094")
//     .setDepth(4);

//   this.leftArm = this.matter.add
//     .image(
//       750,
//       200,
//       `${this.characterTiers[this.data.get("tier")] ?? "paper"}-Rarm`,
//       undefined,
//       {
//         shape: characterShapes.larm,
//         friction: 0.1,
//         density: 0.001,
//       }
//     )
//     .setDisplaySize(CHARACTER_WIDTH, CHARACTER_HEIGHT)
//     .setCollisionCategory(1)
//     .setDepth(1);

//   this.rightArm = this.matter.add
//     .image(
//       350,
//       200,
//       `${this.characterTiers[this.data.get("tier")] ?? "paper"}-Larm`,
//       undefined,
//       {
//         shape: characterShapes.rarm,
//         friction: 0.1,
//         density: 0.001,
//       }
//     )
//     .setDisplaySize(CHARACTER_WIDTH, CHARACTER_HEIGHT)
//     .setCollisionCategory(1)
//     .setDepth(1);

//   this.rightLeg = this.matter.add
//     .image(
//       350,
//       500,
//       `${this.characterTiers[this.data.get("tier")] ?? "paper"}-Lleg`,
//       undefined,
//       {
//         shape: characterShapes.rleg,
//         friction: 0.1,
//         density: 0.002,
//       }
//     )
//     .setDisplaySize(CHARACTER_WIDTH - 30, CHARACTER_HEIGHT - 30)
//     .setDepth(1);

//   this.leftLeg = this.matter.add
//     .image(
//       350,
//       500,
//       `${this.characterTiers[this.data.get("tier")] ?? "paper"}-Rleg`,
//       undefined,
//       {
//         shape: characterShapes.lleg,
//         friction: 0.1,
//         density: 0.002,
//       }
//     )
//     .setDisplaySize(CHARACTER_WIDTH - 30, CHARACTER_HEIGHT - 30)
//     .setDepth(1);

//   // Create joints with more flexibility for swinging
//   //@ts-ignore
//   const neckLeft = this.matter.add.joint(this.head, this.body, 10, 0.1, {
//     pointA: { x: 0, y: CHARACTER_HEIGHT / 2.6 },
//     pointB: { x: -25, y: -CHARACTER_HEIGHT / 2.6 },
//     angularStiffness: 0.2,
//     stiffness: 0.2,
//   });
//   //@ts-ignore
//   const neckRight = this.matter.add.joint(this.head, this.body, 10, 0.1, {
//     pointA: { x: 0, y: CHARACTER_HEIGHT / 2.6 },
//     pointB: { x: 25, y: -CHARACTER_HEIGHT / 2.6 },
//     angularStiffness: 0.2,
//     stiffness: 0.2,
//   });
//   const leftShoulder = this.matter.add.joint(
//     //@ts-ignore
//     this.leftArm,
//     this.body,
//     JOINT_LENGTH,
//     0.3,
//     {
//       pointA: { x: 35, y: -15 },
//       pointB: { x: -25, y: -35 },
//       angularStiffness: 0.2,
//     }
//   );
//   const rightShoulder = this.matter.add.joint(
//     //@ts-ignore
//     this.rightArm,
//     this.body,
//     JOINT_LENGTH,
//     0.3,
//     {
//       pointA: { x: -35, y: -15 },
//       pointB: { x: 25, y: -35 },
//       angularStiffness: 0.2,
//     }
//   );
//   const leftKnee = this.matter.add.joint(
//     //@ts-ignore
//     this.leftLeg,
//     this.body,
//     1,
//     0.4,
//     {
//       pointA: { x: 0, y: -20 },
//       pointB: { x: -25, y: 35 },
//       angularStiffness: 0.3,
//     }
//   );
//   const rightKnee = this.matter.add.joint(
//     //@ts-ignore
//     this.rightLeg,
//     this.body,
//     1,
//     0.4,
//     {
//       pointA: { x: 0, y: -20 },
//       pointB: { x: 25, y: 35 },
//       angularStiffness: 0.3,
//     }
//   );
// }

// private renderButtons() {
//   this.debugButton = new TextButton(
//     this,
//     10,
//     20,
//     "Journal",
//     {
//       color: "#ffffff",
//       backgroundColor: "black",
//       padding: { left: 10, right: 10, top: 10, bottom: 10 },
//       shadow: { color: "#000", offsetX: 1, offsetY: 1, blur: 1 },
//     },
//     () => {
//       this.soundManager.play("click");
//       // Toggle debug state
//       this.data.set("debug", !this.data.get("debug"));
//       // Update button text to show current state
//       this.debugButton.setText(
//         this.data.get("debug") ? "Hide Journal" : "Journal"
//       );

//       // if (this.data.get("debug")) {
//       //   this.classSelection.hide(false);
//       // } else {
//       //   this.classSelection.hide(true);
//       // }
//     }
//   );

//   this.add.existing(this.debugButton);

//   const weapons: Array<{
//     key: GameWeaponKey | undefined;
//     label: string;
//     y: number;
//   }> = [
//     { key: undefined, label: "Fists", y: 60 },
//     { key: "knife", label: "Knives", y: 100 },
//     { key: "deagle", label: "Deagle", y: 140 },
//     { key: "grenade", label: "Grenade", y: 180 },
//     { key: "fire-bomb", label: "Fire Bomb", y: 220 },
//     { key: "sticky-bomb", label: "Sticky Bomb", y: 260 },
//     { key: "chainsaw", label: "Chainsaw", y: 300 },
//     { key: "lightsaber", label: "Lightsaber", y: 340 },
//     { key: "tommy", label: "Tommy Gun", y: 380 },
//     { key: "mg", label: "Machine Gun", y: 420 },
//     { key: "railgun", label: "Rail Gun", y: 460 },
//     { key: "raygun", label: "Ray Gun", y: 500 },
//     { key: "rpg", label: "Rocket Launcher", y: 540 },
//   ];

//   weapons.forEach(({ key, label, y }) => {
//     this.weaponButtons.set(
//       key || "fist",
//       new TextButton(
//         this,
//         10,
//         y,
//         label,
//         {
//           color: "#ffffff",
//           backgroundColor: "black",
//           padding: { left: 10, right: 10, top: 10, bottom: 10 },
//           shadow: { color: "#000", offsetX: 1, offsetY: 1, blur: 1 },
//         },
//         () => {
//           this.soundManager.play("click");
//           this.setWeapon(key);
//         }
//       )
//     );
//   });

//   this.weaponButtons.forEach((button) => {
//     this.add.existing(button);
//   });
// }

// private createWeaponSelectionArea() {
//   const text = this.add.text(0, 728, `Pointer Over ${this.pointerOver}`, {
//     fontSize: "16px",
//     color: "#ffffff",
//   });
//   this.weaponSelectionArea = this.add
//     .rectangle(0, 0, 200, 768 * 2, 0x000000, 0)
//     .setDepth(-1)
//     .setInteractive()
//     .on("pointerover", () => {
//       this.pointerOver = true;
//       // text.setText(`Pointer Over ${this.pointerOver}`);
//       // this.weaponSelectionArea.setFillStyle(0xff0000, 0.5);
//     })
//     .on("pointerout", () => {
//       this.pointerOver = false;
//       // text.setText(`Pointer Over ${this.pointerOver}`);
//       // this.weaponSelectionArea.setFillStyle(0x000000, 0.5);
//     })
//     .on("pointerdown", () => {
//       // this.weaponSelectionArea.setFillStyle(0x00ff00, 0.5);
//     })
//     .on("pointerup", () => {
//       // this.weaponSelectionArea.setFillStyle(0x000000, 0.5);
//     });
// }

// setWeapon(weapon: GameWeaponKey | undefined) {
//   // Remove current weapon from display
//   if (this.currentWeapon) {
//     this.currentWeapon.removeFromDisplayList();
//   }

//   // Destroy any previous weapon
//   if (this.weapon && this.currentWeapon) {
//     this.currentWeapon.destroy();
//     this.weapon = undefined;
//   }

//   // Set and show the appropriate weapon
//   if (!weapon) {
//     this.currentWeapon = undefined;
//     return;
//   }

//   const weaponConfig: Record<GameWeaponKey, WeaponConfig> = {
//     deagle: {
//       texture: "deaglefiring_00018",
//       width: 200,
//       height: 100,
//       name: "deagle",
//     },
//     tommy: { texture: "tommy", width: 300, height: 150, name: "tommy" },
//     knife: { texture: "knife", width: 300, height: 150, name: "knife" },
//     rpg: { texture: "rpg", width: 300, height: 150, name: "rpg" },
//     grenade: { texture: "grenade", width: 100, height: 100, name: "grenade" },
//     "fire-bomb": {
//       texture: "fire-bomb",
//       width: 120,
//       height: 70,
//       name: "fire-bomb",
//     },
//     "sticky-bomb": {
//       texture: "sticky-bomb",
//       width: 100,
//       height: 100,
//       name: "sticky-bomb",
//     },
//     chainsaw: {
//       texture: "chainsaw",
//       width: 300,
//       height: 150,
//       name: "chainsaw",
//     },
//     lightsaber: {
//       texture: "lightsaber",
//       width: 300,
//       height: 150,
//       name: "lightsaber",
//     },
//     mg: { texture: "mg", width: 300, height: 150, name: "mg" },
//     railgun: { texture: "railgun", width: 300, height: 150, name: "railgun" },
//     raygun: { texture: "raygun", width: 300, height: 150, name: "raygun" },
//   };

//   const config = weapon ? weaponConfig[weapon] : undefined;
//   if (config) {
//     this.weapon = weapon;
//     this.currentWeapon = this.add
//       .sprite(1024 / 2, 768 / 2, config.texture)
//       .setDisplaySize(config.width, config.height)
//       .removeFromDisplayList()
//       .setName(config.name);
//   }
// }

// spawnProjectile(startPoint: Phaser.Math.Vector2): void {
//   const characterPos = this.character.getPosition();
//   const targetPoint = new Phaser.Math.Vector2(characterPos.x, characterPos.y);

//   // Calculate angle between start and target points
//   const angle = Phaser.Math.Angle.Between(
//     startPoint.x,
//     startPoint.y,
//     targetPoint.x,
//     targetPoint.y
//   );

//   let speed = 50;
//   let projectile;
//   let throwForce = 0;
//   let projectileConfig = {
//     friction: 0,
//     frictionStatic: 0,
//     frictionAir: 0.005, // Add air friction for arcing motion
//     restitution: 0.3, // Reduce bounce
//     angle: angle + Math.PI,
//     density: 0.001, // Light enough to arc
//     ignorePointer: true,
//   };

//   switch (this.weapon) {
//     case "deagle":
//       speed = 75;
//       projectile = this.add
//         .image(this.barrelPoint.x, this.barrelPoint.y, "deagle-bullet")
//         .setScale(0.06, 0.1);
//       break;
//     case "tommy":
//       speed = 50;
//       projectile = this.add
//         .image(this.barrelPoint.x, this.barrelPoint.y, "tommy-bullet")
//         .setScale(0.04, 0.08);
//       break;
//     case "rpg":
//       speed = 50;
//       projectile = this.add
//         .image(this.barrelPoint.x, this.barrelPoint.y, "rpg-bullet")
//         .setScale(0.1, 0.1);
//       break;
//     case "knife":
//       speed = 40;
//       projectile = this.add
//         .image(this.barrelPoint.x, this.barrelPoint.y, "knife")
//         .setScale(0.08, 0.08);
//       break;
//     case "raygun":
//       speed = 50;
//       projectile = this.add.image(
//         this.barrelPoint.x,
//         this.barrelPoint.y,
//         "raygun-bullet"
//       );
//       break;
//     case "mg":
//       speed = 50;
//       projectile = this.add
//         .image(this.barrelPoint.x, this.barrelPoint.y, "mg-bullet")
//         .setScale(0.08, 0.08);
//       break;
//     case "grenade":
//     case "sticky-bomb":
//     case "fire-bomb":
//       projectile = this.add
//         .image(startPoint.x, startPoint.y, this.weapon)
//         .setScale(0.15);

//       // Add rotation to the throwable
//       projectileConfig = {
//         ...projectileConfig,
//         //@ts-ignore
//         shape: { type: "circle", radius: 15 },
//         angularVelocity: 0.2, // Increased rotation speed
//         label: this.weapon, // Used to identify projectile type in collision
//       };

//       // Calculate throw force based on distance to target with increased force
//       const distance = Phaser.Math.Distance.Between(
//         startPoint.x,
//         startPoint.y,
//         targetPoint.x,
//         targetPoint.y
//       );
//       throwForce = Math.min(distance * 0.02, 25); // Slightly reduced multiplier and max force

//       break;
//     default:
//       return;
//   }

//   if (
//     this.weapon === "grenade" ||
//     this.weapon === "sticky-bomb" ||
//     this.weapon === "fire-bomb"
//   ) {
//     const matterBomb = this.matter.add.gameObject(projectile, {
//       ...projectileConfig,
//       onCollideCallback: (collision: MatterJS.ICollisionPair) => {
//         const bodyA = collision.bodyA;
//         const bodyB = collision.bodyB;

//         const collisionPoint = {
//           x: collision.collision.supports[0]?.x,
//           y: collision.collision.supports[0]?.y,
//         };

//         switch (this.weapon) {
//           case "sticky-bomb": {
//             // Stick to the first thing hit
//             if (!matterBomb.getData("stuck")) {
//               matterBomb.setData("stuck", true);
//               //@ts-ignore
//               this.matter.add.joint(bodyA, bodyB, {
//                 pointA: { x: 0, y: 0 },
//                 pointB: { x: 0, y: 0 },
//               });
//               // this.matter.setStatic(matterBomb, true);

//               // Explode after delay
//               this.time.delayedCall(2000, () => {
//                 this.createExplosion(collisionPoint.x, collisionPoint.y);
//                 matterBomb.destroy();
//               });
//             }
//             break;
//           }
//           case "fire-bomb": {
//             // Create fire effect and DOT damage
//             this.createFireEffect(collisionPoint.x, collisionPoint.y);
//             matterBomb.destroy();
//             break;
//           }
//           case "grenade": {
//             // Explode immediately on impact
//             this.createExplosion(collisionPoint.x, collisionPoint.y);
//             matterBomb.destroy();
//             break;
//           }
//         }
//       },
//     });

//     // Apply arc trajectory
//     this.matter.setVelocity(
//       matterBomb,
//       Math.cos(angle) * throwForce,
//       Math.sin(angle) * throwForce - 5 // Negative Y for upward arc
//     );
//   } else {
//     const matterBullet = this.matter.add.gameObject(projectile, {
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
//         if (this.weapon === "rpg") {
//           this.soundManager.play("explode");
//         } else if (this.weapon === "raygun") {
//           this.soundManager.play("raygun-impact");
//         }

//         // Calculate damage based on weapon type
//         let damage = 0.05; // default damage
//         switch (this.weapon) {
//           case "rpg":
//             damage = 1;
//             break;
//           case "deagle":
//             damage = 0.5;
//             break;
//           case "tommy":
//             damage = 0.3;
//             break;
//           case "mg":
//             damage = 0.4;
//             break;
//           case "raygun":
//             damage = 0.3;
//             break;
//           // Add other weapon damage values as needed
//         }

//         const isExplosion = this.weapon === "rpg";
//         EventBus.emit("projectile-hit", { damage, isExplosion });
//         matterBullet.destroy();
//       },
//     });

//     // Set velocity based on angle to target
//     this.matter.setVelocity(
//       matterBullet,
//       speed * Math.cos(angle),
//       speed * Math.sin(angle)
//     );
//   }
// }

// fireWeapon() {
//   const characterPos = this.character.getPosition();
//   // Don't fire if pointer is over weapon selection area
//   if (this.pointerOver) {
//     return;
//   }

//   // Don't fire if using fists
//   if (this.weapon === undefined) {
//     return;
//   }

//   // Don't fire if no weapon equipped or weapon not visible
//   if (!this.currentWeapon || !this.currentWeapon.getDisplayList()) {
//     return;
//   }

//   // Calculate spawn position offset based on gun angle and flip
//   const spawnOffset = this.currentWeapon.flipX ? -100 : 100;
//   const spawnX = this.currentWeapon.x + spawnOffset;

//   switch (this.weapon) {
//     case "deagle":
//       this.soundManager.play("deagle-cock");
//       this.soundManager.play("deagle-fire");
//       this.currentWeapon
//         .play("deagleFire")
//         .on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
//           this.events.emit("deagle-fired");
//         });
//       break;
//     case "tommy":
//       this.soundManager.play("deagle-fire");
//       this.currentWeapon
//         .play("tommyFire")
//         .on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
//           this.events.emit("tommy-fired");
//         });
//       break;
//     case "rpg":
//       this.soundManager.play("rpg-fire");
//       this.currentWeapon
//         .play("rpgFire")
//         .on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
//           this.events.emit("rocket-fired");
//         });
//       break;
//     case "mg":
//       this.soundManager.play("deagle-fire");
//       this.currentWeapon
//         .play("mgFire")
//         .on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
//           this.events.emit("mg-fired");
//         });
//       break;
//     case "raygun":
//       this.soundManager.play("raygun-fire");
//       this.currentWeapon
//         .play("raygunFire")
//         .on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
//           this.events.emit("raygun-fired");
//         });
//       break;
//     case "knife":
//       console.log("knives");
//       // this.soundManager.play()
//       // this.currentWeapon
//       //   .play("knifeThrow")
//       //   .on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
//       //     this.events.emit("knives-fired");
//       //   });
//       break;

//     case "grenade":
//     case "sticky-bomb":
//     case "fire-bomb":
//       this.soundManager.play("fire-bomb-fire");
//       break;
//     default:
//       return;
//   }

//   this.spawnProjectile(new Phaser.Math.Vector2(spawnX, this.currentWeapon.y));
// }

// showAndFireWeapon() {
//   if (!this.showWeapon || !this.weapon || this.pointerOver) {
//     return;
//   }

//   // Show current weapon if it exists but isn't displayed
//   if (this.currentWeapon && !this.currentWeapon.getDisplayList()) {
//     this.currentWeapon.addToDisplayList();
//   }

//   // Clear any existing firing timer when changing weapons
//   if (this.firingTimer) {
//     this.firingTimer.destroy();
//     this.firingTimer = undefined;
//   }

//   // Weapon configurations
//   const weaponConfigs = {
//     grenade: {
//       fireRate: 1000,
//       burstSize: 1,
//       sound: "fire-bomb-fire",
//     },
//     "sticky-bomb": {
//       fireRate: 1000,
//       burstSize: 1,
//       sound: "fire-bomb-fire",
//     },
//     "fire-bomb": {
//       fireRate: 1000,
//       burstSize: 1,
//       sound: "fire-bomb-fire",
//     },
//     knives: {
//       fireRate: 500,
//       burstSize: 1,
//     },
//     "tommy-gun": {
//       fireRate: 50, // Faster fire rate for tommy gun
//       burstSize: 3, // Number of bullets per burst
//       burstDelay: 300, // Delay between bursts
//       sound: "deagle-fire",
//     },
//     "desert-eagle": {
//       fireRate: 500, // Consistent delay between shots
//       burstSize: 1,
//       sound: "deagle-fire",
//     },
//     rpg: {
//       fireRate: 1000,
//       burstSize: 1,
//       sound: "rpg-fire",
//     },
//     mg: {
//       fireRate: 100,
//       burstSize: 1,
//       sound: "deagle-fire",
//     },
//     raygun: {
//       fireRate: 200,
//       burstSize: 1,
//       sound: "raygun-fire",
//     },
//   };

//   //@ts-ignore
//   const config = weaponConfigs[this.weapon];
//   if (!config) return;

//   let lastFired = 0;
//   let burstCount = 0;
//   let canFire = true;

//   // Initial fire on pointer down
//   if (this.input.activePointer.isDown) {
//     this.fireWeapon();
//     lastFired = this.time.now;
//   }

//   this.firingTimer = this.time.addEvent({
//     delay: 16, // Run at ~60fps for smooth firing checks
//     callback: () => {
//       const currentTime = this.time.now;

//       if (!this.input.activePointer.isDown) {
//         canFire = true;
//         burstCount = 0;
//         return;
//       }

//       // Check if enough time has passed since last shot
//       if (currentTime - lastFired >= config.fireRate && canFire) {
//         if (config.burstSize > 1) {
//           // Burst fire logic
//           this.fireWeapon();
//           burstCount++;
//           lastFired = currentTime;

//           if (burstCount >= config.burstSize) {
//             canFire = false;
//             burstCount = 0;
//             // Reset after burst delay
//             this.time.delayedCall(config.burstDelay || 300, () => {
//               canFire = true;
//             });
//           }
//         } else {
//           // Single shot logic
//           this.fireWeapon();
//           lastFired = currentTime;
//         }

//         // Play weapon sound
//         if (config.sound) {
//           this.soundManager.play(config.sound);
//         }
//       }
//     },
//     loop: true,
//   });
// }

// hideWeapon() {
//   if (this.currentWeapon && this.currentWeapon.getDisplayList()) {
//     this.currentWeapon.removeFromDisplayList();
//   }
// }

// private createFireEffect(x: number, y: number) {
//   const fireEffect = this.add.sprite(x, y, "groundfire_00016").play("fire");

//   this.soundManager.play("fire-bomb-impact");

//   // Create damage over time effect
//   let tickCount = 0;
//   const maxTicks = 5;

//   const fireDamage = this.time.addEvent({
//     delay: 500, // Damage every 0.5 seconds
//     callback: () => {
//       const characterPos = this.character.getPosition();
//       const distance = Phaser.Math.Distance.Between(
//         x,
//         y,
//         characterPos.x,
//         characterPos.y
//       );

//       if (distance <= 50) {
//         // Fire damage radius
//         EventBus.emit("projectile-hit", {
//           damage: 5,
//           isExplosion: false,
//         });
//       }

//       tickCount++;
//       if (tickCount >= maxTicks) {
//         fireDamage.destroy();
//         fireEffect.destroy();
//       }
//     },
//     loop: true,
//   });
// }

// private createExplosion(x: number, y: number) {
//   // Visual effect
//   const explosion = this.add
//     .sprite(x, y, "firstexplosion_00094")
//     .play("explosion");

//   // Sound effect
//   this.soundManager.play("explode");

//   // Damage calculation based on distance
//   const blastRadius = 100;
//   const characterPos = this.character.getPosition();
//   const distance = Phaser.Math.Distance.Between(
//     x,
//     y,
//     characterPos.x,
//     characterPos.y
//   );

//   if (distance <= blastRadius) {
//     const damage = 1 - distance / blastRadius; // More damage closer to explosion
//     EventBus.emit("projectile-hit", {
//       damage: damage * 20, // Scale damage appropriately
//       isExplosion: true,
//     });
//   }
// }

// showAndFireWeapon() {
//   if (!this.showWeapon) {
//     return;
//   }

//   // Show current weapon if it exists but isn't displayed
//   if (this.currentWeapon && !this.currentWeapon.getDisplayList()) {
//     this.currentWeapon.addToDisplayList();
//   }

//   // Clear any existing firing timer when changing weapons
//   if (this.firingTimer) {
//     this.firingTimer.destroy();
//     this.firingTimer = undefined;
//   }

//   // Set up weapon-specific firing behavior
//   let fireRate = 0;
//   let fireEvent = "";
//   let bulletsPerBurst = 1;
//   let burstDelay = 0;
//   let currentWeaponType = this.weapon; // Store current weapon type

//   switch (this.weapon) {
//     case "tommy-gun":
//       fireRate = 100;
//       fireEvent = "tommy-fired";
//       bulletsPerBurst = 20;
//       burstDelay = 50;
//       break;
//     case "desert-eagle":
//       fireRate = 500;
//       fireEvent = "deagle-fired";
//       bulletsPerBurst = 1;
//       break;
//     case "rpg":
//       fireRate = 1000;
//       fireEvent = "rocket-fired";
//       bulletsPerBurst = 1;
//       break;
//     case "knives":
//       fireRate = 1000;
//       fireEvent = "knives-fired";
//       bulletsPerBurst = 1;
//       break;
//     case "mg":
//       fireRate = 100;
//       fireEvent = "mg-fired";
//       bulletsPerBurst = 1;
//       break;
//     case "raygun":
//       fireRate = 100;
//       fireEvent = "raygun-fired";
//       bulletsPerBurst = 1;
//       break;
//     default:
//       return;
//   }

//   let canFire = true;
//   let burstTimer: Phaser.Time.TimerEvent;

//   // Start firing immediately on pointerdown
//   if (this.input.activePointer.isDown) {
//     this.fireWeapon();
//   }

//   this.firingTimer = this.time.addEvent({
//     delay: fireRate,
//     callback: () => {
//       // Check if weapon has changed since starting the burst
//       if (this.weapon !== currentWeaponType) {
//         if (burstTimer) {
//           burstTimer.destroy();
//         }
//         canFire = true;
//         return;
//       }

//       if (this.input.activePointer.isDown && canFire) {
//         canFire = false;

//         if (bulletsPerBurst > 1) {
//           // For burst weapons like tommy gun
//           let bulletsShot = 0;
//           burstTimer = this.time.addEvent({
//             delay: burstDelay,
//             callback: () => {
//               // Check weapon hasn't changed during burst
//               if (this.weapon === currentWeaponType) {
//                 this.fireWeapon();
//                 bulletsShot++;
//                 if (bulletsShot >= bulletsPerBurst) {
//                   burstTimer.destroy();
//                   // Allow next burst after a short delay
//                   this.time.delayedCall(300, () => {
//                     canFire = true;
//                   });
//                 }
//               } else {
//                 burstTimer.destroy();
//                 canFire = true;
//               }
//             },
//             repeat: bulletsPerBurst - 1,
//           });
//         } else {
//           // For single shot weapons like desert eagle
//           this.fireWeapon();
//           // Re-enable firing after animation completes
//           this.events.once(fireEvent, () => {
//             canFire = true;
//           });
//         }
//       }
//     },
//     loop: true,
//   });
// }

