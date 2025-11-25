"use client";
import { useState, useRef, useEffect } from "react";
import { BulkImportSchema, ValidationError } from "@/lib/bulk-import/schemas";
import {
  generateTemplate,
  parseFile,
  validateData,
  generateErrorReport,
  exportData,
  formatFileSize,
  validateFileType,
  validateFileSize,
} from "@/lib/bulk-import/utils";
import { toast } from "react-toastify";

interface BulkImportExportProps {
  schema: BulkImportSchema;
  moduleName: string;
  onImport: (data: any[]) => Promise<{ success: number; failed: number; errors: ValidationError[] }>;
  onExport?: (filters?: any) => Promise<any[]>;
  isOpen: boolean;
  onClose: () => void;
  exportFilters?: any;
}

const BulkImportExport = ({
  schema,
  moduleName,
  onImport,
  onExport,
  isOpen,
  onClose,
  exportFilters,
}: BulkImportExportProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"import" | "export">("import");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: ValidationError[];
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let modalInstance: any = null;
    let timeoutId: NodeJS.Timeout;

    const initModal = () => {
      if (!modalRef.current) return;

      if (typeof window === "undefined" || !(window as any).bootstrap) {
        return;
      }

      try {
        modalInstance = new (window as any).bootstrap.Modal(modalRef.current);
        modalInstance.show();

        const handleHidden = () => {
          handleClose();
        };

        modalRef.current.addEventListener("hidden.bs.modal", handleHidden);

        return () => {
          if (modalRef.current) {
            modalRef.current.removeEventListener("hidden.bs.modal", handleHidden);
          }
          if (modalInstance) {
            try {
              modalInstance.dispose();
            } catch (e) {
              console.warn("Error disposing modal:", e);
            }
          }
        };
      } catch (error) {
        console.error("Error initializing modal:", error);
      }
    };

    timeoutId = setTimeout(() => {
      const cleanup = initModal();
      if (cleanup) {
        return cleanup;
      }
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      if (modalRef.current) {
        const modal = (window as any).bootstrap?.Modal?.getInstance(modalRef.current);
        if (modal) {
          try {
            modal.dispose();
          } catch (e) {
            console.warn("Error disposing modal on cleanup:", e);
          }
        }
      }
    };
  }, [isOpen]);

  const handleClose = () => {
    setSelectedFile(null);
    setParsedData([]);
    setValidationErrors([]);
    setImportResult(null);
    setActiveTab("import");
    onClose();
  };

  const closeModal = () => {
    if (modalRef.current) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalRef.current);
      if (modal) {
        modal.hide();
      }
    }
  };

  const handleDownloadTemplate = () => {
    try {
      const fileName = `${moduleName.toLowerCase().replace(/\s+/g, "_")}_template`;
      generateTemplate(schema, fileName);
      toast.success("Template downloaded successfully");
    } catch (error) {
      console.error("Error downloading template:", error);
      toast.error("Failed to download template");
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateFileType(file)) {
      toast.error("Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV file.");
      return;
    }

    if (!validateFileSize(file, 5)) {
      toast.error("File size exceeds 5MB limit.");
      return;
    }

    setSelectedFile(file);
    setParsedData([]);
    setValidationErrors([]);
    setImportResult(null);
  };

  const handleValidateFile = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    setIsValidating(true);
    try {
      const parsed = await parseFile(selectedFile, schema);
      setParsedData(parsed.data);

      const errors = validateData(parsed.data, schema);
      setValidationErrors(errors);

      if (errors.length === 0) {
        toast.success(`File validated successfully! ${parsed.data.length} rows ready for import.`);
      } else {
        toast.warning(`Validation found ${errors.length} error(s). Please review and fix them.`);
      }
    } catch (error: any) {
      console.error("Error validating file:", error);
      toast.error(error.message || "Failed to validate file");
      setParsedData([]);
      setValidationErrors([]);
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (validationErrors.length > 0) {
      toast.error("Please fix validation errors before importing");
      return;
    }

    if (parsedData.length === 0) {
      toast.error("No data to import");
      return;
    }

    setIsImporting(true);
    try {
      const result = await onImport(parsedData);
      setImportResult(result);

      if (result.failed === 0) {
        toast.success(`Successfully imported ${result.success} records!`);
        setTimeout(() => {
          closeModal();
        }, 2000);
      } else {
        toast.warning(`Imported ${result.success} records, ${result.failed} failed. Check the error report.`);
      }
    } catch (error: any) {
      console.error("Error importing data:", error);
      toast.error(error.message || "Failed to import data");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadErrors = () => {
    try {
      const errorsToExport = importResult?.errors || validationErrors;
      if (errorsToExport.length === 0) {
        toast.info("No errors to download");
        return;
      }
      const fileName = `${moduleName.toLowerCase().replace(/\s+/g, "_")}_errors`;
      generateErrorReport(errorsToExport, fileName);
      toast.success("Error report downloaded successfully");
    } catch (error) {
      console.error("Error downloading error report:", error);
      toast.error("Failed to download error report");
    }
  };

  const handleExport = async () => {
    if (!onExport) {
      toast.error("Export functionality not available");
      return;
    }

    setIsExporting(true);
    try {
      const data = await onExport(exportFilters);
      
      if (data.length === 0) {
        toast.info("No data to export");
        return;
      }

      const fileName = `${moduleName.toLowerCase().replace(/\s+/g, "_")}_export`;
      exportData(data, schema, fileName);
      toast.success(`Successfully exported ${data.length} records!`);
    } catch (error: any) {
      console.error("Error exporting data:", error);
      toast.error(error.message || "Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setParsedData([]);
    setValidationErrors([]);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade" id="bulk_import_export_modal" ref={modalRef} data-bs-backdrop="static">
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="ti ti-file-import me-2" />
              Bulk Import/Export - {moduleName}
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            />
          </div>

          <div className="modal-body">
            <ul className="nav nav-tabs mb-4" role="tablist">
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${activeTab === "import" ? "active" : ""}`}
                  onClick={() => setActiveTab("import")}
                  type="button"
                  role="tab"
                >
                  <i className="ti ti-upload me-2" />
                  Import
                </button>
              </li>
              {onExport && (
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === "export" ? "active" : ""}`}
                    onClick={() => setActiveTab("export")}
                    type="button"
                    role="tab"
                  >
                    <i className="ti ti-download me-2" />
                    Export
                  </button>
                </li>
              )}
            </ul>

            <div className="tab-content">
              {activeTab === "import" && (
                <div className="tab-pane fade show active">
                  <div className="alert alert-info d-flex align-items-center mb-4">
                    <i className="ti ti-info-circle me-2 fs-4" />
                    <div>
                      <strong>Instructions:</strong>
                      <ol className="mb-0 mt-2 ps-3">
                        <li>Download the template file</li>
                        <li>Fill in your data following the format and validation rules</li>
                        <li>Upload the completed file</li>
                        <li>Review any validation errors and fix them</li>
                        <li>Click Import to add the data</li>
                      </ol>
                    </div>
                  </div>

                  <div className="mb-4">
                    <button
                      onClick={handleDownloadTemplate}
                      className="btn btn-outline-primary"
                      type="button"
                    >
                      <i className="ti ti-download me-2" />
                      Download Template
                    </button>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">Upload File</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="form-control"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileSelect}
                    />
                    {selectedFile && (
                      <div className="mt-2 d-flex align-items-center justify-content-between p-3 bg-light rounded">
                        <div className="d-flex align-items-center">
                          <i className="ti ti-file-spreadsheet fs-3 text-success me-2" />
                          <div>
                            <div className="fw-semibold">{selectedFile.name}</div>
                            <small className="text-muted">{formatFileSize(selectedFile.size)}</small>
                          </div>
                        </div>
                        <button
                          onClick={handleRemoveFile}
                          className="btn btn-sm btn-outline-danger"
                          type="button"
                        >
                          <i className="ti ti-x" />
                        </button>
                      </div>
                    )}
                  </div>

                  {selectedFile && parsedData.length === 0 && (
                    <div className="mb-4">
                      <button
                        onClick={handleValidateFile}
                        className="btn btn-primary"
                        disabled={isValidating}
                        type="button"
                      >
                        {isValidating ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Validating...
                          </>
                        ) : (
                          <>
                            <i className="ti ti-check me-2" />
                            Validate File
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {parsedData.length > 0 && (
                    <div className="mb-4">
                      <div className="alert alert-success d-flex align-items-center">
                        <i className="ti ti-circle-check me-2 fs-4" />
                        <span>
                          File parsed successfully! {parsedData.length} rows ready for import.
                        </span>
                      </div>
                    </div>
                  )}

                  {validationErrors.length > 0 && (
                    <div className="mb-4">
                      <div className="alert alert-warning">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <strong>
                            <i className="ti ti-alert-triangle me-2" />
                            Validation Errors ({validationErrors.length})
                          </strong>
                          <button
                            onClick={handleDownloadErrors}
                            className="btn btn-sm btn-outline-warning"
                            type="button"
                          >
                            <i className="ti ti-download me-1" />
                            Download Error Report
                          </button>
                        </div>
                        <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                          <table className="table table-sm table-bordered mb-0">
                            <thead>
                              <tr>
                                <th style={{ width: "80px" }}>Row</th>
                                <th style={{ width: "150px" }}>Field</th>
                                <th>Error</th>
                                <th style={{ width: "150px" }}>Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {validationErrors.slice(0, 10).map((error, index) => (
                                <tr key={index}>
                                  <td>{error.rowNumber}</td>
                                  <td>{error.field}</td>
                                  <td>{error.message}</td>
                                  <td className="text-truncate" style={{ maxWidth: "150px" }}>
                                    {error.value !== undefined ? String(error.value) : "N/A"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {validationErrors.length > 10 && (
                            <div className="text-center mt-2 text-muted">
                              <small>
                                Showing 10 of {validationErrors.length} errors. Download full report for all errors.
                              </small>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {importResult && (
                    <div className="mb-4">
                      <div className={`alert ${importResult.failed === 0 ? "alert-success" : "alert-warning"}`}>
                        <strong>Import Results:</strong>
                        <ul className="mb-0 mt-2">
                          <li>Successfully imported: {importResult.success} records</li>
                          {importResult.failed > 0 && (
                            <li>Failed: {importResult.failed} records</li>
                          )}
                        </ul>
                        {importResult.errors.length > 0 && (
                          <button
                            onClick={handleDownloadErrors}
                            className="btn btn-sm btn-outline-warning mt-2"
                            type="button"
                          >
                            <i className="ti ti-download me-1" />
                            Download Failed Records Report
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "export" && onExport && (
                <div className="tab-pane fade show active">
                  <div className="alert alert-info d-flex align-items-center mb-4">
                    <i className="ti ti-info-circle me-2 fs-4" />
                    <div>
                      <strong>Export Data:</strong>
                      <p className="mb-0 mt-2">
                        Export all {moduleName.toLowerCase()} data to an Excel file. The exported file will include
                        all current records with their complete information.
                      </p>
                    </div>
                  </div>

                  <div className="text-center py-4">
                    <i className="ti ti-file-export fs-1 text-primary mb-3 d-block" />
                    <p className="text-muted mb-4">
                      Click the button below to export all {moduleName.toLowerCase()} data.
                    </p>
                    <button
                      onClick={handleExport}
                      className="btn btn-primary btn-lg"
                      disabled={isExporting}
                      type="button"
                    >
                      {isExporting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <i className="ti ti-download me-2" />
                          Export to Excel
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-secondary"
              data-bs-dismiss="modal"
            >
              Close
            </button>
            {activeTab === "import" && parsedData.length > 0 && validationErrors.length === 0 && !importResult && (
              <button
                onClick={handleImport}
                className="btn btn-primary"
                disabled={isImporting}
                type="button"
              >
                {isImporting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Importing...
                  </>
                ) : (
                  <>
                    <i className="ti ti-upload me-2" />
                    Import Data ({parsedData.length} rows)
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkImportExport;
