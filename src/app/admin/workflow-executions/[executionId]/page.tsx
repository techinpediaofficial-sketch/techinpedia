'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Zap,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Play,
  Terminal,
} from 'lucide-react';

interface Step {
  id: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  actionType?: string | null;
  status: string;
  inputPayload?: string | null;
  outputPayload?: string | null;
  errorDetails?: string | null;
  durationMs: number;
  retryCount: number;
  executedAt: string;
}

interface ExecutionDetails {
  id: string;
  workflowId: string;
  workflowVersion: number;
  status: string;
  triggerEvent: string;
  triggerPayload?: string | null;
  errorLog?: string | null;
  startedAt: string;
  completedAt?: string | null;
  workflow: {
    id: string;
    name: string;
    category: string;
    version: number;
  };
  steps: Step[];
}

export default function ExecutionTimelinePage({
  params,
}: {
  params: Promise<{ executionId: string }>;
}) {
  const { executionId } = use(params);
  const [execution, setExecution] = useState<ExecutionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [retryingStepId, setRetryingStepId] = useState<string | null>(null);
  const [replaying, setReplaying] = useState(false);

  const fetchExecution = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/automation/executions/${executionId}`);
      const data = await res.json();
      if (data.success && data.execution) {
        setExecution(data.execution);
        if (data.execution.steps?.length > 0) {
          setExpandedStepId(data.execution.steps[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load execution timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecution();
  }, [executionId]);

  const handleRetryStep = async (stepId: string) => {
    setRetryingStepId(stepId);
    try {
      const res = await fetch(`/api/automation/executions/${executionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RETRY_STEP', stepId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchExecution();
      } else {
        alert(data.error || 'Step retry failed.');
      }
    } catch (err: any) {
      alert(`Retry Error: ${err.message}`);
    } finally {
      setRetryingStepId(null);
    }
  };

  const handleReplay = async () => {
    if (!confirm('Are you sure you want to replay this execution from the beginning?')) return;
    setReplaying(true);
    try {
      const res = await fetch(`/api/automation/executions/${executionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REPLAY' }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Replay initiated successfully!');
        if (data.newExecutionId) {
          window.location.href = `/admin/workflow-executions/${data.newExecutionId}`;
        }
      } else {
        alert(data.error || 'Replay failed.');
      }
    } catch (err: any) {
      alert(`Replay Error: ${err.message}`);
    } finally {
      setReplaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-violet-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="max-w-3xl mx-auto p-12 text-center text-slate-500 dark:text-slate-400">
        <AlertCircle className="w-12 h-12 mx-auto text-rose-500 mb-3" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Execution Not Found</h2>
        <Link href="/admin/workflows" className="mt-4 inline-block text-violet-600 font-bold hover:underline">
          Return to Workflows
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 pb-24 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/workflows/${execution.workflowId}/executions`}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Execution Timeline</h1>
              <span
                className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                  execution.status === 'COMPLETED'
                    ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                    : execution.status === 'WAITING'
                    ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30'
                    : execution.status === 'FAILED'
                    ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                    : 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                }`}
              >
                {execution.status}
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5">
              Workflow: <strong>{execution.workflow?.name}</strong> (v{execution.workflowVersion}) • ID: {execution.id}
            </p>
          </div>
        </div>

        <button
          disabled={replaying}
          onClick={handleReplay}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-700 dark:text-slate-200 rounded-xl font-bold shadow-xs transition-all disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {replaying ? 'Replaying...' : 'Replay Execution'}
        </button>
      </div>

      {/* Trigger Payload Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
            <Zap className="w-4 h-4 text-amber-500" />
            Trigger Event: <span className="font-mono text-violet-700">{execution.triggerEvent}</span>
          </div>
          <span className="text-slate-500 dark:text-slate-400 text-[11px]">
            {new Date(execution.startedAt).toLocaleString('en-IN')}
          </span>
        </div>

        {execution.triggerPayload && (
          <pre className="p-3.5 bg-white dark:bg-slate-900 text-emerald-400 rounded-xl overflow-x-auto text-[11px] font-mono">
            {JSON.stringify(JSON.parse(execution.triggerPayload), null, 2)}
          </pre>
        )}
      </div>

      {/* Step by Step Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Execution Steps ({execution.steps?.length || 0})</h2>
          <span className="text-slate-500 dark:text-slate-400">All sensitive credentials automatically masked</span>
        </div>

        <div className="space-y-3">
          {execution.steps?.map((step, idx) => {
            const isExpanded = expandedStepId === step.id;

            return (
              <div
                key={step.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all shadow-xs overflow-hidden ${
                  step.status === 'FAILED'
                    ? 'border-rose-300'
                    : step.status === 'SUCCESS'
                    ? 'border-slate-200 dark:border-slate-800'
                    : 'border-blue-300'
                }`}
              >
                {/* Step Header */}
                <div
                  onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 select-none"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        step.status === 'SUCCESS'
                          ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                          : step.status === 'FAILED'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {idx + 1}
                    </div>

                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {step.nodeName}
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 text-slate-500 dark:text-slate-400 uppercase">
                          {step.nodeType}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Duration: {step.durationMs}ms • Executed:{' '}
                        {new Date(step.executedAt).toLocaleTimeString('en-IN')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        step.status === 'SUCCESS'
                          ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                          : step.status === 'FAILED'
                          ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                          : 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30'
                      }`}
                    >
                      {step.status}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Step Inspector (Expanded) */}
                {isExpanded && (
                  <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
                    {step.errorDetails && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          Failure Details
                        </div>
                        <p className="font-mono text-[11px]">{step.errorDetails}</p>
                        {step.status === 'FAILED' && (
                          <div className="pt-2">
                            <button
                              disabled={retryingStepId === step.id}
                              onClick={() => handleRetryStep(step.id)}
                              className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold text-[10px] hover:bg-rose-700 transition-all disabled:opacity-50"
                            >
                              {retryingStepId === step.id ? 'Retrying Step...' : 'Retry Step Now'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {step.inputPayload && (
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-700 dark:text-slate-200 block mb-1">Input Parameters:</span>
                        <pre className="p-3 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-xl overflow-x-auto text-[10px] font-mono">
                          {JSON.stringify(JSON.parse(step.inputPayload), null, 2)}
                        </pre>
                      </div>
                    )}

                    {step.outputPayload && (
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-700 dark:text-slate-200 block mb-1">Provider Output:</span>
                        <pre className="p-3 bg-white dark:bg-slate-900 text-emerald-400 rounded-xl overflow-x-auto text-[10px] font-mono">
                          {JSON.stringify(JSON.parse(step.outputPayload), null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
