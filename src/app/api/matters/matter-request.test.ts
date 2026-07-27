import { describe, expect, it } from "vitest";
import {
  INITIAL_DOCUMENT_MAX_FILE_COUNT,
  INITIAL_DOCUMENT_MAX_FILE_SIZE_BYTES,
} from "../../../lib/sdj-initial-documents";
import { parseMatterRequest } from "./matter-request";

const validInput = {
  client: "TEST_CLIENT",
  matterName: "Test matter",
  openingDate: "2026-07-27",
  legalArea: "Ugovorno pravo",
  status: "Aktivan",
  priority: "Srednji",
  description: "Opis",
  nextStep: "Pregled",
  expectedOutput: "Mišljenje",
  deadline: "",
  waitingFrom: "Niko / nije primenljivo",
  waitingDetail: "",
  folderNameOverride: "",
};

function jsonRequest(body: unknown, contentType = "application/json") {
  return new Request("http://localhost/api/matters", {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: JSON.stringify(body),
  });
}

function appendFormDataValue(
  formData: FormData,
  field: string,
  value: string | File,
) {
  if (value instanceof File) {
    formData.append(field, value, value.name);
  } else {
    formData.append(field, value);
  }
}

function validMultipartFormData(
  fields: Record<string, string | File> = validInput,
) {
  const formData = new FormData();
  for (const [field, value] of Object.entries(fields)) {
    appendFormDataValue(formData, field, value);
  }
  return formData;
}

function multipartRequest(
  files: readonly { field?: string; file: File }[] = [],
  fields: Record<string, string | File> = validInput,
) {
  const formData = validMultipartFormData(fields);
  for (const { field = "initialDocuments", file } of files) {
    formData.append(field, file, file.name);
  }
  return new Request("http://localhost/api/matters", {
    method: "POST",
    body: formData,
  });
}

function multipartRequestWithEntries(
  entries: readonly [field: string, value: string | File][],
) {
  const formData = validMultipartFormData();
  for (const [field, value] of entries) {
    appendFormDataValue(formData, field, value);
  }
  return new Request("http://localhost/api/matters", {
    method: "POST",
    body: formData,
  });
}

function withAdditionalContentTypeParameters(
  request: Request,
  parameters: string,
) {
  const contentType = request.headers.get("content-type");
  if (!contentType) throw new Error("Expected generated multipart Content-Type.");
  return new Request(request, {
    headers: { "Content-Type": `${contentType}; ${parameters}` },
  });
}

function requestWithParsedFormData(formData: FormData) {
  const request = new Request("http://localhost/api/matters", {
    method: "POST",
    headers: { "Content-Type": "multipart/form-data" },
  });
  Object.defineProperty(request, "formData", {
    value: async () => formData,
  });
  return request;
}

async function expectParsed(request: Request) {
  const result = await parseMatterRequest(request);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error);
  return result;
}

async function expectParseError(request: Request, status: 400 | 415) {
  const result = await parseMatterRequest(request);
  expect(result).toMatchObject({ ok: false, status });
  if (result.ok) throw new Error("Expected parsing to fail.");
  return result;
}

describe("parseMatterRequest JSON compatibility", () => {
  it("parses application/json without files", async () => {
    const result = await expectParsed(jsonRequest(validInput));

    expect(result).toEqual({
      ok: true,
      input: validInput,
      format: "json",
      initialDocumentCount: 0,
    });
  });

  it.each([
    "application/json; charset=utf-8",
    "Application/JSON; Charset=UTF-8",
    " application/json ; charset=utf-8 ",
  ])("accepts the standard JSON Content-Type variant %s", async (contentType) => {
    const result = await expectParsed(jsonRequest(validInput, contentType));

    expect(result.format).toBe("json");
    expect(result.input).toEqual(validInput);
  });

  it("keeps the existing textual shape, trim, and defaults", async () => {
    const result = await expectParsed(
      jsonRequest({
        client: " TEST_CLIENT ",
        matterName: " Test matter ",
        openingDate: " 2026-07-27 ",
      }),
    );

    expect(result.input).toEqual({
      client: "TEST_CLIENT",
      matterName: "Test matter",
      openingDate: "2026-07-27",
      legalArea: "Opšte",
      status: "Aktivan",
      priority: "Srednji",
      description: "",
      nextStep: "",
      expectedOutput: "",
      deadline: "",
      waitingFrom: "Niko / nije primenljivo",
      waitingDetail: "",
      folderNameOverride: "",
    });
    expect(result.initialDocumentCount).toBe(0);
  });

  it("rejects malformed JSON with the existing controlled error", async () => {
    const request = new Request("http://localhost/api/matters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });

    await expect(expectParseError(request, 400)).resolves.toMatchObject({
      error: "Neispravan JSON zahtev.",
    });
  });

  it("leaves valid non-object JSON for the existing required-field check", async () => {
    const result = await expectParsed(jsonRequest(null));

    expect(result.input).toBeNull();
    expect(result.initialDocumentCount).toBe(0);
  });
});

describe("parseMatterRequest multipart input", () => {
  it("parses multipart without files", async () => {
    const result = await expectParsed(multipartRequest());

    expect(result.format).toBe("multipart");
    expect(result.input).toEqual(validInput);
    expect(result.initialDocumentCount).toBe(0);
  });

  it("accepts multipart/form-data with a generated boundary", async () => {
    const request = multipartRequest();

    expect(request.headers.get("content-type")).toMatch(
      /^multipart\/form-data; boundary=/,
    );
    await expect(expectParsed(request)).resolves.toMatchObject({
      format: "multipart",
    });
  });

  it("accepts multipart with boundary and additional parameters", async () => {
    const request = withAdditionalContentTypeParameters(
      multipartRequest(),
      "charset=utf-8",
    );

    await expect(expectParsed(request)).resolves.toMatchObject({
      format: "multipart",
    });
  });

  it("accepts one valid File metadata entry", async () => {
    const result = await expectParsed(
      multipartRequest([
        {
          file: new File(["pdf"], "document.pdf", {
            type: "application/pdf",
          }),
        },
      ]),
    );

    expect(result.initialDocumentCount).toBe(1);
  });

  it("accepts multiple valid File metadata entries", async () => {
    const result = await expectParsed(
      multipartRequest([
        {
          file: new File(["pdf"], "document.pdf", {
            type: "application/pdf",
          }),
        },
        {
          file: new File(["text"], "notes.txt", { type: "text/plain" }),
        },
      ]),
    );

    expect(result.initialDocumentCount).toBe(2);
  });

  it.each([
    ["client", "SECOND_CLIENT"],
    ["matterName", "Second matter"],
    ["client", validInput.client],
  ])(
    "rejects the repeated textual field %s",
    async (field, repeatedValue) => {
      const result = await expectParseError(
        multipartRequestWithEntries([[field, repeatedValue]]),
        400,
      );

      expect(result.error).toBe(
        "Multipart zahtjev sadrži ponovljeno tekstualno polje.",
      );
    },
  );

  it("does not expose a repeated field name or value", async () => {
    const secretValue = "C:\\private\\CLIENT_SECRET";
    const result = await expectParseError(
      multipartRequestWithEntries([["client", secretValue]]),
      400,
    );

    expect(result.error).toBe(
      "Multipart zahtjev sadrži ponovljeno tekstualno polje.",
    );
    expect(result.error).not.toContain("client");
    expect(result.error).not.toContain("CLIENT_SECRET");
    expect(result.error).not.toContain("C:\\private");
  });

  it.each([
    [
      "File then string",
      [
        new File(["pdf"], "document.pdf", { type: "application/pdf" }),
        "document.pdf",
      ],
    ],
    [
      "string then File",
      [
        "document.pdf",
        new File(["pdf"], "document.pdf", { type: "application/pdf" }),
      ],
    ],
  ] as const)(
    "rejects mixed initialDocuments entries: %s",
    async (_label, values) => {
      const result = await expectParseError(
        multipartRequestWithEntries(
          values.map((value) => ["initialDocuments", value] as const),
        ),
        400,
      );

      expect(result.error).toBe(
        "Početna dokumentacija mora sadržati fajlove.",
      );
    },
  );

  it("sends an empty File name through central metadata validation", async () => {
    const formData = validMultipartFormData();
    formData.append("initialDocuments", new File(["x"], ""));

    const result = await expectParseError(
      requestWithParsedFormData(formData),
      400,
    );

    expect(result.error).toBe(
      "Početna dokumentacija nije prihvaćena. Provjerite tip, naziv, broj i veličinu fajlova.",
    );
  });

  it("rejects a zero-byte File through central metadata validation", async () => {
    const result = await expectParseError(
      multipartRequest([{ file: new File([], "empty.pdf") }]),
      400,
    );

    expect(result.error).toBe(
      "Početna dokumentacija nije prihvaćena. Provjerite tip, naziv, broj i veličinu fajlova.",
    );
  });

  it("provides a route guard state before filesystem mutation", async () => {
    const result = await expectParsed(
      multipartRequest([{ file: new File(["pdf"], "document.pdf") }]),
    );

    expect(result).toMatchObject({
      format: "multipart",
      initialDocumentCount: 1,
    });
    expect(result.initialDocumentCount).toBeGreaterThan(0);
  });

  it("rejects a forbidden extension with a browser-safe error", async () => {
    const result = await expectParseError(
      multipartRequest([
        {
          file: new File(
            ["secret"],
            "C:\\private\\private-secret.exe",
            { type: "application/x-private-secret" },
          ),
        },
      ]),
      400,
    );

    expect(result.error).toBe(
      "Početna dokumentacija nije prihvaćena. Provjerite tip, naziv, broj i veličinu fajlova.",
    );
    expect(result.error).not.toContain("private-secret");
    expect(result.error).not.toContain("application/x-private-secret");
    expect(result.error).not.toContain("C:\\private");
    expect(result.error).not.toContain("EXTENSION_NOT_ALLOWED");
  });

  it("rejects too many files", async () => {
    const files = Array.from(
      { length: INITIAL_DOCUMENT_MAX_FILE_COUNT + 1 },
      (_, index) => ({ file: new File(["x"], `${index}.pdf`) }),
    );

    await expect(
      expectParseError(multipartRequest(files), 400),
    ).resolves.toMatchObject({
      error:
        "Početna dokumentacija nije prihvaćena. Provjerite tip, naziv, broj i veličinu fajlova.",
    });
  });

  it("rejects an oversized file", async () => {
    const oversized = new File(
      [new Uint8Array(INITIAL_DOCUMENT_MAX_FILE_SIZE_BYTES + 1)],
      "oversized.pdf",
      { type: "application/pdf" },
    );

    await expect(
      expectParseError(multipartRequest([{ file: oversized }]), 400),
    ).resolves.toMatchObject({
      error:
        "Početna dokumentacija nije prihvaćena. Provjerite tip, naziv, broj i veličinu fajlova.",
    });
  });

  it("rejects a File under an unexpected field name", async () => {
    await expect(
      expectParseError(
        multipartRequest([
          {
            field: "attachment",
            file: new File(["pdf"], "document.pdf"),
          },
        ]),
        400,
      ),
    ).resolves.toMatchObject({
      error: "Multipart zahtev sadrži neočekivan fajl.",
    });
  });

  it("rejects a File used as a textual field", async () => {
    await expect(
      expectParseError(
        multipartRequest([], {
          ...validInput,
          client: new File(["client"], "client.txt"),
        }),
        400,
      ),
    ).resolves.toMatchObject({
      error: "Tekstualno polje ne može sadržati fajl.",
    });
  });

  it("rejects initialDocuments supplied as a string", async () => {
    await expect(
      expectParseError(
        multipartRequest([], {
          ...validInput,
          initialDocuments: "document.pdf",
        }),
        400,
      ),
    ).resolves.toMatchObject({
      error: "Početna dokumentacija mora sadržati fajlove.",
    });
  });

  it("ignores additional ordinary text fields like existing JSON parsing", async () => {
    const result = await expectParsed(
      multipartRequest([], {
        ...validInput,
        ignoredField: "ignored-value",
      }),
    );

    expect(result.input).toEqual(validInput);
    expect(result.input).not.toHaveProperty("ignoredField");
  });

  it("trims one known textual field normally", async () => {
    const result = await expectParsed(
      multipartRequest([], {
        ...validInput,
        client: "  TEST_CLIENT  ",
      }),
    );

    expect(result.input?.client).toBe("TEST_CLIENT");
  });

  it("keeps multipart defaults identical to JSON defaults", async () => {
    const result = await expectParsed(
      multipartRequest([], {
        client: "TEST_CLIENT",
        matterName: "Test matter",
        openingDate: "2026-07-27",
      }),
    );

    expect(result.input).toEqual({
      client: "TEST_CLIENT",
      matterName: "Test matter",
      openingDate: "2026-07-27",
      legalArea: "Opšte",
      status: "Aktivan",
      priority: "Srednji",
      description: "",
      nextStep: "",
      expectedOutput: "",
      deadline: "",
      waitingFrom: "Niko / nije primenljivo",
      waitingDetail: "",
      folderNameOverride: "",
    });
  });
});

describe("parseMatterRequest Content-Type routing", () => {
  it("rejects a missing Content-Type", async () => {
    const request = new Request("http://localhost/api/matters", {
      method: "POST",
    });

    await expect(expectParseError(request, 415)).resolves.toMatchObject({
      error: "Nepodržan tip zahtjeva.",
    });
  });

  it.each([
    "text/json",
    "application/problem+json",
    "application/x-www-form-urlencoded",
    "text/plain",
  ])("rejects unsupported Content-Type %s without echoing it", async (contentType) => {
    const request = new Request("http://localhost/api/matters", {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: "private-content",
    });
    const result = await expectParseError(request, 415);

    expect(result.error).toBe("Nepodržan tip zahtjeva.");
    expect(result.error).not.toContain(contentType);
    expect(result.error).not.toContain("private-content");
  });
});
