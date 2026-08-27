import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateAttachmentPath,
  StorageError,
  createStorageConfigFromEnv,
} from "./index";

describe("Storage utilities", () => {
  describe("generateAttachmentPath", () => {
    it("generates org-scoped path with patient ID", () => {
      const path = generateAttachmentPath("org-123", "patient-456", "lab.pdf");
      expect(path).toMatch(/^org-123\/attachments\/patient-456\/\d+-lab-[a-f0-9]{8}\.pdf$/);
    });

    it("handles filenames without extension", () => {
      const path = generateAttachmentPath("org-123", "patient-456", "document");
      expect(path).toMatch(/^org-123\/attachments\/patient-456\/\d+-document-[a-f0-9]{8}\.bin$/);
    });

    it("handles multiple dots in filename", () => {
      const path = generateAttachmentPath("org-123", "patient-456", "lab.report.v2.pdf");
      expect(path).toMatch(/^org-123\/attachments\/patient-456\/\d+-lab\.report\.v2-[a-f0-9]{8}\.pdf$/);
    });

    it("sanitizes special characters in filename", () => {
      const path = generateAttachmentPath("org-123", "patient-456", "file@#$%.pdf");
      expect(path).toMatch(/^org-123\/attachments\/patient-456\/\d+-file____-[a-f0-9]{8}\.pdf$/);
    });

    it("produces unique paths for same input", () => {
      const path1 = generateAttachmentPath("org-1", "patient-1", "file.pdf");
      const path2 = generateAttachmentPath("org-1", "patient-1", "file.pdf");
      expect(path1).not.toBe(path2);
    });
  });

  describe("StorageError", () => {
    it("creates error with code and statusCode", () => {
      const error = new StorageError("Test error", "TEST_CODE", 400);
      expect(error.message).toBe("Test error");
      expect(error.code).toBe("TEST_CODE");
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe("StorageError");
    });
  });

  describe("createStorageConfigFromEnv", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      vi.resetModules();
      process.env = { ...originalEnv };
    });

    it("throws when SUPABASE_URL is missing", () => {
      delete process.env.SUPABASE_URL;
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
      expect(() => createStorageConfigFromEnv()).toThrow(StorageError);
    });

    it("throws when SUPABASE_SERVICE_ROLE_KEY is missing", () => {
      process.env.SUPABASE_URL = "https://test.supabase.co";
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      expect(() => createStorageConfigFromEnv()).toThrow(StorageError);
    });

    it("uses default bucket when STORAGE_BUCKET not set", () => {
      process.env.SUPABASE_URL = "https://test.supabase.co";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
      delete process.env.STORAGE_BUCKET;

      const config = createStorageConfigFromEnv();
      expect(config.bucket).toBe("attachments");
    });

    it("uses custom bucket when STORAGE_BUCKET set", () => {
      process.env.SUPABASE_URL = "https://test.supabase.co";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
      process.env.STORAGE_BUCKET = "custom-bucket";

      const config = createStorageConfigFromEnv();
      expect(config.bucket).toBe("custom-bucket");
    });
  });
});