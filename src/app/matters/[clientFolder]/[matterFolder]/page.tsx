import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type en from "@/i18n/messages/en.json";
import {
  loadMatterCommandCenter,
  MatterResolutionError,
  type MatterCommandCenterMetadata,
} from "@/lib/sdj-matters";
import { listActiveMatterFileTree } from "@/lib/sdj-matter-files";
import type { MatterWorkValues } from "@/lib/sdj-work-fields";
import { MatterFileBrowser } from "./matter-file-browser";
import { NextStepReviewPanel } from "./next-step-review-panel";
import { MatterWorkEditor } from "./matter-work-editor";

export const dynamic = "force-dynamic";

type MatterCockpitKey = keyof typeof en.MatterCockpit;
type MetadataItem = readonly [
  label: MatterCockpitKey,
  field: keyof MatterCommandCenterMetadata,
];

const LEGAL_ITEMS = [
  ["shortDescription", "shortDescription"], ["keyQuestions", "keyQuestions"], ["risks", "risks"],
] as const satisfies readonly MetadataItem[];

const OUTCOME_ITEMS = [
  ["expectedOutput", "expectedOutput"], ["outputStatus", "outputStatus"], ["finalDocument", "finalDocument"], ["finalGoal", "finalGoal"],
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

function PresentMetadataSection({
  title,
  description,
  items,
  metadata,
  translate,
  emptyMessage,
}: {
  title: string;
  description: string;
  items: readonly MetadataItem[];
  metadata: MatterCommandCenterMetadata;
  translate: (key: MatterCockpitKey) => string;
  emptyMessage?: string;
}) {
  const visibleItems = items.filter(([, field]) => metadata[field] !== null);
  if (visibleItems.length === 0 && !emptyMessage) return null;

  return (
    <section className="work-panel matter-cockpit-section">
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      {visibleItems.length > 0 ? (
        <dl className="matter-cockpit-detail-grid">
          {visibleItems.map(([label, field]) => (
            <div key={field} style={detailRowStyle}>
              <dt style={detailTermStyle}>{translate(label)}</dt>
              <dd style={detailValueStyle}>{metadata[field]}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="matter-cockpit-empty">{emptyMessage}</p>
      )}
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
  let initialFileTree;
  try {
    [result, initialFileTree] = await Promise.all([
      loadMatterCommandCenter(clientFolder, matterFolder),
      listActiveMatterFileTree(clientFolder, matterFolder),
    ]);
  } catch (error) {
    if (error instanceof MatterResolutionError) notFound();
    throw error;
  }

  const { metadata, fileStatus, warnings, resolvedMatter } = result;
  const clientName = metadata.client ?? clientFolder;
  const matterName = metadata.matter ?? matterFolder;
  const headerDetails = [
    metadata.openedAt ? [t("openedAt"), metadata.openedAt] : null,
    metadata.legalArea ? [t("legalArea"), metadata.legalArea] : null,
    metadata.matterType ? [t("matterType"), metadata.matterType] : null,
  ].filter((item): item is [string, string] => item !== null);
  const initialWorkValues: MatterWorkValues = {
    status: metadata.status ?? "",
    priority: metadata.priority ?? "",
    nextStep: metadata.nextStep ?? "",
    waitingFor: metadata.waitingFor ?? "",
    waitingDetail: metadata.waitingDetail ?? "",
    deadline: metadata.deadline ?? "",
  };

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
          {headerDetails.length > 0 ? (
            <dl className="matter-cockpit-header-meta">
              {headerDetails.map(([label, value]) => (
                <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
              ))}
            </dl>
          ) : null}
        </div>
      </header>

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

      <MatterFileBrowser
        clientFolder={resolvedMatter.clientFolder}
        matterFolder={resolvedMatter.matterFolder}
        initialTree={initialFileTree}
      />

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
          {warnings.length > 0 ? (
            <p className="active-matters-message" role="status">
              {t("warning")}
            </p>
          ) : null}

          <div className="matter-cockpit-sections">
            <MatterWorkEditor
              clientFolder={resolvedMatter.clientFolder}
              matterFolder={resolvedMatter.matterFolder}
              initialMatterType={metadata.matterType ?? ""}
              initialValues={initialWorkValues}
            />
            <NextStepReviewPanel clientFolder={resolvedMatter.clientFolder} matterFolder={resolvedMatter.matterFolder} />
            <PresentMetadataSection
              title={t("legal")}
              description={t("legalDescription")}
              items={LEGAL_ITEMS}
              metadata={metadata}
              translate={t}
            />
            <PresentMetadataSection
              title={t("outcomeTitle")}
              description={t("outcomeDescription")}
              items={OUTCOME_ITEMS}
              metadata={metadata}
              translate={t}
            />
          </div>
        </>
      )}
    </main>
  );
}
