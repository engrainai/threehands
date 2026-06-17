import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { WatchListing } from "@/types";

const DATA_PATH = path.join(process.cwd(), "data", "watches.json");

function assertAdmin(request: NextRequest) {
  const configuredSecret = process.env.ADMIN_PASSWORD;
  if (!configuredSecret) return true;
  return request.headers.get("x-admin-secret") === configuredSecret;
}

async function readLocalListings() {
  const raw = await fs.readFile(DATA_PATH, "utf8");
  return JSON.parse(raw) as WatchListing[];
}

async function readGithubListings() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH ?? "main";
  if (!token || !owner || !repo) return null;

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/data/watches.json?ref=${branch}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`GitHub read failed: ${response.status}`);
  }

  const payload = await response.json();
  const content = Buffer.from(payload.content, "base64").toString("utf8");
  return { listings: JSON.parse(content) as WatchListing[], sha: payload.sha as string };
}

async function writeGithubListings(listings: WatchListing[], sha: string) {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH ?? "main";
  if (!token || !owner || !repo) return false;

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/data/watches.json`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    },
    body: JSON.stringify({
      branch,
      message: "Update watch inventory",
      content: Buffer.from(JSON.stringify(listings, null, 2) + "\n", "utf8").toString("base64"),
      sha
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub write failed: ${response.status} ${text}`);
  }

  return true;
}

export async function GET(request: NextRequest) {
  if (!assertAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const github = await readGithubListings();
  return NextResponse.json({ listings: github?.listings ?? (await readLocalListings()) });
}

export async function PUT(request: NextRequest) {
  if (!assertAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const listings = body.listings as WatchListing[];
  if (!Array.isArray(listings)) {
    return NextResponse.json({ error: "Expected listings array" }, { status: 400 });
  }

  const cleaned = listings.map((watch) => ({
    ...watch,
    status: watch.quantity <= 0 ? "sold" : watch.status,
    updatedAt: new Date().toISOString()
  }));

  const github = await readGithubListings();
  if (github) {
    await writeGithubListings(cleaned, github.sha);
    return NextResponse.json({ listings: cleaned, storage: "github" });
  }

  await fs.writeFile(DATA_PATH, JSON.stringify(cleaned, null, 2) + "\n");
  return NextResponse.json({ listings: cleaned, storage: "local" });
}
