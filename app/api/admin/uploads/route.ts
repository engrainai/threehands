import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function assertAdmin(request: NextRequest) {
  const configuredSecret = process.env.ADMIN_PASSWORD;
  if (!configuredSecret) return true;
  return request.headers.get("x-admin-secret") === configuredSecret;
}

function extensionFor(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }

  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

async function writeGithubUpload(filename: string, bytes: Buffer) {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH ?? "main";
  if (!token || !owner || !repo) return false;

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/public/uploads/${filename}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    },
    body: JSON.stringify({
      branch,
      message: `Upload ${filename}`,
      content: bytes.toString("base64")
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub upload failed: ${response.status} ${text}`);
  }

  return true;
}

export async function POST(request: NextRequest) {
  if (!assertAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("image");
  const slug = String(formData.get("slug") || "watch").replace(/[^a-z0-9-]/gi, "-").toLowerCase();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Expected image file" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Upload a JPG, PNG, or WebP image" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Image must be 8MB or smaller" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const filename = `${slug}-${crypto.randomUUID()}.${extensionFor(file)}`;
  const publicPath = `/uploads/${filename}`;

  const wroteGithub = await writeGithubUpload(filename, bytes);
  if (!wroteGithub) {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, filename), bytes);
  }

  return NextResponse.json({ path: publicPath, storage: wroteGithub ? "github" : "local" });
}
