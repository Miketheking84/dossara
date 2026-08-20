import { readFile } from "node:fs/promises";
import { createServer } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { connectTcp, lanIpv4Addresses } from "./verify-loopback-binding.mjs";

const servers: Array<ReturnType<typeof createServer>> = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => {
    server.close(() => resolve());
  })));
});

describe("PRE-FIELD-1A loopback verifier", () => {
  it("locks both Next.js lifecycle scripts to explicit IPv4 loopback", async () => {
    const packageJson = JSON.parse(await readFile("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };
    expect(packageJson.scripts.dev).toContain("-H 127.0.0.1");
    expect(packageJson.scripts.start).toContain("-H 127.0.0.1");
  });

  it("detects a real successful TCP connection and a refused connection", async () => {
    const server = createServer();
    servers.push(server);
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Missing TCP address");
    expect(await connectTcp("127.0.0.1", address.port)).toMatchObject({ connected: true });
    await new Promise<void>((resolve) => server.close(() => resolve()));
    servers.splice(servers.indexOf(server), 1);
    expect(await connectTcp("127.0.0.1", address.port)).toMatchObject({ connected: false });
  });

  it("returns only non-internal IPv4 addresses for the negative runtime probe", () => {
    expect(lanIpv4Addresses({
      Loopback: [{
        address: "127.0.0.1", family: "IPv4", internal: true,
        netmask: "255.0.0.0", mac: "00:00:00:00:00:00", cidr: "127.0.0.1/8",
      }],
      Ethernet: [
        {
          address: "192.168.1.25", family: "IPv4", internal: false,
          netmask: "255.255.255.0", mac: "00:00:00:00:00:01", cidr: "192.168.1.25/24",
        },
        {
          address: "fe80::1", family: "IPv6", internal: false, scopeid: 1,
          netmask: "ffff:ffff:ffff:ffff::", mac: "00:00:00:00:00:01", cidr: "fe80::1/64",
        },
      ],
    })).toEqual(["192.168.1.25"]);
  });
});
