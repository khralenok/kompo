import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { poses, type SenseiPose } from "./poses";
import { reactions } from "./reactions";

gsap.registerPlugin(useGSAP);

/** A new dialogue key plays once. Unrelated renders leave the settled pose alone. */
export function Sensei({
  pose,
  dialogueKey,
}: {
  pose: SenseiPose;
  dialogueKey: string | number;
}) {
  const root = useRef<HTMLDivElement>(null);
  const Pose = poses[pose];
  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add(
        "(prefers-reduced-motion: no-preference)",
        () => {
          const motion = reactions[pose];
          const bodyRotation = Number(
            gsap.getProperty(
              root.current!.querySelector('[data-part="body"]')!,
              "rotation",
            ),
          );
          const timeline = gsap.timeline();
          const celebrating = [
            "encouraging",
            "amused",
            "inspirational",
            "enlightened",
          ].includes(pose);
          const thoughtful = [
            "thoughtful",
            "patient",
            "compassionate",
            "wise",
            "meditative",
          ].includes(pose);
          // Arrival → gesture → perceptible hold → settle. No repeats or idle loop.
          timeline.from("svg", {
            opacity: 0,
            y: 24,
            duration: 0.4,
            ease: "power2.out",
          });
          timeline.from(
            '[data-part="body"]',
            {
              rotation: motion.tilt * 1.6,
              y: celebrating ? 14 : 4,
              transformOrigin: "50% 85%",
              duration: 0.7,
              ease: "power2.out",
            },
            0.12,
          );
          timeline.from(
            '[data-part="brows"]',
            {
              y: motion.brow * 2,
              duration: 0.65,
              ease: "power2.out",
            },
            0.35,
          );
          timeline.from(
            `[data-part="${motion.part}"]`,
            {
              scale: 0.78,
              opacity: 0,
              transformOrigin: "50% 60%",
              duration: 0.65,
              ease: "back.out(1.2)",
            },
            0.5,
          );
          if (thoughtful) {
            timeline.to(
              '[data-part="body"]',
              {
                rotation: bodyRotation + (motion.tilt || 3),
                transformOrigin: "50% 85%",
                duration: 0.35,
              },
              0.85,
            );
            timeline.to(
              '[data-part="body"]',
              { rotation: bodyRotation, duration: 0.45, ease: "power2.inOut" },
              1.5,
            );
          } else if (celebrating) {
            timeline.to(
              '[data-part="body"]',
              {
                y: -10,
                rotation: bodyRotation - 3,
                transformOrigin: "50% 85%",
                duration: 0.3,
                ease: "power2.out",
              },
              0.85,
            );
            timeline.to(
              '[data-part="accent"]',
              { scale: 1.14, transformOrigin: "50% 50%", duration: 0.35 },
              1.0,
            );
            timeline.to(
              '[data-part="body"]',
              {
                y: 0,
                rotation: bodyRotation,
                duration: 0.55,
                ease: "back.out(1.3)",
              },
              1.65,
            );
            timeline.to(
              '[data-part="accent"]',
              { scale: 1, duration: 0.45 },
              1.85,
            );
          } else {
            timeline.to(
              '[data-part="prop"]',
              {
                rotation: pose === "teaching" || pose === "guiding" ? -9 : 4,
                transformOrigin: "50% 85%",
                duration: 0.35,
              },
              0.85,
            );
            timeline.to(
              '[data-part="prop"]',
              { rotation: 0, duration: 0.5, ease: "power2.inOut" },
              1.45,
            );
          }
        },
        root,
      );
      return () => media.revert();
    },
    { scope: root, dependencies: [pose, dialogueKey], revertOnUpdate: true },
  );
  return (
    <div ref={root} className="sensei" data-pose={pose}>
      <Pose />
    </div>
  );
}
