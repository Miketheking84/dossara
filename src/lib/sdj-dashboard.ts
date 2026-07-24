import "server-only";

import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { connection } from "next/server";
import { loadMatterCommandCenter, type MatterCommandCenterMetadata } from "@/lib/sdj-matters";
import { PROMPT_TYPES } from "@/lib/sdj-prompts";
import { getClientsRoot } from "@/lib/sdj-workspace";

const FINAL_STATUSES = new Set(["zavrseno", "arhiva"]);
const EMPTY_NEXT_ACTIONS = new Set(["-", "—", "n/a", "nije definisano"]);
const RECENT_LIMIT = 5;

export type DashboardMatter = {
  clientFolder: string;
  matterFolder: string;
  clientName: string;
  matterName: string;
  status: string | null;
  priority: string | null;
  nextStep: string | null;
  waitingFor: string | null;
  deadline: string | null;
};

export type DashboardPrompt = {
  fileName: string;
  clientFolder: string;
  matterFolder: string;
  clientName: string;
  matterName: string;
  date: string;
  promptType: string;
};

export type TodayDashboard = {
  summary: {
    activeMatters: number;
    waitingForClient: number;
    waitingForOtherParty: number;
    urgent: number;
    noNextAction: number;
  };
  urgentMatters: DashboardMatter[];
  waitingMatters: DashboardMatter[];
  noNextActionMatters: DashboardMatter[];
  recentPrompts: DashboardPrompt[];
  recentMatters: DashboardMatter[];
  unavailable: boolean;
};

type LoadedMatter = DashboardMatter & {
  active: boolean;
  noNextAction: boolean;
  recentTimestamp: number;
  aiPath: string;
};

const promptTypeLabels = new Map<string, string>(
  PROMPT_TYPES.map(({ slug, label }) => [slug, label]),
);

function normalized(value: string | null) {
  return (
    value
      ?.trim()
      .toLocaleLowerCase("sr-Latn")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "") ?? ""
  );
}

function isActive(metadata: MatterCommandCenterMetadata) {
  return !FINAL_STATUSES.has(normalized(metadata.status));
}

function hasNoNextAction(metadata: MatterCommandCenterMetadata) {
  const value = normalized(metadata.nextStep);
  return value.length === 0 || EMPTY_NEXT_ACTIONS.has(value);
}

function validDateTimestamp(value: string | null) {
  const match = value ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);
  return parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
    ? timestamp
    : null;
}

function toDashboardMatter(
  clientFolder: string,
  matterFolder: string,
  metadata: MatterCommandCenterMetadata,
): DashboardMatter {
  return {
    clientFolder,
    matterFolder,
    clientName: metadata.client?.trim() || clientFolder,
    matterName: metadata.matter?.trim() || matterFolder,
    status: metadata.status,
    priority: metadata.priority,
    nextStep: metadata.nextStep,
    waitingFor: metadata.waitingFor,
    deadline: metadata.deadline,
  };
}

async function loadMatter(
  clientFolder: string,
  matterFolder: string,
): Promise<LoadedMatter | null> {
  try {
    const result = await loadMatterCommandCenter(clientFolder, matterFolder);
    const matterInfo = await stat(result.resolvedMatter.matterPath);
    if (!matterInfo.isDirectory()) return null;

    const matter = toDashboardMatter(clientFolder, matterFolder, result.metadata);
    const active = isActive(result.metadata);
    return {
      ...matter,
      active,
      noNextAction: active && hasNoNextAction(result.metadata),
      recentTimestamp: validDateTimestamp(result.metadata.openedAt) ?? matterInfo.mtimeMs,
      aiPath: result.resolvedMatter.aiPath,
    };
  } catch {
    return null;
  }
}

async function loadAllMatters() {
  const clientsRoot = await getClientsRoot();
  const clients = (await readdir(clientsRoot, { withFileTypes: true })).filter(
    (entry) => entry.isDirectory() && !entry.isSymbolicLink(),
  );
  const nested = await Promise.all(
    clients.map(async (client) => {
      try {
        const clientPath = path.win32.join(clientsRoot, client.name);
        const entries = await readdir(clientPath, { withFileTypes: true });
        return Promise.all(
          entries
            .filter(
              (entry) =>
                entry.isDirectory() &&
                !entry.isSymbolicLink() &&
                entry.name.startsWith("SDJ_"),
            )
            .map((entry) => loadMatter(client.name, entry.name)),
        );
      } catch {
        return [];
      }
    }),
  );
  return nested.flat().filter((matter): matter is LoadedMatter => matter !== null);
}

async function loadRecentPrompts(matters: LoadedMatter[]) {
  const prompts = (
    await Promise.all(
      matters.map(async (matter) => {
        try {
          const entries = await readdir(matter.aiPath, { withFileTypes: true });
          return entries.flatMap((entry) => {
            if (!entry.isFile()) return [];
            const match =
              /^(\d{4}-\d{2}-\d{2})_prompt_([A-Z0-9_]+?)(?:_\d{3})?\.md$/i.exec(
                entry.name,
              );
            if (!match) return [];
            const timestamp = validDateTimestamp(match[1]);
            if (timestamp === null) return [];
            const slug = match[2].toUpperCase();
            return [{
              clientFolder: matter.clientFolder,
              matterFolder: matter.matterFolder,
              clientName: matter.clientName,
              matterName: matter.matterName,
              date: match[1],
              promptType: promptTypeLabels.get(slug) ?? slug.replaceAll("_", " "),
              timestamp,
              fileName: entry.name,
            }];
          });
        } catch {
          return [];
        }
      }),
    )
  )
    .flat()
    .sort((left, right) =>
      right.timestamp - left.timestamp || right.fileName.localeCompare(left.fileName),
    )
    .slice(0, RECENT_LIMIT);

  return prompts.map((prompt) => ({
    fileName: prompt.fileName,
    clientFolder: prompt.clientFolder,
    matterFolder: prompt.matterFolder,
    clientName: prompt.clientName,
    matterName: prompt.matterName,
    date: prompt.date,
    promptType: prompt.promptType,
  }));
}

export async function loadTodayDashboard(): Promise<TodayDashboard> {
  await connection();
  try {
    const matters = await loadAllMatters();
    const activeMatters = matters.filter((matter) => matter.active);
    const waitingForClient = activeMatters.filter(
      (matter) => normalized(matter.waitingFor) === "klijent",
    );
    const waitingForOtherParty = activeMatters.filter(
      (matter) => normalized(matter.waitingFor) === "druga strana",
    );
    const urgentMatters = activeMatters.filter(
      (matter) => normalized(matter.priority) === "hitno",
    );
    const noNextActionMatters = activeMatters.filter((matter) => matter.noNextAction);

    return {
      summary: {
        activeMatters: activeMatters.length,
        waitingForClient: waitingForClient.length,
        waitingForOtherParty: waitingForOtherParty.length,
        urgent: urgentMatters.length,
        noNextAction: noNextActionMatters.length,
      },
      urgentMatters: urgentMatters.slice(0, RECENT_LIMIT),
      waitingMatters: [...waitingForClient, ...waitingForOtherParty].slice(0, RECENT_LIMIT),
      noNextActionMatters: noNextActionMatters.slice(0, RECENT_LIMIT),
      recentPrompts: await loadRecentPrompts(matters),
      recentMatters: [...matters]
        .sort((left, right) => right.recentTimestamp - left.recentTimestamp)
        .slice(0, RECENT_LIMIT),
      unavailable: false,
    };
  } catch {
    return {
      summary: {
        activeMatters: 0,
        waitingForClient: 0,
        waitingForOtherParty: 0,
        urgent: 0,
        noNextAction: 0,
      },
      urgentMatters: [],
      waitingMatters: [],
      noNextActionMatters: [],
      recentPrompts: [],
      recentMatters: [],
      unavailable: true,
    };
  }
}
