import { NextResponse } from "next/server";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { APK_FOLDER, APP_VERSION } from "@/lib/app-version";

export const runtime = "nodejs";

function parseVersion(version) {
  return String(version || "")
    .trim()
    .split(".")
    .map((part) => Number(part))
    .filter((part) => Number.isFinite(part));
}

function compareVersions(a, b) {
  const aParts = parseVersion(a);
  const bParts = parseVersion(b);
  const maxLength = Math.max(aParts.length, bParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const aValue = aParts[index] ?? 0;
    const bValue = bParts[index] ?? 0;

    if (aValue > bValue) {
      return 1;
    }
    if (aValue < bValue) {
      return -1;
    }
  }

  return 0;
}

function parseApkFileName(fileName) {
  const match = fileName.match(/^(?<name>.+)-v(?<version>\d+(?:\.\d+)*)\.apk$/i);
  if (!match?.groups?.version) {
    return null;
  }

  return {
    fileName,
    appName: match.groups.name,
    version: match.groups.version
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const currentVersion = searchParams.get("current") || APP_VERSION;
  const apkDirectory = path.join(process.cwd(), "public", APK_FOLDER);

  let files = [];
  try {
    files = await readdir(apkDirectory);
  } catch {
    return NextResponse.json({
      available: false,
      currentVersion,
      latestVersion: null,
      downloadUrl: null
    });
  }

  const releases = files.map(parseApkFileName).filter(Boolean);
  if (!releases.length) {
    return NextResponse.json({
      available: false,
      currentVersion,
      latestVersion: null,
      downloadUrl: null
    });
  }

  const latest = releases.reduce((best, release) => {
    if (!best) {
      return release;
    }
    return compareVersions(release.version, best.version) > 0 ? release : best;
  }, null);

  const available = compareVersions(latest.version, currentVersion) > 0;
  const encodedFileName = latest.fileName
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return NextResponse.json({
    available,
    currentVersion,
    latestVersion: latest.version,
    fileName: latest.fileName,
    appName: latest.appName,
    downloadUrl: `/${APK_FOLDER}/${encodedFileName}`
  });
}
