import { useRef, useState } from "react";
import { IRefPhaserGame, PhaserGame } from "./game/PhaserGame";
import { MainMenu } from "./game/scenes/MainMenu";

function App() {
  // The sprite can only be moved in the MainMenu Scene
  const [canMoveSprite, setCanMoveSprite] = useState(true);

  //  References to the PhaserGame component (game and scene are exposed)
  const phaserRef = useRef<IRefPhaserGame | null>(null);
  const [spritePosition, setSpritePosition] = useState({ x: 0, y: 0 });

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
      <div
        style={{
          border: "2px solid #30cfd0",
          borderRadius: "8px",
          boxShadow:
            "0 0 20px rgba(48, 207, 208, 0.5), inset 0 0 10px rgba(48, 207, 208, 0.3)",
          padding: "4px",
        }}
      >
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

