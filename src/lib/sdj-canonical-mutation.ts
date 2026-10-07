import "server-only";

import { randomUUID } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import {
  acceptExternalMatterControlBaseline,
  acceptMatterControlBaseline,
  currentMatterControl,
  exactReadToken,
  mutateMatterControl,
  WINDOWS_PUBLICATION_HELPER,
} from "../../spikes/write-1v-v1-mutation/canonical-mutation";
import type {
  BaselineAcceptanceResult,
  MutableMatterField,
  MutationResult,
} from "../../spikes/write-1v-v1-mutation/contracts";
import {
  parseMatterCommandCenter,
  type ResolvedActiveMatter,
} from "./sdj-matters";

const ACTOR = "sdj-mike-v1-local-user";
const SOURCE = "WRITE-PROD-1A";

export type CanonicalBaselineState =
  | "BASELINE_REQUIRED"
  | "CURRENT"
  | "EXTERNAL_BASELINE_REVIEW_REQUIRED";

export type CanonicalMatterState = {
  readToken: string;
  acceptedRevisionId?: string;
  baselineState: CanonicalBaselineState;
  publicationReady: boolean;
  values: {
    matterType: string;
    nextStep: string;
  };
};

type CanonicalDescriptor = {
  workspaceRoot: string;
  evidenceStorageRoot: string;
  canonicalRelativePath: string;
  matterId: string;
  commandCenterPath: string;
};

function canonicalDescriptor(matter: ResolvedActiveMatter): CanonicalDescriptor {
  const commandCenterPath = path.join(matter.controlPath, "command-center.md");
  return {
    workspaceRoot: matter.workspaceRoot,
    evidenceStorageRoot: matter.matterPath,
    canonicalRelativePath: path.relative(matter.workspaceRoot, commandCenterPath),
    matterId: `${matter.clientFolder}/${matter.matterFolder}`,
    commandCenterPath,
  };
}

function decodeStrictUtf8(bytes: Buffer): string {
  const body = bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]))
    ? bytes.subarray(3)
    : bytes;
  return new TextDecoder("utf-8", { fatal: true }).decode(body);
}

export async function readCanonicalMatterState(
  matter: ResolvedActiveMatter,
): Promise<CanonicalMatterState> {
  const descriptor = canonicalDescriptor(matter);
  const bytes = await readFile(descriptor.commandCenterPath);
  const readToken = exactReadToken(bytes);
  const metadata = parseMatterCommandCenter(decodeStrictUtf8(bytes)).metadata;
  const [current, publicationReady] = await Promise.all([
    currentMatterControl(
      descriptor.evidenceStorageRoot,
      descriptor.matterId,
      descriptor.canonicalRelativePath,
    ),
    access(WINDOWS_PUBLICATION_HELPER).then(() => true, () => false),
  ]);
  const baselineState: CanonicalBaselineState = !current
    ? "BASELINE_REQUIRED"
    : current.readToken === readToken
      ? "CURRENT"
      : "EXTERNAL_BASELINE_REVIEW_REQUIRED";

  return {
    readToken,
    acceptedRevisionId: current?.revisionId,
    baselineState,
    publicationReady,
    values: {
      matterType: metadata.matterType ?? "",
      nextStep: metadata.nextStep ?? "",
    },
  };
}

export async function acceptCanonicalMatterBaseline(
  matter: ResolvedActiveMatter,
  expectedReadToken: string,
): Promise<BaselineAcceptanceResult> {
  const descriptor = canonicalDescriptor(matter);
  const transactionId = randomUUID();
  return acceptMatterControlBaseline({
    workspaceRoot: descriptor.workspaceRoot,
    evidenceStorageRoot: descriptor.evidenceStorageRoot,
    canonicalRelativePath: descriptor.canonicalRelativePath,
    matterId: descriptor.matterId,
    transactionId,
    revisionId: randomUUID(),
    expectedReadToken,
    actor: ACTOR,
    source: SOURCE,
    recordedAt: new Date().toISOString(),
  });
}

export async function acceptExternalCanonicalMatterBaseline(
  matter: ResolvedActiveMatter,
  expectedReadToken: string,
): Promise<BaselineAcceptanceResult> {
  const descriptor = canonicalDescriptor(matter);
  return acceptExternalMatterControlBaseline({
    workspaceRoot: descriptor.workspaceRoot,
    evidenceStorageRoot: descriptor.evidenceStorageRoot,
    canonicalRelativePath: descriptor.canonicalRelativePath,
    matterId: descriptor.matterId,
    transactionId: randomUUID(),
    revisionId: randomUUID(),
    expectedReadToken,
    actor: ACTOR,
    source: SOURCE,
    recordedAt: new Date().toISOString(),
  });
}

export async function mutateCanonicalMatter(
  matter: ResolvedActiveMatter,
  input: {
    field: MutableMatterField;
    value: string;
    expectedReadToken: string;
    acceptedRevisionId: string;
  },
): Promise<MutationResult> {
  const descriptor = canonicalDescriptor(matter);
  return mutateMatterControl({
    workspaceRoot: descriptor.workspaceRoot,
    evidenceStorageRoot: descriptor.evidenceStorageRoot,
    canonicalRelativePath: descriptor.canonicalRelativePath,
    matterId: descriptor.matterId,
    transactionId: randomUUID(),
    resultingRevisionId: randomUUID(),
    acceptedRevisionId: input.acceptedRevisionId,
    expectedReadToken: input.expectedReadToken,
    actor: ACTOR,
    source: SOURCE,
    recordedAt: new Date().toISOString(),
    mutations: [{ field: input.field, value: input.value }],
  });
}

// Bounded Alpha review identity; ordinary manual editing retains its existing API.
export async function applyReviewedNextStep(
  matter: ResolvedActiveMatter,
  input: { transactionId: string; resultingRevisionId: string; acceptedRevisionId: string; expectedReadToken: string;
    value: string; actor: string; source: string; recordedAt: string },
  options: import("../../spikes/write-1v-v1-mutation/canonical-mutation").MutationHarnessOptions = {},
): Promise<MutationResult> {
  const descriptor = canonicalDescriptor(matter);
  return mutateMatterControl({ ...descriptor, ...input, mutations: [{ field: "nextStep", value: input.value }] },
    { ...options, replay: true });
}
