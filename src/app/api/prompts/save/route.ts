import { NextResponse } from "next/server";
import {
  loadMatterCommandCenter,
  MatterResolutionError,
} from "@/lib/sdj-matters";
import {
  parsePromptGeneratorInput,
  PromptInputValidationError,
  saveGeneratedPrompt,
  SavePromptError,
} from "@/lib/sdj-prompts";

export const runtime = "nodejs";

const UNSAFE_BROWSER_TEXT =
  /(?:[a-z]:[\\/]|\\\\|matterPath|controlPath|aiPath|workspace\s*root|activeRootPath|allowedTestRoot|OneDrive)/i;

function browserSafeMatterName(
  matterName: string | null,
  matterFolder: string,
) {
  const normalized = matterName
    ?.replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized && !UNSAFE_BROWSER_TEXT.test(normalized)
    ? normalized
    : matterFolder;
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Zahtev mora sadržati validan JSON." },
      { status: 400 },
    );
  }

  let input;
  try {
    input = parsePromptGeneratorInput(payload);
  } catch (error) {
    if (error instanceof PromptInputValidationError) {
      return NextResponse.json(
        { error: "Podaci za čuvanje prompta nisu validni." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Prompt trenutno nije moguće sačuvati." },
      { status: 500 },
    );
  }

  try {
    const result = await loadMatterCommandCenter(
      input.clientFolder,
      input.matterFolder,
    );
    if (result.fileStatus !== "ok") {
      return NextResponse.json(
        { error: "Predmet ili potrebni lokalni fajlovi nisu dostupni." },
        { status: 404 },
      );
    }

    const saved = await saveGeneratedPrompt({
      resolvedMatter: result.resolvedMatter,
      metadata: result.metadata,
      promptType: input.promptType,
      additionalContext: input.additionalContext,
    });

    return NextResponse.json({
      savedPrompt: {
        fileName: saved.fileName,
        relativePath: saved.relativePath,
      },
      matter: {
        clientFolder: input.clientFolder,
        matterFolder: input.matterFolder,
        matterName: browserSafeMatterName(
          result.metadata.matter,
          input.matterFolder,
        ),
      },
      promptType: saved.promptType,
    });
  } catch (error) {
    if (error instanceof MatterResolutionError) {
      return NextResponse.json(
        { error: "Predmet ili potrebni lokalni fajlovi nisu dostupni." },
        { status: 404 },
      );
    }
    if (error instanceof SavePromptError) {
      if (error.code === "TARGET_UNAVAILABLE") {
        return NextResponse.json(
          { error: "Predmet ili potrebni lokalni fajlovi nisu dostupni." },
          { status: 404 },
        );
      }
      if (error.code === "NAMES_EXHAUSTED") {
        return NextResponse.json(
          { error: "Slobodno ime za prompt trenutno nije dostupno." },
          { status: 409 },
        );
      }
    }
    return NextResponse.json(
      { error: "Prompt trenutno nije moguće sačuvati." },
      { status: 500 },
    );
  }
}
