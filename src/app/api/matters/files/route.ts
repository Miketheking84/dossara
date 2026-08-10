import { NextResponse } from "next/server";
import {
  listActiveMatterFileTree,
  MatterFileAccessError,
} from "@/lib/sdj-matter-files";
import { MatterResolutionError } from "@/lib/sdj-matters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readMatterIdentity(request: Request) {
  const url = new URL(request.url);
  const clientFolder = url.searchParams.get("clientFolder");
  const matterFolder = url.searchParams.get("matterFolder");
  if (!clientFolder || !matterFolder) return null;
  return { clientFolder, matterFolder };
}

export async function GET(request: Request) {
  const identity = readMatterIdentity(request);
  if (!identity) {
    return NextResponse.json(
      { error: "Izabrani predmet nije validan." },
      { status: 400 },
    );
  }
  try {
    const tree = await listActiveMatterFileTree(
      identity.clientFolder,
      identity.matterFolder,
    );
    return NextResponse.json(tree, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof MatterResolutionError) {
      return NextResponse.json(
        { error: "Izabrani predmet nije pronađen." },
        { status: 404 },
      );
    }
    if (error instanceof MatterFileAccessError) {
      return NextResponse.json(
        { error: "Sadržaj predmeta nije moguće bezbjedno pročitati." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Sadržaj predmeta trenutno nije dostupan." },
      { status: 500 },
    );
  }
}
