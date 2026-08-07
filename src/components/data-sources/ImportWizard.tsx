import { useState } from "react";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { UploadService } from "@/services/upload.service";
import { useQueryClient } from "@tanstack/react-query";

interface ImportWizardProps {
  onClose: () => void;
  file: File;
  datasetId: string;
  initialProcessingResult: any;
}

export function ImportWizard({
  onClose,
  file,
  datasetId,
  initialProcessingResult,
}: ImportWizardProps) {
  const [step, setStep] = useState<"mapping" | "importing" | "report">("mapping");
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [importReport, setImportReport] = useState<any>(null);
  const queryClient = useQueryClient();

  // Initialize mappings from AI detection
  useState(() => {
    const initialMap: Record<string, string> = {};
    const columns = initialProcessingResult.sheets?.[0]?.tables?.[0]?.columns || [];
    columns.forEach((col: any) => {
      initialMap[col.name] = col.entity_type || col.semantic_type || "";
    });
    setMappings(initialMap);
  });

  const handleConfirmMapping = async () => {
    setStep("importing");
    setImporting(true);

    try {
      const report = await UploadService.importData(datasetId, file, mappings);
      setImportReport(report);
      toast.success(`Successfully imported ${report.imported_rows} rows`);
      queryClient.invalidateQueries({ queryKey: ["data_sources"] });
      setStep("report");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed");
      setStep("mapping");
    } finally {
      setImporting(false);
    }
  };

  if (step === "importing") {
    return (
      <div className="p-8 bg-eye-surface border border-eye-border rounded-xl flex flex-col items-center justify-center text-center">
        <RefreshCw className="h-10 w-10 animate-spin text-primary-brand mb-4" />
        <h2 className="text-xl font-display text-white mb-2">Importing Data</h2>
        <p className="text-sm text-muted-foreground">
          Applying mappings, validating rows, and saving to database...
        </p>
      </div>
    );
  }

  if (step === "report" && importReport) {
    return (
      <div className="p-8 bg-eye-surface border border-eye-border rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <h2 className="text-xl font-display text-white">Import Complete</h2>
              <p className="text-sm text-muted-foreground">
                Processed in {importReport.processing_time_ms}ms
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-eye-bg border border-eye-border rounded-lg">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono mb-1">
              Total Rows
            </p>
            <p className="text-2xl font-bold text-white">{importReport.total_rows}</p>
          </div>
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-xs text-green-400 uppercase tracking-widest font-mono mb-1">
              Imported
            </p>
            <p className="text-2xl font-bold text-green-400">{importReport.imported_rows}</p>
          </div>
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-xs text-red-400 uppercase tracking-widest font-mono mb-1">
              Failed/Skipped
            </p>
            <p className="text-2xl font-bold text-red-400">
              {importReport.failed_rows + importReport.skipped_rows}
            </p>
          </div>
        </div>

        {importReport.error_summary && Object.keys(importReport.error_summary).length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-white mb-3">Validation Issues</h3>
            <ul className="space-y-2">
              {Object.entries(importReport.error_summary).map(([errorType, count]) => (
                <li
                  key={errorType}
                  className="flex items-center justify-between text-sm p-2 bg-red-500/5 border border-red-500/10 rounded"
                >
                  <span className="text-red-400 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {errorType.replace("_", " ").toUpperCase()}
                  </span>
                  <span className="text-muted-foreground">{count as number} rows affected</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="luminous-btn-primary px-6 py-2 text-[10px] font-bold uppercase tracking-widest"
          >
            Close Wizard
          </button>
        </div>
      </div>
    );
  }

  const columns = initialProcessingResult.sheets?.[0]?.tables?.[0]?.columns || [];

  return (
    <div className="p-6 bg-eye-surface border border-eye-border rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-display text-white">Schema Discovery & Mapping</h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-4 p-3 bg-secondary/20 rounded flex items-center gap-3 border border-secondary/50">
        <FileText className="h-5 w-5 text-primary-brand" />
        <div>
          <p className="text-sm text-white font-medium">AI Schema Detection Complete</p>
          <p className="text-xs text-muted-foreground">
            Review the detected columns and override mappings if necessary before importing.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto border border-eye-border rounded-lg mb-6">
        <table className="w-full text-left text-sm">
          <thead className="bg-eye-bg">
            <tr className="border-b border-eye-border text-muted-foreground">
              <th className="p-3 font-medium">Source Column</th>
              <th className="p-3 font-medium">AI Detected Type</th>
              <th className="p-3 font-medium">Confidence</th>
              <th className="p-3 font-medium">Map to Destination</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((col: any, idx: number) => (
              <tr key={idx} className="border-b border-eye-border/50 bg-eye-surface">
                <td className="p-3 font-mono text-white">{col.name}</td>
                <td className="p-3 text-muted-foreground capitalize">
                  {col.entity_type || col.semantic_type || "Unknown"}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-eye-bg rounded-full overflow-hidden">
                      <div
                        className={`h-full ${col.confidence > 0.8 ? "bg-green-500" : col.confidence > 0.5 ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: `${(col.confidence || 0) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                      {Math.round((col.confidence || 0) * 100)}%
                    </span>
                  </div>
                </td>
                <td className="p-3">
                  <select
                    className="bg-eye-bg border border-eye-border rounded px-3 py-1.5 text-white text-xs outline-none focus:border-primary-brand w-full"
                    value={mappings[col.name] || ""}
                    onChange={(e) => setMappings({ ...mappings, [col.name]: e.target.value })}
                  >
                    <option value="">-- Ignore Column --</option>
                    <option value="first_name">First Name</option>
                    <option value="last_name">Last Name</option>
                    <option value="email">Email Address</option>
                    <option value="phone">Phone Number</option>
                    <option value="company">Company</option>
                    <option value="revenue">Revenue</option>
                    <option value="date">Date</option>
                    <option value="product">Product</option>
                    <option value="location">Location</option>
                    <option value="category">Category</option>
                    <option value="status">Status</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white transition"
        >
          Cancel
        </button>
        <button
          className="luminous-btn-primary px-6 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
          onClick={handleConfirmMapping}
        >
          Confirm & Import Data <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
