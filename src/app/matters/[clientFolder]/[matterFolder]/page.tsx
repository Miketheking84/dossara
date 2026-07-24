import Link from "next/link";
import { notFound } from "next/navigation";
import {
  loadMatterCommandCenter,
  MatterResolutionError,
  type MatterCommandCenterMetadata,
} from "@/lib/sdj-matters";
import { MatterFolderActions } from "./matter-folder-actions";

export const dynamic = "force-dynamic";

type MetadataItem = readonly [
  label: string,
  field: keyof MatterCommandCenterMetadata,
];

const BASIC_ITEMS = [
  ["Klijent", "client"],
  ["Predmet", "matter"],
  ["Datum otvaranja", "openedAt"],
  ["Oblast prava", "legalArea"],
] as const satisfies readonly MetadataItem[];

const FLOW_ITEMS = [
  ["Status", "status"],
  ["Prioritet", "priority"],
  ["Sledeći korak", "nextStep"],
  ["Čeka se od", "waitingFor"],
  ["Detalj čekanja / napomena", "waitingDetail"],
  ["Rok", "deadline"],
] as const satisfies readonly MetadataItem[];

const LEGAL_ITEMS = [
  ["Kratak opis", "shortDescription"],
  ["Ključna pitanja", "keyQuestions"],
  ["Rizici", "risks"],
] as const satisfies readonly MetadataItem[];

const OUTPUT_ITEMS = [
  ["Očekivani output", "expectedOutput"],
  ["Status outputa", "outputStatus"],
] as const satisfies readonly MetadataItem[];

const FINAL_ITEMS = [
  ["Finalni dokument", "finalDocument"],
  ["Finalni cilj", "finalGoal"],
] as const satisfies readonly MetadataItem[];

const detailListStyle = {
  display: "grid",
  gap: "16px",
  margin: 0,
} as const;

const detailRowStyle = {
  display: "grid",
  gap: "5px",
} as const;

const detailTermStyle = {
  color: "#667386",
  fontSize: "12px",
  fontWeight: 700,
} as const;

const detailValueStyle = {
  margin: 0,
  color: "#24384f",
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
} as const;

function displayValue(value: string | null) {
  return value ?? "Nije navedeno";
}

function MetadataSection({
  title,
  items,
  metadata,
}: {
  title: string;
  items: readonly MetadataItem[];
  metadata: MatterCommandCenterMetadata;
}) {
  return (
    <section className="work-panel">
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
        </div>
      </div>
      <dl style={{ ...detailListStyle, padding: "22px 24px" }}>
        {items.map(([label, field]) => (
          <div key={field} style={detailRowStyle}>
            <dt style={detailTermStyle}>{label}</dt>
            <dd style={detailValueStyle}>{displayValue(metadata[field])}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default async function MatterCockpitPage({
  params,
}: {
  params: Promise<{ clientFolder: string; matterFolder: string }>;
}) {
  const { clientFolder, matterFolder } = await params;

  let result;
  try {
    result = await loadMatterCommandCenter(clientFolder, matterFolder);
  } catch (error) {
    if (error instanceof MatterResolutionError) notFound();
    throw error;
  }

  const { metadata, fileStatus, warnings, resolvedMatter } = result;
  const clientName = metadata.client ?? clientFolder;
  const matterName = metadata.matter ?? matterFolder;

  return (
    <main className="page-section">
      <nav aria-label="Povratak na Matters" style={{ marginBottom: "24px" }}>
        <Link href="/matters">← Nazad na Matters</Link>
      </nav>

      <header className="page-header">
        <div>
          <p className="section-label">Matter Cockpit</p>
          <h1>{matterName}</h1>
          <p className="page-description">Klijent: {clientName}</p>
        </div>
      </header>

      <MatterFolderActions
        clientFolder={resolvedMatter.clientFolder}
        matterFolder={resolvedMatter.matterFolder}
      />
      <nav
        className="matter-cockpit-prompt-action"
        aria-label="AI akcije predmeta"
      >
        <Link
          href={{
            pathname: "/prompts",
            query: {
              clientFolder: resolvedMatter.clientFolder,
              matterFolder: resolvedMatter.matterFolder,
            },
          }}
        >
          Generate Prompt
        </Link>
      </nav>

      {fileStatus !== "ok" ? (
        <section className="work-panel" style={{ marginTop: "30px" }}>
          <div className="panel-heading">
            <div>
              <h2>Podaci predmeta</h2>
              <p>
                {fileStatus === "missing"
                  ? "command-center.md nije pronađen za ovaj predmet."
                  : "command-center.md postoji, ali trenutno nije moguće pročitati njegov sadržaj."}
              </p>
            </div>
          </div>
          <dl style={{ ...detailListStyle, padding: "22px 24px" }}>
            <div style={detailRowStyle}>
              <dt style={detailTermStyle}>Klijent</dt>
              <dd style={detailValueStyle}>{clientFolder}</dd>
            </div>
            <div style={detailRowStyle}>
              <dt style={detailTermStyle}>Matter folder</dt>
              <dd style={detailValueStyle}>{matterFolder}</dd>
            </div>
          </dl>
        </section>
      ) : (
        <>
          <section className="work-panel" style={{ marginTop: "30px" }}>
            <div className="panel-heading">
              <div>
                <h2>Pregled</h2>
                <p>Najvažniji podaci aktivnog predmeta</p>
              </div>
            </div>
            <dl
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "20px",
                margin: 0,
                padding: "22px 24px",
              }}
            >
              {[
                ["Klijent", clientName],
                ["Predmet", matterName],
                ["Status", displayValue(metadata.status)],
                ["Prioritet", displayValue(metadata.priority)],
                ["Rok", displayValue(metadata.deadline)],
              ].map(([label, value]) => (
                <div key={label} style={detailRowStyle}>
                  <dt style={detailTermStyle}>{label}</dt>
                  <dd style={detailValueStyle}>{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {warnings.length > 0 ? (
            <p className="active-matters-message" role="status">
              Neki podaci u command-center.md nisu mogli biti potpuno
              protumačeni.
            </p>
          ) : null}

          <div
            style={{
              display: "grid",
              gap: "22px",
              marginTop: "22px",
            }}
          >
            <MetadataSection
              title="Osnovni podaci"
              items={BASIC_ITEMS}
              metadata={metadata}
            />
            <MetadataSection
              title="Tok predmeta"
              items={FLOW_ITEMS}
              metadata={metadata}
            />
            <MetadataSection
              title="Pravna analiza"
              items={LEGAL_ITEMS}
              metadata={metadata}
            />
            <MetadataSection
              title="Očekivani rezultat"
              items={OUTPUT_ITEMS}
              metadata={metadata}
            />
            <MetadataSection
              title="Finalizacija"
              items={FINAL_ITEMS}
              metadata={metadata}
            />
          </div>
        </>
      )}
    </main>
  );
}
