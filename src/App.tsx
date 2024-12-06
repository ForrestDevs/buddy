import { useEffect, useRef, useState } from "react";
import { IRefPhaserGame, PhaserGame } from "./game/PhaserGame";
import { MainMenu } from "./game/scenes/MainMenu";
import { EventBus } from "./game/EventBus";

function App() {
  // The sprite can only be moved in the MainMenu Scene
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
        style={{ 
          display: "flex",
          padding: "20px",
          color: "#fff",
          gap: "20px"
        }}
      >
        <div style={{ flex: 1, textAlign: "center" }}>
          <p
            style={{
              fontSize: "1.2rem",
              margin: "0 auto",
              color: "#888888", 
              letterSpacing: "0.05em",
            }}
          >
            The first kick-the-buddy game on the blockchain! Choose your tier,
            pick your weapons, and unleash chaos. Earn while you play - the more
            you kick, the more you earn!
          </p>
        </div>

        <div style={{ flex: 1, maxWidth: '400px' }}>
          <div style={{ marginBottom: "1rem" }}>
            <label 
              style={{ 
                display: "block", 
                marginBottom: "0.5rem",
                color: "#888888"
              }}
            >
              Health:
            </label>
            <input
              type="number"
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "4px",
                border: "1px solid #30cfd0",
                background: "transparent",
                color: "#fff"
              }}
              defaultValue={100}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                EventBus.emit("health-update", value);
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem", 
                color: "#888888"
              }}
            >
              Market Cap:
            </label>
            <input
              type="number" 
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "4px",
                border: "1px solid #30cfd0",
                background: "transparent",
                color: "#fff"
              }}
              defaultValue={1000000000}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                EventBus.emit("marketcap-update", value);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

