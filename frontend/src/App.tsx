import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DocumentViewer } from './components/DocumentViewer';
import { ExtractionForm } from './components/ExtractionForm';
import { HITLQueueView } from './components/HITLQueueView';
import { DocumentsListView } from './components/DocumentsListView';
import { AuditTrailDrawer } from './components/AuditTrailDrawer';
import type { DocumentResponse, PageResponse, FieldResponse, AuditLogResponse } from './types';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'workspace' | 'hitl' | 'documents'>('workspace');
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentResponse | null>(null);
  const [selectedPage, setSelectedPage] = useState<PageResponse | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogResponse[]>([]);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadDocuments = async () => {
    try {
      const res = await fetch('/api/v1/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
        if (!selectedDoc && data.length > 0) {
          selectDocument(data[0]);
        }
      }
    } catch (e) {
      console.error('Failed to fetch documents:', e);
    }
  };

  const selectDocument = (doc: DocumentResponse) => {
    setSelectedDoc(doc);
    if (doc.pages && doc.pages.length > 0) {
      setSelectedPage(doc.pages[0]);
    } else {
      setSelectedPage(null);
    }
    if (doc.latest_extraction && doc.latest_extraction.fields.length > 0) {
      setSelectedFieldId(doc.latest_extraction.fields[0].id);
    } else {
      setSelectedFieldId(null);
    }
    fetchAudit(doc.id);
  };

  const fetchAudit = async (docId: string) => {
    try {
      const res = await fetch(`/api/v1/audit/${docId}`);
      if (res.ok) {
        const logs = await res.json();
        setAuditLogs(logs);
      }
    } catch (e) {
      console.error('Failed to fetch audit logs:', e);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleUploadFile = async (file: File) => {
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/v1/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Upload failed');
      }

      const newDoc: DocumentResponse = await res.json();
      setDocuments((prev) => [newDoc, ...prev]);
      selectDocument(newDoc);
      setActiveTab('workspace');
      showToast(`Document '${newDoc.filename}' successfully parsed and validated!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to upload document', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateDemo = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/v1/documents/sample-demo', {
        method: 'POST',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to generate demo');
      }

      const demoDoc: DocumentResponse = await res.json();
      setDocuments((prev) => [demoDoc, ...prev]);
      selectDocument(demoDoc);
      setActiveTab('workspace');
      showToast('Enterprise Invoice demo generated and extracted!');
    } catch (err: any) {
      showToast(err.message || 'Error generating demo', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectField = (field: FieldResponse) => {
    setSelectedFieldId(field.id);
    if (selectedDoc && selectedDoc.pages) {
      const targetPage = selectedDoc.pages.find((p) => p.page_number === field.page_number);
      if (targetPage && selectedPage?.page_number !== targetPage.page_number) {
        setSelectedPage(targetPage);
      }
    }
  };

  const handleSaveFieldUpdates = async (updates: { field_id: string; new_value: string }[]) => {
    if (!selectedDoc?.latest_extraction) return;

    try {
      const res = await fetch(
        `/api/v1/extractions/${selectedDoc.latest_extraction.id}/fields`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            updates: updates.map((u) => ({ ...u, operator: 'lead_engineer_auditor' })),
          }),
        }
      );

      if (!res.ok) {
        throw new Error('Failed to save field modifications');
      }

      const updatedDoc: DocumentResponse = await res.json();
      selectDocument(updatedDoc);
      setDocuments((prev) => prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)));
      showToast('Modifications saved & logged to immutable audit trail!');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleApproveExtraction = async (extractionId: string) => {
    try {
      const formData = new FormData();
      formData.append('operator', 'lead_engineer_auditor');

      const res = await fetch(`/api/v1/extractions/${extractionId}/approve`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to approve extraction');
      }

      const approvedDoc: DocumentResponse = await res.json();
      selectDocument(approvedDoc);
      setDocuments((prev) => prev.map((d) => (d.id === approvedDoc.id ? approvedDoc : d)));
      showToast('Extraction approved & committed to enterprise database sink!');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const hitlQueue = documents.filter((d) => d.status === 'NEEDS_REVIEW');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium border backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
              : 'bg-rose-950/90 border-rose-800 text-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          {toastMessage.text}
        </div>
      )}

      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hitlCount={hitlQueue.length}
        onUploadFile={handleUploadFile}
        onGenerateDemo={handleGenerateDemo}
        onOpenAudit={() => setIsAuditOpen(true)}
        isProcessing={isProcessing}
      />

      {/* Processing Banner */}
      {isProcessing && (
        <div className="bg-gradient-to-r from-indigo-900/60 via-sky-900/60 to-indigo-900/60 border-b border-indigo-700/40 px-6 py-2 flex items-center justify-center gap-2 text-xs text-sky-200 font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
          Processing Multimodal Layout, VLM Extraction & Pydantic Reflection Loop...
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-hidden max-w-[1700px] w-full mx-auto">
        {activeTab === 'workspace' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-130px)]">
            {/* Left Panel: High-res PDF with SVG Bounding Box Canvas */}
            <div className="lg:col-span-7 h-full flex flex-col">
              <DocumentViewer
                page={selectedPage}
                fields={selectedDoc?.latest_extraction?.fields || []}
                selectedFieldId={selectedFieldId}
                onSelectField={handleSelectField}
              />
            </div>

            {/* Right Panel: Side-by-Side Pydantic Schema Editor */}
            <div className="lg:col-span-5 h-full flex flex-col">
              <ExtractionForm
                extraction={selectedDoc?.latest_extraction || null}
                selectedFieldId={selectedFieldId}
                onSelectField={handleSelectField}
                onSaveFieldUpdates={handleSaveFieldUpdates}
                onApproveExtraction={handleApproveExtraction}
              />
            </div>
          </div>
        )}

        {activeTab === 'hitl' && (
          <HITLQueueView
            queue={hitlQueue}
            onSelectDocument={(doc) => {
              selectDocument(doc);
              setActiveTab('workspace');
            }}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentsListView
            documents={documents}
            onSelectDocument={(doc) => {
              selectDocument(doc);
              setActiveTab('workspace');
            }}
          />
        )}
      </main>

      {/* Immutable SOC2 Audit Drawer */}
      <AuditTrailDrawer
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        logs={auditLogs}
        documentName={selectedDoc?.filename}
      />
    </div>
  );
};

export default App;
