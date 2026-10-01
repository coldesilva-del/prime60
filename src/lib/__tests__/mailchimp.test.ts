import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??= "sb_publishable_test";

type Mailchimp = typeof import("../mailchimp");
let mc: Mailchimp;

function jsonResponse(status: number, body: unknown = {}) {
  // A 204 cannot carry a body.
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeAll(async () => {
  mc = await import("../mailchimp");
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.MAILCHIMP_API_KEY;
  delete process.env.MAILCHIMP_AUDIENCE_ID;
  delete process.env.MAILCHIMP_SERVER_PREFIX;
});

describe("memberHash", () => {
  it("is the md5 of the lowercased, trimmed email", () => {
    // Known MD5 of "colin@example.com".
    expect(mc.memberHash("  Colin@Example.com ")).toBe(mc.memberHash("colin@example.com"));
    expect(mc.memberHash("colin@example.com")).toMatch(/^[0-9a-f]{32}$/);
    expect(mc.memberHash("test@example.com")).toBe("55502f40dc8b7c769880b10874abc9d0");
  });
});

describe("mailchimpConfig", () => {
  it("returns null when the key or audience is missing", () => {
    expect(mc.mailchimpConfig()).toBeNull();
    process.env.MAILCHIMP_API_KEY = "abc-us21";
    expect(mc.mailchimpConfig()).toBeNull();
  });

  it("derives the server from the key suffix when no prefix is set", () => {
    process.env.MAILCHIMP_API_KEY = "abc123-us21";
    process.env.MAILCHIMP_AUDIENCE_ID = "list1";
    expect(mc.mailchimpConfig()).toEqual({ apiKey: "abc123-us21", server: "us21", audienceId: "list1" });
  });

  it("prefers an explicit server prefix", () => {
    process.env.MAILCHIMP_API_KEY = "abc123-us21";
    process.env.MAILCHIMP_AUDIENCE_ID = "list1";
    process.env.MAILCHIMP_SERVER_PREFIX = "us5";
    expect(mc.mailchimpConfig()?.server).toBe("us5");
  });
});

describe("upsertMember", () => {
  it("skips without throwing when not configured", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await mc.upsertMember({ email: "a@b.com", firstName: "A" });
    expect(result).toEqual({ ok: true, skipped: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("PUTs the member then POSTs the tag", async () => {
    process.env.MAILCHIMP_API_KEY = "secret-us21";
    process.env.MAILCHIMP_AUDIENCE_ID = "aud1";
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse(200)).mockResolvedValueOnce(jsonResponse(204));
    vi.stubGlobal("fetch", fetchMock);

    const result = await mc.upsertMember({ email: "Test@Example.com", firstName: "Colin" });
    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [putUrl, putInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(putUrl).toBe("https://us21.api.mailchimp.com/3.0/lists/aud1/members/55502f40dc8b7c769880b10874abc9d0");
    expect(putInit.method).toBe("PUT");
    const headers = putInit.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Basic ${Buffer.from("anystring:secret-us21").toString("base64")}`);
    expect(JSON.parse(String(putInit.body))).toEqual({
      email_address: "test@example.com",
      status_if_new: "subscribed",
      merge_fields: { FNAME: "Colin" },
    });

    const [tagUrl, tagInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(tagUrl).toBe("https://us21.api.mailchimp.com/3.0/lists/aud1/members/55502f40dc8b7c769880b10874abc9d0/tags");
    expect(tagInit.method).toBe("POST");
    expect(JSON.parse(String(tagInit.body))).toEqual({ tags: [{ name: "prime60-app", status: "active" }] });
  });

  it("reports an API failure without throwing", async () => {
    process.env.MAILCHIMP_API_KEY = "secret-us21";
    process.env.MAILCHIMP_AUDIENCE_ID = "aud1";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(jsonResponse(400, { detail: "Invalid email" })));

    const result = await mc.upsertMember({ email: "bad", firstName: null });
    expect(result).toEqual({ ok: false, status: 400, detail: "Invalid email" });
  });
});

describe("removeTag", () => {
  it("posts the tag as inactive", async () => {
    process.env.MAILCHIMP_API_KEY = "secret-us21";
    process.env.MAILCHIMP_AUDIENCE_ID = "aud1";
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse(204));
    vi.stubGlobal("fetch", fetchMock);

    const result = await mc.removeTag("test@example.com");
    expect(result).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/members\/55502f40dc8b7c769880b10874abc9d0\/tags$/);
    expect(JSON.parse(String(init.body))).toEqual({ tags: [{ name: "prime60-app", status: "inactive" }] });
  });

  it("treats an unknown member as success", async () => {
    process.env.MAILCHIMP_API_KEY = "secret-us21";
    process.env.MAILCHIMP_AUDIENCE_ID = "aud1";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(jsonResponse(404, { detail: "Not found" })));
    expect(await mc.removeTag("nobody@example.com")).toEqual({ ok: true });
  });
});
