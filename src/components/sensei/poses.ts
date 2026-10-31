import { DefaultPose } from "./DefaultPose";
import { InsightfulPose } from "./InsightfulPose";
import { PatientPose } from "./PatientPose";
import { ObservantPose } from "./ObservantPose";
import { EncouragingPose } from "./EncouragingPose";
import { TeachingPose } from "./TeachingPose";
import { MeditativePose } from "./MeditativePose";
import { AmusedPose } from "./AmusedPose";
import { AnalyticalPose } from "./AnalyticalPose";
import { KnowledgeablePose } from "./KnowledgeablePose";
import { SternPose } from "./SternPose";
import { WisePose } from "./WisePose";
import { VisionaryPose } from "./VisionaryPose";
import { ThoughtfulPose } from "./ThoughtfulPose";
import { GuidingPose } from "./GuidingPose";
import { InspirationalPose } from "./InspirationalPose";
import { MysteriousPose } from "./MysteriousPose";
import { DeterminedPose } from "./DeterminedPose";
import { CompassionatePose } from "./CompassionatePose";
import { EnlightenedPose } from "./EnlightenedPose";
export const poses = {
  default: DefaultPose,
  insightful: InsightfulPose,
  patient: PatientPose,
  observant: ObservantPose,
  encouraging: EncouragingPose,
  teaching: TeachingPose,
  meditative: MeditativePose,
  amused: AmusedPose,
  analytical: AnalyticalPose,
  knowledgeable: KnowledgeablePose,
  stern: SternPose,
  wise: WisePose,
  visionary: VisionaryPose,
  thoughtful: ThoughtfulPose,
  guiding: GuidingPose,
  inspirational: InspirationalPose,
  mysterious: MysteriousPose,
  determined: DeterminedPose,
  compassionate: CompassionatePose,
  enlightened: EnlightenedPose,
};
export type SenseiPose = keyof typeof poses;
