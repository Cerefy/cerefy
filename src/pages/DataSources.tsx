import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Card, DataTable, Badge } from "@/components/common/primitives";
import { UploadService } from "@/services/upload.service";
import { DynamicDashboard, DashboardConfig } from "@/components/dashboard/DynamicDashboard";
import {
  RefreshCw,
  Upload,
  Database,
  Globe,
  Package,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ImportWizard } from "@/components/data-sources/ImportWizard";

interface DataSource {
  id: string;
  name: string;
  original_filename: string;
  status: string;
  file_size: number;
  file_type: string;
  created_at: string;
  processing_progress?: number;
}

export function DataSourcesPage() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [generatedDashboard, setGeneratedDashboard] = useState<DashboardConfig | null>(null);
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentDatasetId, setCurrentDatasetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: sources = [], isLoading: sourcesLoading } = useQuery<DataSource[]>({
    queryKey: ["data_sources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("imported_datasets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Map to DataSource shape (file_size and file_type may not exist in DB yet)
      return (data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        original_filename: row.original_filename ?? "",
        status: row.status,
        file_size: (row as any).file_size ?? 0,
        file_type: (row as any).file_type ?? "",
        created_at: row.created_at,
        processing_progress: (row as any).processing_progress,
      })) as DataSource[];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploadProgress(10);
      const result = await UploadService.processUpload(file, file.name, {
        enableSchemaDetection: true,
      });
      setUploadProgress(80);
      return result;
    },
    onSuccess: (result) => {
      setUploadProgress(100);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success("File uploaded successfully");
        queryClient.invalidateQueries({ queryKey: ["data_sources"] });

        // If processing results exist, show them
        if (result.processing) {
          setProcessingResult(result.processing);
          setCurrentDatasetId(result.dataset.id);
        }
      }
      setUploading(false);
      setUploadProgress(0);
    },
    onError: (error: Error) => {
      setError(error.message);
      toast.error(error.message);
      setUploading(false);
      setUploadProgress(0);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file before upload
    const validation = UploadService.validateFile(file);
    if (!validation.valid) {
      const errMsg = validation.error ?? "Invalid file";
      setError(errMsg);
      toast.error(errMsg);
      return;
    }

    setUploading(true);
    setError(null);
    setGeneratedDashboard(null);
    setProcessingResult(null);
    setSelectedFile(file);

    uploadMutation.mutate(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (datasetId: string) => {
    try {
      await UploadService.deleteDataset(datasetId);
      toast.success("Dataset deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["data_sources"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete dataset");
    }
  };

  const convertProcessingToDashboard = (processing: any): DashboardConfig => {
    // Convert cognitive data pipeline results to dashboard config
    const rowCount = processing.sheets?.[0]?.tables?.[0]?.row_count || 0;
    const colCount = processing.sheets?.[0]?.tables?.[0]?.columns?.length || 0;
    return {
      widgets: [
        {
          type: "kpi" as const,
          title: "Total Rows",
          value: String(rowCount),
        },
        {
          type: "kpi" as const,
          title: "Columns Detected",
          value: String(colCount),
        },
        {
          type: "insight" as const,
          title: "Schema Analysis",
          text: `Detected ${colCount} columns and ${rowCount} rows in the uploaded dataset.`,
        },
      ],
    };
  };

  return (
    <AppShell title="Data Sources" subtitle="Connected inputs · pipelines">
      <input
        type="file"
        accept=".csv, .xlsx, .xls, .json, .txt"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Upload Error</p>
            <p className="text-sm opacity-80">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {uploading && (
        <div className="mb-6 p-4 border border-eye-border bg-surface rounded">
          <div className="flex items-center gap-3 mb-3">
            <RefreshCw className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-eye-white">
              {uploadProgress < 80 ? "Uploading file..." : "Processing and analyzing data..."}
            </span>
            <span className="text-xs font-mono text-muted-foreground ml-auto">
              {uploadProgress}%
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary-brand h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {processingResult && selectedFile && currentDatasetId ? (
        <div className="mb-8">
          <ImportWizard
            file={selectedFile}
            datasetId={currentDatasetId}
            initialProcessingResult={processingResult}
            onClose={() => {
              setProcessingResult(null);
              setSelectedFile(null);
              setCurrentDatasetId(null);
            }}
          />
        </div>
      ) : generatedDashboard ? (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h2 className="text-lg font-display text-white">Analysis Complete</h2>
            </div>
            <button
              onClick={() => setGeneratedDashboard(null)}
              className="text-xs text-muted-foreground hover:text-white"
            >
              Clear
            </button>
          </div>
          <DynamicDashboard config={generatedDashboard} />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bento-card rounded-lg p-5 flex flex-col gap-3 items-start hover:bg-secondary/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="h-[22px] w-[22px] text-white" />
            <span className="text-sm text-white font-medium">Upload File</span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase">
              CSV / Excel / JSON
            </span>
          </button>
          {[
            { icon: "database", label: "Connect Database" },
            { icon: "api", label: "Connect API" },
          ].map((a) => {
            const iconMap: Record<string, typeof Database> = { database: Database, api: Globe };
            const Icon = iconMap[a.icon] ?? Package;
            return (
              <button
                key={a.label}
                disabled={uploading}
                className="bento-card rounded-lg p-5 flex flex-col gap-3 items-start hover:bg-secondary/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon className="h-[22px] w-[22px] text-white" />
                <span className="text-sm text-white font-medium">{a.label}</span>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">
                  Configure
                </span>
              </button>
            );
          })}
        </div>
      )}

      <Card
        title="Connected Sources"
        icon="hub"
        action={
          <div className="flex gap-2">
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["data_sources"] })}
              className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-white"
            >
              Refresh
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-white text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded disabled:opacity-50"
            >
              Upload
            </button>
          </div>
        }
      >
        {sourcesLoading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading sources...</span>
          </div>
        ) : sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <Database className="h-8 w-8" />
            <span className="text-sm">No data sources connected</span>
            <span className="text-xs">Upload a file or connect a database to get started</span>
          </div>
        ) : (
          <DataTable<DataSource>
            columns={[
              { key: "name", label: "Dataset Name" },
              { key: "original_filename", label: "File Name" },
              {
                key: "status",
                label: "Status",
                render: (r) => (
                  <Badge
                    tone={
                      r.status === "processed"
                        ? "success"
                        : r.status === "processing"
                          ? "warn"
                          : "danger"
                    }
                  >
                    {r.status}
                  </Badge>
                ),
              },
              {
                key: "file_size",
                label: "Size",
                align: "right",
                render: (r) => (
                  <span className="font-mono text-muted-foreground">
                    {r.file_size ? (r.file_size / 1024).toFixed(1) + " KB" : "—"}
                  </span>
                ),
              },
              {
                key: "created_at",
                label: "Uploaded",
                align: "right",
                render: (r) => (
                  <span className="font-mono text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                ),
              },
              {
                key: "actions",
                label: "",
                align: "right",
                render: (r) => (
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ),
              },
            ]}
            rows={sources}
          />
        )}
      </Card>
    </AppShell>
  );
}
