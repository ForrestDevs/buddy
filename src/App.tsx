import { useRef, useState } from "react";
import { IRefPhaserGame, PhaserGame } from "./game/PhaserGame";
import { MainMenu } from "./game/scenes/MainMenu";

function App() {
  // The sprite can only be moved in the MainMenu Scene
  const [canMoveSprite, setCanMoveSprite] = useState(true);

  //  References to the PhaserGame component (game and scene are exposed)
  const phaserRef = useRef<IRefPhaserGame | null>(null);
  const [spritePosition, setSpritePosition] = useState({ x: 0, y: 0 });

  // const changeScene = () => {
  //   if (phaserRef.current) {
  //     const scene = phaserRef.current.scene as MainMenu;

  //     if (scene) {
  //       scene.changeScene();
  //     }
  //   }
  // };

  // const moveSprite = () => {
  //   if (phaserRef.current) {
  //     const scene = phaserRef.current.scene as MainMenu;

  //     if (scene && scene.scene.key === "MainMenu") {
  //       // Get the update logo position
  //       scene.moveLogo(({ x, y }) => {
  //         setSpritePosition({ x, y });
  //       });
  //     }
  //   }
  // };

  // const addSprite = () => {
  //   if (phaserRef.current) {
  //     const scene = phaserRef.current.scene;

  //     if (scene) {
  //       // Add more stars
  //       const x = Phaser.Math.Between(64, scene.scale.width - 64);
  //       const y = Phaser.Math.Between(64, scene.scale.height - 64);

  //       //  `add.sprite` is a Phaser GameObjectFactory method and it returns a Sprite Game Object instance
  //       const star = scene.add.sprite(x, y, "star");

  //       //  ... which you can then act upon. Here we create a Phaser Tween to fade the star sprite in and out.
  //       //  You could, of course, do this from within the Phaser Scene code, but this is just an example
  //       //  showing that Phaser objects and systems can be acted upon from outside of Phaser itself.
  //       scene.add.tween({
  //         targets: star,
  //         duration: 500 + Math.random() * 1000,
  //         alpha: 0,
  //         yoyo: true,
  //         repeat: -1,
  //       });
  //     }
  //   }
  // };

  // Event emitted from the PhaserGame component
  const currentScene = (scene: Phaser.Scene) => {
    setCanMoveSprite(scene.scene.key !== "MainMenu");
  };

  return (
    <div
      id="app"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{
        border: '2px solid #30cfd0',
        borderRadius: '8px',
        boxShadow: '0 0 20px rgba(48, 207, 208, 0.5), inset 0 0 10px rgba(48, 207, 208, 0.3)',
        padding: '4px'
      }}>
        <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
      </div>
      <div
        className="game-info"
        style={{ textAlign: "center", padding: "20px", color: "#fff" }}
      >
        <p
          style={{
            fontSize: "1.2rem",
            maxWidth: "600px",
            margin: "0 auto",
            color: "#888888",
          }}
        >
          The first kick-the-buddy game on the blockchain! Choose your tier,
          pick your weapons, and unleash chaos. Earn while you play - the more
          you kick, the more you earn!
        </p>
      </div>
    </div>
  );
}

export default App;

