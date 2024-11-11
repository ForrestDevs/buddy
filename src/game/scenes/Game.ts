/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { IPair } from "matter";
import { EventBus } from "../EventBus";
import Phaser from "phaser";
/* END-USER-IMPORTS */

const JOINT_LENGTH = 20;
const JOINT_STIFFNESS = 1;

export default class Game extends Phaser.Scene {
  private moveCam: boolean;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private starBody!: MatterJS.BodyType;

  private head!: Phaser.Physics.Matter.Image;
  private body!: Phaser.Physics.Matter.Image;
  private leftArm!: Phaser.Physics.Matter.Image;
  private rightArm!: Phaser.Physics.Matter.Image;
  private leftLeg!: Phaser.Physics.Matter.Image;
  private rightLeg!: Phaser.Physics.Matter.Image;

  private headText!: Phaser.GameObjects.Text;
  constructor() {
    super("MainGame");
  }

  init() {
    this.cursors = this.input?.keyboard?.createCursorKeys()!;
  }

  // editorCreate(): void {
  //   // background
  //   const background = this.add.image(512, 384, "background");
  //   background.alpha = 0.5;

  //   // body
  //   const body = this.add.triangle(519, 333, 0, 128, 64, 0, 128, 128);
  //   body.name = "body";
  //   body.setInteractive(
  //     new Phaser.Geom.Rectangle(0, 0, 128, 128),
  //     Phaser.Geom.Rectangle.Contains
  //   );
  //   body.scaleX = 0.6797996641730619;
  //   body.scaleY = 0.9076895843535854;
  //   body.isFilled = true;

  //   // head
  //   const head = this.add.ellipse(517, 245, 128, 128);
  //   head.name = "head";
  //   head.scaleX = 0.440180796814426;
  //   head.scaleY = 0.5472606195911818;
  //   head.isFilled = true;

  //   // triangle_2
  //   const triangle_2 = this.add.triangle(568, 335, 0, 128, 64, 0, 128, 128);
  //   triangle_2.scaleX = 0.3295226204007119;
  //   triangle_2.scaleY = 0.8314096679431473;
  //   triangle_2.angle = -51;
  //   triangle_2.isFilled = true;

  //   // triangle
  //   const triangle = this.add.triangle(468, 334, 0, 128, 64, 0, 128, 128);
  //   triangle.scaleX = 0.3295226204007119;
  //   triangle.scaleY = 0.8314096679431473;
  //   triangle.angle = 51;
  //   triangle.isFilled = true;

  //   // rectangle_1
  //   const rectangle_1 = this.add.rectangle(504, 420, 128, 128);
  //   rectangle_1.scaleX = 0.1638038754181181;
  //   rectangle_1.scaleY = 0.4767627259251278;
  //   rectangle_1.isFilled = true;

  //   // rectangle
  //   const rectangle = this.add.rectangle(541, 422, 128, 128);
  //   rectangle.scaleX = 0.1638038754181181;
  //   rectangle.scaleY = 0.4767627259251278;
  //   rectangle.isFilled = true;

  //   this.head = head;

  //   this.events.emit("scene-awake");
  // }

  create() {
    this.add.image(1024 / 2, 768 / 2, "bg").setDisplaySize(1024, 768);
    this.matter.world.setBounds(0, 0, 1024, 768, 100, true, true, true, true);
    EventBus.emit("current-scene-ready", this);

    this.head = this.matter.add
      .image(1024 / 2, 768 / 2, "head", undefined, {
        density: 1,
        shape: {
          type: "fromVertices",
          verts: [
            { x: 500, y: 150 },
            { x: 650, y: 180 },
            { x: 770, y: 250 },
            { x: 850, y: 350 },
            { x: 870, y: 500 },
            { x: 850, y: 650 },
            { x: 770, y: 750 },
            { x: 650, y: 820 },
            { x: 500, y: 850 },
            { x: 350, y: 820 },
            { x: 230, y: 750 },
            { x: 150, y: 650 },
            { x: 130, y: 500 },
            { x: 150, y: 350 },
            { x: 230, y: 250 },
            { x: 350, y: 180 },
          ],
        },
      })
      .setDisplaySize(100, 100);
    this.body = this.matter.add
      .image(1024 / 2, 768 / 2, "body", undefined, {
        density: 1,
        shape: {
          type: "fromVertices",
          verts: [
            { x: 500, y: 150 },
            { x: 650, y: 180 },
            { x: 770, y: 250 },
            { x: 850, y: 350 },
            { x: 870, y: 500 },
            { x: 850, y: 650 },
            { x: 770, y: 750 },
            { x: 650, y: 820 },
            { x: 500, y: 850 },
            { x: 350, y: 820 },
            { x: 230, y: 750 },
            { x: 150, y: 650 },
            { x: 130, y: 500 },
            { x: 150, y: 350 },
            { x: 230, y: 250 },
            { x: 350, y: 180 },
          ],
        },
      })
      .setDisplaySize(100, 100);
    this.leftArm = this.matter.add
      .image(1024 / 2, 768 / 2, "left-arm", undefined, {
        density: 1,
        shape: {
          type: "fromVertices",
          verts: [
            { x: 150, y: 400 },
            { x: 150, y: 500 },
            { x: 150, y: 600 },
            { x: 200, y: 700 },
            { x: 300, y: 750 },
            { x: 400, y: 800 },
            { x: 600, y: 800 },
            { x: 700, y: 750 },
            { x: 800, y: 700 },
            { x: 850, y: 600 },
            { x: 850, y: 500 },
            { x: 850, y: 400 },
            { x: 800, y: 300 },
            { x: 700, y: 250 },
            { x: 600, y: 200 },
            { x: 400, y: 200 },
            { x: 300, y: 250 },
            { x: 200, y: 300 },
          ],
        },
      })
      .setDisplaySize(100, 100);
    this.rightArm = this.matter.add
      .image(1024 / 2, 768 / 2, "right-arm", undefined, {
        density: 1,
        shape: {
          type: "fromVertices",
          verts: [
            { x: 150, y: 400 },
            { x: 150, y: 500 },
            { x: 150, y: 600 },
            { x: 200, y: 700 },
            { x: 300, y: 750 },
            { x: 400, y: 800 },
            { x: 600, y: 800 },
            { x: 700, y: 750 },
            { x: 800, y: 700 },
            { x: 850, y: 600 },
            { x: 850, y: 500 },
            { x: 850, y: 400 },
            { x: 800, y: 300 },
            { x: 700, y: 250 },
            { x: 600, y: 200 },
            { x: 400, y: 200 },
            { x: 300, y: 250 },
            { x: 200, y: 300 },
          ],
        },
      })
      .setDisplaySize(100, 100);
    this.leftLeg = this.matter.add
      .image(1024 / 2, 768 / 2, "left-leg", undefined, {
        density: 1,
        shape: {
          type: "fromVertices",
          verts: [
            { x: 500, y: 150 },
            { x: 650, y: 180 },
            { x: 770, y: 250 },
            { x: 850, y: 350 },
            { x: 870, y: 500 },
            { x: 850, y: 650 },
            { x: 770, y: 750 },
            { x: 650, y: 820 },
            { x: 500, y: 850 },
            { x: 350, y: 820 },
            { x: 230, y: 750 },
            { x: 150, y: 650 },
            { x: 130, y: 500 },
            { x: 150, y: 350 },
            { x: 230, y: 250 },
            { x: 350, y: 180 },
          ],
        },
      })
      .setDisplaySize(100, 100);

    this.rightLeg = this.matter.add
      .image(1024 / 2, 768 / 2, "right-leg", undefined, {
        density: 1,
        shape: {
          type: "fromVertices",
          verts: [
            { x: 500, y: 150 },
            { x: 650, y: 180 },
            { x: 770, y: 250 },
            { x: 850, y: 350 },
            { x: 870, y: 500 },
            { x: 850, y: 650 },
            { x: 770, y: 750 },
            { x: 650, y: 820 },
            { x: 500, y: 850 },
            { x: 350, y: 820 },
            { x: 230, y: 750 },
            { x: 150, y: 650 },
            { x: 130, y: 500 },
            { x: 150, y: 350 },
            { x: 230, y: 250 },
            { x: 350, y: 180 },
          ],
        },
      })
      .setDisplaySize(100, 100);

    const neck = this.matter.add.joint(
      //@ts-ignore
      this.head,
      this.body,
      JOINT_LENGTH,
      JOINT_STIFFNESS,
      {
        pointA: { x: 0, y: 30 },
        pointB: { x: 0, y: -35 },
      }
    );

    const leftShoulder = this.matter.add.joint(
      //@ts-ignore
      this.leftArm,
      this.body,
      JOINT_LENGTH,
      JOINT_STIFFNESS,
      {
        pointA: { x: 35, y: 0 },
        pointB: { x: -35, y: -35 },
        // angularStiffness: 1,
      }
    );

    const rightShoulder = this.matter.add.joint(
      //@ts-ignore
      this.rightArm,
      this.body,
      JOINT_LENGTH,
      JOINT_STIFFNESS,
      {
        pointA: { x: -35, y: 0 },
        pointB: { x: 35, y: -35 },
        // angularStiffness: 1,
      }
    );

    const leftKnee = this.matter.add.joint(
      //@ts-ignore
      this.leftLeg,
      this.body,
      JOINT_LENGTH,
      JOINT_STIFFNESS,
      {
        pointA: { x: 0, y: -50 },
        pointB: { x: -15, y: 35 },
        // angularStiffness: 1,
      }
    );

    const rightKnee = this.matter.add.joint(
      //@ts-ignore
      this.rightLeg,
      this.body,
      JOINT_LENGTH,
      JOINT_STIFFNESS,
      {
        pointA: { x: 0, y: -50 },
        pointB: { x: 15, y: 35 },
        // angularStiffness: 1,
      }
    );

    let counter = -1;
    let dragBody: Phaser.Physics.Matter.Image | null = null;

    this.matter.world.on("beforeUpdate", () => {
      counter += 0.014;
      if (counter < 0) {
        return;
      }

      const px = 400 + 100 * Math.sin(counter);

      // Update body position and velocity
      if (this.body) {
        this.matter.body.setVelocity(this.body.body as MatterJS.BodyType, {
          x: px - this.body.x,
          y: 0,
        });
        this.matter.body.setPosition(this.body.body as MatterJS.BodyType, {
          x: px,
          y: this.body.y,
        });
      }

      // Limit drag velocity and impulse
      // if (dragBody) {
      //   const body = dragBody.body as MatterJS.BodyType;

      //   if (body.velocity.x > 25.0) {
      //     this.matter.body.setVelocity(body, {
      //       x: 25,
      //       y: body.velocity.y
      //     });
      //   }

      //   if (body.velocity.y > 25.0) {
      //     this.matter.body.setVelocity(body, {
      //       x: body.velocity.x,
      //       y: 25
      //     });
      //   }

      //   if (body.positionImpulse.x > 25.0) {
      //     body.positionImpulse.x = 25.0;
      //   }

      //   if (body.positionImpulse.y > 25.0) {
      //     body.positionImpulse.y = 25.0;
      //   }
      // }
    });

    this.headText = this.add
      .text(16, 16, "Head position: x=0, y=0", {
        fontSize: "18px",
        color: "#fff",
      })
      .setScrollFactor(0);

    // Track dragged body
    // this.matter.world.on('dragstart', (body: MatterJS.BodyType) => {
    //   dragBody = this.children.getByName(body.gameObject.name) as Phaser.Physics.Matter.Image;
    // });

    // const head = this.matter.add.image(, this.head.y, "head");
    // const body = this.matter.add.image(this.body.x, this.body.y, "body");

    // this.matter.add.joint(this.head, this.body, {
    //   length: 1,
    //   stiffness: 0.6,
    // });
    // const headBodyJoint = this.matter.constraint.create({
    //   bodyA: this.head,
    //   bodyB: this.body,
    // });

    //  First, we'll create a few static bodies
    // const body1 = this.matter.add.rectangle(250, 50, 200, 32, {
    //   isStatic: true,
    // });

    // this.matter.add.polygon(600, 100, 3, 40, { isStatic: true });
    // this.matter.add.polygon(100, 500, 8, 50, { isStatic: true });
    // this.matter.add.rectangle(750, 200, 16, 180, { isStatic: true });

    //  Now a body that shows off internal edges + convex hulls
    // const star = "50 0 63 38 100 38 69 59 82 100 50 75 18 100 31 59 0 38 37 38";

    // this.starBody = this.matter.add.fromVertices(
    //   700,
    //   500,
    //   star,
    //   {
    //     onCollideCallback: (event: any) => {
    //       console.log(event);
    //     },
    //     restitution: 0.5,
    //   },
    //   true
    // );

    // this.matter.world.autoUpdate = true;

    // this.starBody.onCollideCallback = (pair: MatterJS.Pair) => {
    //   console.log(pair);
    // };

    //  Some different joint types
    // const body2 = this.matter.add.circle(150, 250, 16);
    // const body3 = this.matter.add.circle(400, 450, 16);
    // const body4 = this.matter.add.circle(500, 50, 16);

    //  A spring, because length > 0 and stiffness < 0.9
    // this.matter.add.spring(body3, body2, 140, 0.001);

    //  A joint, because length > 0 and stiffness > 0.1
    // this.matter.add.worldConstraint(body3, 140, 1, {
    //   pointA: { x: 400, y: 250 },
    // });

    //  A pin, because length = 0 and stiffness > 0.1
    // this.matter.add.worldConstraint(body4, 0, 1, { pointA: { x: 500, y: 50 } });
    // Respawn character if it leaves bounds
    this.matter.world.on("beforeUpdate", () => {
      const bounds = {
        left: 0,
        right: 1024,
        top: 0,
        bottom: 768,
      };

      // Check if any body part is out of bounds
      const parts = [
        this.head,
        this.body,
        this.leftArm,
        this.rightArm,
        this.leftLeg,
        this.rightLeg,
      ];
      const outOfBounds = parts.some((part) => {
        if (!part) return false;
        return (
          part.x < bounds.left ||
          part.x > bounds.right ||
          part.y < bounds.top ||
          part.y > bounds.bottom
        );
      });

      if (outOfBounds) {
        // Reset all body parts to center
        parts.forEach((part) => {
          if (!part) return;
          this.matter.body.setPosition(part.body as MatterJS.BodyType, {
            x: 1024 / 2,
            y: 768 / 2,
          });
          this.matter.body.setVelocity(part.body as MatterJS.BodyType, {
            x: 0,
            y: 0,
          });
        });
      }
    });

    this.matter.add.mouseSpring({ length: 1, stiffness: 0.1 });
    // this.scoreText = this.add.text(16, 16, "score: 0", {
    //   fontSize: "32px",
    //   color: "#ffffff",
    // });
  }

  updateStarBody() {
    this.score++;
    this.scoreText.setText(`score: ${this.score}`);
  }

  changeScene() {
    this.scene.start("GameOver");
  }

  update(time: number, delta: number): void {
    const cam = this.cameras.main;

    if (this.head) {
      const headPos = `Head position: x=${Math.round(
        this.head.x
      )}, y=${Math.round(this.head.y)}`;
      this.headText.setText(headPos);
    }

    if (this.head && (this.head.x > 1024 || this.head.x < 0)) {
      this.head.setPosition(1024 / 2, 768 / 2);
      this.body.setPosition(1024 / 2, 768 / 2);
      this.leftArm.setPosition(1024 / 2, 768 / 2);
      this.rightArm.setPosition(1024 / 2, 768 / 2);
      this.leftLeg.setPosition(1024 / 2, 768 / 2);
      this.rightLeg.setPosition(1024 / 2, 768 / 2);
    }

    // this.matter.world.on("collisionstart", this.listener);

    // this.player.setVelocity(0);

    // if (this.moveCam) {
    //   if (this.cursors.left.isDown) {
    //     cam.scrollX -= 4;
    //   } else if (this.cursors.right.isDown) {
    //     cam.scrollX += 4;
    //   }

    //   if (this.cursors.up.isDown) {
    //     cam.scrollY -= 4;
    //   } else if (this.cursors.down.isDown) {
    //     cam.scrollY += 4;
    //   }
    // } else {
    //   if (this.cursors.left.isDown) {
    //     this.player.setVelocityX(-400);
    //   } else if (this.cursors.right.isDown) {
    //     this.player.setVelocityX(400);
    //   }

    //   if (this.cursors.up.isDown) {
    //     this.player.setVelocityY(-400);
    //   } else if (this.cursors.down.isDown) {
    //     this.player.setVelocityY(400);
    //   }
    // }
  }
}

