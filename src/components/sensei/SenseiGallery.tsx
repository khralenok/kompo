import { useState } from "react";
import { Sensei } from "./Sensei";
import { poses, type SenseiPose } from "./poses";
export function SenseiGallery() {
  const [replay, setReplay] = useState(0);
  return (
    <main className="sensei-gallery">
      <h1>Kompo Sensei</h1>
      <button onClick={() => setReplay((n) => n + 1)}>Replay reactions</button>
      <div className="sensei-gallery-grid">
        {(Object.keys(poses) as SenseiPose[]).map((pose) => (
          <figure key={pose}>
            <Sensei pose={pose} dialogueKey={replay} />
            <figcaption>{pose}</figcaption>
          </figure>
        ))}
      </div>
    </main>
  );
}
