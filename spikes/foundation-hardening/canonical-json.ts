export class CanonicalJsonError extends Error {}

function normalize(value: unknown, seen: Set<object>): unknown {
  if (value === null || typeof value === "boolean" || typeof value === "number") {
    if (typeof value === "number" && !Number.isFinite(value)) {
      throw new CanonicalJsonError("Non-finite numbers are not valid canonical JSON");
    }
    return value;
  }

  if (typeof value === "string") return value.normalize("NFC");
  if (typeof value !== "object") {
    throw new CanonicalJsonError(`Unsupported canonical JSON value: ${typeof value}`);
  }
  if (seen.has(value)) throw new CanonicalJsonError("Cyclic values are not valid canonical JSON");
  seen.add(value);

  try {
    if (Array.isArray(value)) return value.map((item) => normalize(item, seen));

    const record = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      if (record[key] === undefined) {
        throw new CanonicalJsonError(`Undefined field is not valid canonical JSON: ${key}`);
      }
      result[key.normalize("NFC")] = normalize(record[key], seen);
    }
    return result;
  } finally {
    seen.delete(value);
  }
}

export function canonicalJson(value: unknown): string {
  return `${JSON.stringify(normalize(value, new Set()))}\n`;
}

class JsonSyntaxScanner {
  private offset = 0;

  constructor(private readonly source: string) {}

  scan(): void {
    this.value();
    this.space();
    if (this.offset !== this.source.length) this.fail("Trailing JSON content");
  }

  private value(): void {
    this.space();
    const char = this.source[this.offset];
    if (char === "{") return this.object();
    if (char === "[") return this.array();
    if (char === '"') return void this.string();
    if (char === "t") return this.literal("true");
    if (char === "f") return this.literal("false");
    if (char === "n") return this.literal("null");
    this.number();
  }

  private object(): void {
    this.offset++;
    const keys = new Set<string>();
    this.space();
    if (this.take("}")) return;
    while (true) {
      this.space();
      if (this.source[this.offset] !== '"') this.fail("Expected object key");
      const key = this.string();
      if (keys.has(key)) throw new CanonicalJsonError(`Duplicate JSON object key: ${key}`);
      keys.add(key);
      this.space();
      if (!this.take(":")) this.fail("Expected colon");
      this.value();
      this.space();
      if (this.take("}")) return;
      if (!this.take(",")) this.fail("Expected comma");
    }
  }

  private array(): void {
    this.offset++;
    this.space();
    if (this.take("]")) return;
    while (true) {
      this.value();
      this.space();
      if (this.take("]")) return;
      if (!this.take(",")) this.fail("Expected comma");
    }
  }

  private string(): string {
    const start = this.offset++;
    while (this.offset < this.source.length) {
      const char = this.source[this.offset++];
      if (char === '"') return JSON.parse(this.source.slice(start, this.offset)) as string;
      if (char === "\\") this.offset++;
      else if (char.charCodeAt(0) < 0x20) this.fail("Control character in string");
    }
    this.fail("Unterminated string");
  }

  private number(): void {
    const rest = this.source.slice(this.offset);
    const match = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(rest);
    if (!match) this.fail("Expected JSON value");
    this.offset += match[0].length;
  }

  private literal(value: string): void {
    if (!this.source.startsWith(value, this.offset)) this.fail(`Expected ${value}`);
    this.offset += value.length;
  }

  private space(): void {
    while (/\s/.test(this.source[this.offset] ?? "")) this.offset++;
  }

  private take(char: string): boolean {
    if (this.source[this.offset] !== char) return false;
    this.offset++;
    return true;
  }

  private fail(message: string): never {
    throw new CanonicalJsonError(`${message} at offset ${this.offset}`);
  }
}

export function parseJsonStrict(source: string): unknown {
  new JsonSyntaxScanner(source).scan();
  return JSON.parse(source) as unknown;
}
