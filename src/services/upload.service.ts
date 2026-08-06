import { supabase } from "@/lib/supabase/client";

interface UploadResult {
  dataset?: Record<string, unknown>;
  processing?: Record<string, unknown>;
  error?: string;
}

interface ProcessingOptions {
  enableSchemaDetection?: boolean;
  enableQualityAnalysis?: boolean;
  company_id?: string;
}

export const UploadService = {
  async processUpload(
    file: File,
    datasetName: string,
    options: ProcessingOptions = {},
  ): Promise<UploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return { error: validation.error };
      }

      // Check authentication
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        return { error: "Must be logged in to upload files" };
      }

      const userId = session.user.id;
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const storagePath = `${userId}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("files")
        .upload(storagePath, file, { upsert: false });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        return { error: `Failed to upload file: ${uploadError.message}` };
      }

      // Create dataset record (file_size, file_type, storage_path will be added via migration)
      const insertPayload = {
        name: datasetName,
        original_filename: file.name,
        status: "uploaded",
        file_size: file.size,
        file_type: file.type,
        storage_path: storagePath,
      };
      const { data: dataset, error: datasetError } = await supabase
        .from("imported_datasets")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(insertPayload as any)
        .select()
        .single();

      if (datasetError) {
        console.error("Dataset creation error:", datasetError);
        // Clean up uploaded file if dataset creation fails
        await supabase.storage.from("files").remove([storagePath]);
        return { error: `Failed to create dataset record: ${datasetError.message}` };
      }

      // Process with cognitive data pipeline if enabled
      if (options.enableSchemaDetection) {
        try {
          const processing = await this.processWithCognitivePipeline(file, options);
          return { dataset, processing };
        } catch (processingError) {
          console.error("Processing error:", processingError);
          // Don't fail the entire upload if processing fails
          return {
            dataset,
            error: `File uploaded but processing failed: ${processingError instanceof Error ? processingError.message : "Unknown error"}`,
          };
        }
      }

      return { dataset };
    } catch (error) {
      console.error("Upload service error:", error);
      return {
        error: error instanceof Error ? error.message : "Failed to process upload",
      };
    }
  },

  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size (max 50MB)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return { valid: false, error: "File size exceeds 50MB limit" };
    }

    // Check file type
    const allowedTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/json",
      "text/plain",
    ];

    const allowedExtensions = [".csv", ".xlsx", ".xls", ".json", ".txt"];
    const fileExt = file.name.split(".").pop()?.toLowerCase();

    if (!allowedExtensions.includes(`.${fileExt}`)) {
      return { valid: false, error: "Invalid file type. Allowed: CSV, Excel, JSON, TXT" };
    }

    return { valid: true };
  },

  async processWithCognitivePipeline(
    file: File,
    options: ProcessingOptions,
  ): Promise<Record<string, unknown>> {
    const backendUrl = import.meta.env.VITE_PYTHON_BACKEND_URL || "/api/v1";

    const formData = new FormData();
    formData.append("file", file);
    if (options.company_id) {
      formData.append("company_id", options.company_id);
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await fetch(`${backendUrl}/cognitive-data/process`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Processing failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  },

  async importData(
    datasetId: string,
    file: File,
    mappings: Record<string, string>,
  ): Promise<Record<string, unknown>> {
    const backendUrl = import.meta.env.VITE_PYTHON_BACKEND_URL || "/api/v1";

    const formData = new FormData();
    formData.append("file", file);

    // Convert datasetId to uuid format? Assuming it's already a string UUID.

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await fetch(
      `${backendUrl}/cognitive-data/import?dataset_id=${datasetId}&mappings=${encodeURIComponent(JSON.stringify(mappings))}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Import failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  },

  async getUploadProgress(datasetId: string): Promise<{ status: string; progress: number }> {
    const { data, error } = await supabase
      .from("imported_datasets")
      .select("status, processing_progress")
      .eq("id", datasetId)
      .single();

    if (error) throw error;

    const record = data as unknown as Record<string, unknown> | null;
    return {
      status: (record?.status as string) ?? "unknown",
      progress: (record?.processing_progress as number) ?? 0,
    };
  },

  async deleteDataset(datasetId: string): Promise<void> {
    const { data: dataset, error: fetchError } = await supabase
      .from("imported_datasets")
      .select("storage_path")
      .eq("id", datasetId)
      .single();

    if (fetchError) throw fetchError;

    const storagePath = (dataset as unknown as Record<string, unknown> | null)?.storage_path;
    if (typeof storagePath === "string") {
      const { error: storageError } = await supabase.storage.from("files").remove([storagePath]);

      if (storageError) console.error("Storage deletion error:", storageError);
    }

    // Delete dataset record
    const { error: deleteError } = await supabase
      .from("imported_datasets")
      .delete()
      .eq("id", datasetId);

    if (deleteError) throw deleteError;
  },
};
