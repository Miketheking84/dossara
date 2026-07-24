import { NextResponse } from "next/server";
import {
  loadMatterCommandCenter,
  MatterResolutionError,
} from "@/lib/sdj-matters";
import {
  generateClaudeReviewPrompt,
  generateWordReadyPrompt,
  parsePromptGeneratorInput,
  PROMPT_TYPES,
  PromptInputValidationError,
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
        { error: "Podaci za generisanje prompta nisu validni." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Prompt trenutno nije moguće generisati." },
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
        { error: "Izabrani predmet ili command-center nije dostupan." },
        { status: 404 },
      );
    }

    const promptType = PROMPT_TYPES.find(
      ({ slug }) => slug === input.promptType,
    );
    if (!promptType) {
      return NextResponse.json(
        { error: "Podaci za generisanje prompta nisu validni." },
        { status: 400 },
      );
    }

    const generationInput = {
      metadata: result.metadata,
      additionalContext: input.additionalContext,
    };

    return NextResponse.json({
      prompt: generateWordReadyPrompt({
        ...generationInput,
        promptType: input.promptType,
      }),
      claudeReviewPrompt: generateClaudeReviewPrompt(generationInput),
      matter: {
        clientFolder: input.clientFolder,
        matterFolder: input.matterFolder,
        matterName: browserSafeMatterName(
          result.metadata.matter,
          input.matterFolder,
        ),
      },
      promptType: {
        slug: promptType.slug,
        label: promptType.label,
      },
    });
  } catch (error) {
    if (error instanceof MatterResolutionError) {
      return NextResponse.json(
        { error: "Izabrani predmet ili command-center nije dostupan." },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "Prompt trenutno nije moguće generisati." },
      { status: 500 },
    );
  }
}
