import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type en from "@/i18n/messages/en.json";
import {
  loadMatterCommandCenter,
  MatterResolutionError,
  type MatterCommandCenterMetadata,
} from "@/lib/sdj-matters";
import { MatterFolderActions } from "./matter-folder-actions";

export const dynamic = "force-dynamic";

type MatterCockpitKey = keyof typeof en.MatterCockpit;
type MetadataItem = readonly [
  label: MatterCockpitKey,
  field: keyof MatterCommandCenterMetadata,
];

const BASIC_ITEMS = [
  ["client", "client"], ["matter", "matter"], ["openedAt", "openedAt"], ["legalArea", "legalArea"],
] as const satisfies readonly MetadataItem[];

const FLOW_ITEMS = [
  ["status", "status"], ["priority", "priority"], ["nextStep", "nextStep"], ["waitingFor", "waitingFor"], ["waitingDetail", "waitingDetail"], ["deadline", "deadline"],
] as const satisfies readonly MetadataItem[];

const LEGAL_ITEMS = [
  ["shortDescription", "shortDescription"], ["keyQuestions", "keyQuestions"], ["risks", "risks"],
] as const satisfies readonly MetadataItem[];

const OUTPUT_ITEMS = [
  ["expectedOutput", "expectedOutput"], ["outputStatus", "outputStatus"],
] as const satisfies readonly MetadataItem[];

const FINAL_ITEMS = [
  ["finalDocument", "finalDocument"], ["finalGoal", "finalGoal"],
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

function displayValue(value: string | null, fallback: string) {
  return value ?? fallback;
}

function MetadataSection({
  title,
  items,
  metadata,
  translate,
}: {
  title: string;
  items: readonly MetadataItem[];
  metadata: MatterCommandCenterMetadata;
  translate: (key: MatterCockpitKey) => string;
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
            <dt style={detailTermStyle}>{translate(label)}</dt>
            <dd style={detailValueStyle}>{displayValue(metadata[field], translate("notProvided"))}</dd>
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
  const t = await getTranslations("MatterCockpit");
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
      <nav aria-label={t("back")} style={{ marginBottom: "24px" }}>
        <Link href="/matters">← {t("back")}</Link>
      </nav>

      <header className="page-header">
        <div>
          <p className="section-label">{t("title")}</p>
          <h1>{matterName}</h1>
          <p className="page-description">{t("client")}: {clientName}</p>
        </div>
      </header>

      <MatterFolderActions
        clientFolder={resolvedMatter.clientFolder}
        matterFolder={resolvedMatter.matterFolder}
      />
      <nav
        className="matter-cockpit-prompt-action"
        aria-label={t("aiActions")}
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
          {t("generatePrompt")}
        </Link>
      </nav>

      {fileStatus !== "ok" ? (
        <section className="work-panel" style={{ marginTop: "30px" }}>
          <div className="panel-heading">
            <div>
              <h2>{t("matterData")}</h2>
              <p>
                {fileStatus === "missing"
                  ? t("controlMissing") : t("controlUnreadable")}
              </p>
            </div>
          </div>
          <dl style={{ ...detailListStyle, padding: "22px 24px" }}>
            <div style={detailRowStyle}>
              <dt style={detailTermStyle}>{t("client")}</dt>
              <dd style={detailValueStyle}>{clientFolder}</dd>
            </div>
            <div style={detailRowStyle}>
              <dt style={detailTermStyle}>{t("matterFolder")}</dt>
              <dd style={detailValueStyle}>{matterFolder}</dd>
            </div>
          </dl>
        </section>
      ) : (
        <>
          <section className="work-panel" style={{ marginTop: "30px" }}>
            <div className="panel-heading">
              <div>
                <h2>{t("overview")}</h2><p>{t("overviewHelp")}</p>
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
                [t("client"), clientName], [t("matter"), matterName], [t("status"), displayValue(metadata.status, t("notProvided"))], [t("priority"), displayValue(metadata.priority, t("notProvided"))], [t("deadline"), displayValue(metadata.deadline, t("notProvided"))],
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
              {t("warning")}
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
              title={t("basic")}
              items={BASIC_ITEMS}
              metadata={metadata}
              translate={t}
            />
            <MetadataSection
              title={t("flow")}
              items={FLOW_ITEMS}
              metadata={metadata}
              translate={t}
            />
            <MetadataSection
              title={t("legal")}
              items={LEGAL_ITEMS}
              metadata={metadata}
              translate={t}
            />
            <MetadataSection
              title={t("expected")}
              items={OUTPUT_ITEMS}
              metadata={metadata}
              translate={t}
            />
            <MetadataSection
              title={t("finalization")}
              items={FINAL_ITEMS}
              metadata={metadata}
              translate={t}
            />
          </div>
        </>
      )}
    </main>
  );
}
