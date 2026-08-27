/**
 * Storage abstraction for object storage (Supabase Storage).
 * Provides upload, download (signed URLs), list, and delete operations.
 * All operations are organization-scoped and audited at the API layer.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Attachment, AttachmentStorage } from "@canica/types";

export interface StorageConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  bucket: string;
}

export interface UploadResult {
  path: string;
  fullPath: string;
  size: number;
  mimetype: string;
}

export interface SignedUrlResult {
  signedUrl: string;
  expiresAt: Date;
}

export interface ListResult {
  items: Array<{
    name: string;
    id: string;
    updatedAt: string;
    createdAt: string;
    size: number;
    mimetype: string;
  }>;
}

export class StorageError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = "StorageError";
  }
}

let _client: SupabaseClient | null = null;

function getClient(config: StorageConfig): SupabaseClient {
  if (!_client) {
    _client = createClient(config.supabaseUrl, config.supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _client;
}

function getBucket(config: StorageConfig) {
  return getClient(config).storage.from(config.bucket);
}

/**
 * Generate a unique, organization-scoped path for an attachment.
 * Format: `{orgId}/attachments/{patientId}/{timestamp}-{sanitizedOriginalName}.{ext}`
 */
export function generateAttachmentPath(
  orgId: string,
  patientId: string,
  originalFilename: string,
): string {
  const parts = originalFilename.split(".");
  const ext = parts.length > 1 ? (parts.pop()?.toLowerCase() ?? "bin") : "bin";
  const baseName = parts.join(".").replace(/[^a-zA-Z0-9._-]/g, "_") || "file";
  const timestamp = Date.now();
  const uuid = crypto.randomUUID().slice(0, 8);
  return `${orgId}/attachments/${patientId}/${timestamp}-${baseName}-${uuid}.${ext}`;
}

/**
 * Upload a file to Supabase Storage.
 * Returns metadata including the storage path.
 */
export async function uploadAttachment(
  config: StorageConfig,
  orgId: string,
  patientId: string,
  file: Buffer | Blob | File,
  filename: string,
  contentType: string,
): Promise<UploadResult> {
  const bucket = getBucket(config);
  const path = generateAttachmentPath(orgId, patientId, filename);

  const { data, error } = await bucket.upload(path, file, {
    contentType,
    upsert: false,
  });

  if (error) {
    throw new StorageError(
      `Failed to upload attachment: ${error.message}`,
      "UPLOAD_FAILED",
      500,
    );
  }

  return {
    path: data.path,
    fullPath: data.fullPath,
    size: file instanceof Buffer ? file.length : "size" in file ? file.size : 0,
    mimetype: contentType,
  };
}

/**
 * Generate a signed URL for downloading an attachment.
 * URL expires in the specified seconds (default 1 hour).
 */
export async function getSignedUrl(
  config: StorageConfig,
  path: string,
  expiresIn: number = 3600,
): Promise<SignedUrlResult> {
  const bucket = getBucket(config);

  const { data, error } = await bucket.createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    throw new StorageError(
      `Failed to create signed URL: ${error?.message ?? "unknown"}`,
      "SIGNED_URL_FAILED",
      500,
    );
  }

  return {
    signedUrl: data.signedUrl,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
  }
}

/**
 * Delete an attachment from storage.
 */
export async function deleteAttachment(
  config: StorageConfig,
  path: string,
): Promise<void> {
  const bucket = getBucket(config);

  const { error } = await bucket.remove([path]);

  if (error) {
    throw new StorageError(
      `Failed to delete attachment: ${error.message}`,
      "DELETE_FAILED",
      500,
    );
  }
}

/**
 * List attachments in a patient's folder.
 */
export async function listAttachments(
  config: StorageConfig,
  orgId: string,
  patientId: string,
): Promise<ListResult> {
  const bucket = getBucket(config);
  const prefix = `${orgId}/attachments/${patientId}/`;

  const { data, error } = await bucket.list(prefix, {
    sortBy: { column: "created_at", order: "desc" },
  });

  if (error) {
    throw new StorageError(
      `Failed to list attachments: ${error.message}`,
      "LIST_FAILED",
      500,
    );
  }

  return {
    items: (data ?? []).map((item) => ({
      name: item.name,
      id: item.id ?? "",
      updatedAt: item.updated_at ?? item.created_at ?? new Date().toISOString(),
      createdAt: item.created_at ?? new Date().toISOString(),
      size: item.metadata?.size ?? 0,
      mimetype: item.metadata?.mimetype ?? "application/octet-stream",
    })),
  };
}

/**
 * Get attachment metadata without downloading.
 */
export async function getAttachmentMetadata(
  config: StorageConfig,
  path: string,
): Promise<{ size: number; mimetype: string; lastModified: Date } | null> {
  const bucket = getBucket(config);

  const { data, error } = await bucket.list(path.split("/").slice(0, -1).join("/"), {
    search: path.split("/").pop() ?? "",
  });

  if (error || !data?.length) {
    return null;
  }

  const item = data[0];
  return {
    size: item.metadata?.size ?? 0,
    mimetype: item.metadata?.mimetype ?? "application/octet-stream",
    lastModified: item.updated_at ? new Date(item.updated_at) : new Date(),
  };
}

/**
 * Build a full public URL for an attachment (only if bucket is public).
 * For private buckets, use getSignedUrl instead.
 */
export function getPublicUrl(config: StorageConfig, path: string): string {
  const bucket = getBucket(config);
  const { data } = bucket.getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Health check for storage connectivity.
 */
export async function checkStorageHealth(config: StorageConfig): Promise<boolean> {
  try {
    const bucket = getBucket(config);
    const { error } = await bucket.list("", { limit: 1 });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Create the storage config from environment variables.
 * Expected env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STORAGE_BUCKET (default: "attachments")
 */
export function createStorageConfigFromEnv(): StorageConfig {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.STORAGE_BUCKET ?? "attachments";

  if (!url || !key) {
    throw new StorageError(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables",
      "CONFIG_MISSING",
      500,
    );
  }

  return { supabaseUrl: url, supabaseServiceKey: key, bucket };
}