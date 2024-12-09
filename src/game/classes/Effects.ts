import { Scene } from "phaser";
import { Character } from "./Character";
import { EventBus } from "../EventBus";

export type EffectType =
  | "b1"
  | "b2"
  | "b3"
  | "explosion1"
  | "explosion2"
  | "fire1"
  | "fire2"
  | "coin";

interface EffectConfig {
  animKey: string;
  texture: string;
  isPlaying: boolean;
  timer?: Phaser.Time.TimerEvent;
}

export class Effects {
  private scene: Scene;
  private static readonly effectConfig: Record<EffectType, EffectConfig> = {
    b1: {
      animKey: "b1",
      texture: "blood1_00018",
      isPlaying: false,
      timer: undefined,
    },
    b2: {
      animKey: "b2",
      texture: "bloodgush3_018",
      isPlaying: false,
      timer: undefined,
    },
    b3: {
      animKey: "b4",
      texture: "darkerblood1_00018",
      isPlaying: false,
      timer: undefined,
    },
    explosion1: {
      animKey: "explosion",
      texture: "firstexplosion_00001",
      isPlaying: false,
      timer: undefined,
    },
    explosion2: {
      animKey: "explosion2",
      texture: "expl2fixed_00000",
      isPlaying: false,
      timer: undefined,
    },
    fire1: {
      animKey: "fire",
      texture: "groundfire_00016",
      isPlaying: false,
      timer: undefined,
    },
    fire2: {
      animKey: "fire2",
      texture: "fire2fixed_00012",
      isPlaying: false,
      timer: undefined,
    },
    coin: {
      animKey: "coin-spin",
      texture: "SpinningMoney0041",
      isPlaying: false,
      timer: undefined,
    },
  };

  private groundY: number;
  private finalX: number;
  private finalY: number;

  constructor(scene: Scene) {
    this.scene = scene;
    this.groundY = this.scene.cameras.main.height - 50;
    this.finalX = this.scene.cameras.main.width - 200;
    this.finalY = 30;
  }

  //   public playEffect(key: EffectType, x: number, y: number): void {
  //     const config = Effects.effectConfig[key];

  //     if (!config) return;

  //     const sprite = this.scene.add
  //       .sprite(x, y, config.texture)
  //       .setDepth(4)
  //       .setVisible(true); // Start visible

  //     // Example of a tween to fade out and destroy the sprite
  //     sprite.setAlpha(0); // Start invisible
  //     this.scene.tweens.add({
  //       targets: sprite,
  //       alpha: 1, // Fade in
  //       duration: 500,
  //       onComplete: () => {
  //         // this.playEffect(key, "b1");
  //       },
  //     });

  //     // If effect is already playing, just reset its stop timer
  //     if (config.isPlaying) {
  //       if (config.timer) {
  //         config.timer.reset({
  //           delay: 500,
  //           callback: () => {
  //             config.isPlaying = false;
  //             sprite.stop();
  //             sprite.setVisible(false); // Hide the sprite
  //             sprite.off("animationcomplete");
  //           },
  //         });
  //       }
  //       return;
  //     }

  //     // Start playing the effect
  //     config.isPlaying = true;
  //     sprite.setVisible(true); // Show the sprite
  //     sprite.play(config.animKey);

  //     // Set up auto-repeat on animation complete
  //     sprite.on("animationcomplete", () => {
  //       if (config.isPlaying) {
  //         sprite.play(config.animKey);
  //       }
  //     });

  //     // Create a timer to stop the effect if no more hits occur
  //     config.timer = this.scene.time.delayedCall(500, () => {
  //       config.isPlaying = false;
  //       sprite.destroy();
  //     });

  //     return sprite;
  //   }

  public playEffect(
    key: EffectType,
    x: number,
    y: number,
    loops: number = 1
  ): void {
    const config = Effects.effectConfig[key];
    if (!config) return;

    const sprite = this.scene.add
      .sprite(x, y, config.texture)
      .setDepth(4)
      .setAlpha(0);

    let loopCount = 0;

    sprite.on("animationcomplete", () => {
      loopCount++;
      if (loopCount < loops) {
        sprite.play(config.animKey);
      } else {
        // Start fade out when loops are complete
        this.scene.tweens.add({
          targets: sprite,
          alpha: 0,
          duration: 200,
          onComplete: () => sprite.destroy(),
        });
      }
    });

    // Fade in and start animation
    this.scene.tweens.add({
      targets: sprite,
      alpha: 1,
      duration: 50,
      onComplete: () => sprite.play(config.animKey),
    });
  }

  public spawnCoin(x: number, y: number): void {
    const coin = this.scene.add.sprite(x, y, "coin").setDepth(4).setScale(0.2);

    // Random initial direction with full 360 degree range
    const randomAngle = Phaser.Math.FloatBetween(-Math.PI, Math.PI);
    const force = Phaser.Math.FloatBetween(100, 200); // Randomize force
    const dx = Math.cos(randomAngle) * force;
    const dy = Math.sin(randomAngle) * force;

    // Random initial height and distance
    const initialHeight = Phaser.Math.FloatBetween(-150, -50);
    const bounceHeight = Phaser.Math.FloatBetween(10, 30);
    // Initial throw animation with physics-like motion
    this.scene.tweens.add({
      targets: coin,
      x: x + dx,
      y: y + initialHeight, // Random upward arc
      duration: Phaser.Math.FloatBetween(300, 500),
      ease: "Quad.easeOut",
      onComplete: () => {
        // Get ground position (50px from bottom)

        // Falling animation with natural gravity
        this.scene.tweens.add({
          targets: coin,
          y: this.groundY - bounceHeight, // Bounce relative to ground
          duration: Phaser.Math.FloatBetween(600, 800), // Slower fall
          ease: "Cubic.easeIn", // More natural gravity curve
          onComplete: () => {
            // Small settling bounces
            this.scene.tweens.add({
              targets: coin,
              y: this.groundY, // Rest above ground
              duration: Phaser.Math.FloatBetween(150, 250),
              ease: "Quad.easeOut",
              onComplete: () => {
                // Random delay before flying to corner
                this.scene.time.delayedCall(
                  Phaser.Math.FloatBetween(200, 400),
                  () => {
                    // Final animation to top right corner

                    this.scene.tweens.add({
                      targets: coin,
                      x: this.finalX,
                      y: this.finalY,
                      scale: 0.1,
                      duration: Phaser.Math.FloatBetween(500, 700),
                      ease: "Back.easeIn",
                      onComplete: () => {
                        this.scene.sound.play("coin-pickup", {
                          volume: 0.4,
                        });
                        EventBus.emit("coins-changed", 2);
                        coin.destroy();
                      },
                    });
                  }
                );
              },
            });
          },
        });
      },
    });

    // Spin animation while bouncing
    coin.play("coin-spin");
  }
}

