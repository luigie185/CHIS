import { z } from "zod";
import { requiredText } from "./helpers";

export const cancelEncounterSchema = z.object({ reason: requiredText("Reason", 500) });
