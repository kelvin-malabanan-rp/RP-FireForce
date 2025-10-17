import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Brain,
  FileText,
  AlertTriangle,
  Tags,
  Sparkles,
  Lock,
  Zap,
  Info
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import type { Incident } from "../../types";

// ✅ API Configuration
const AI_API_BASE_URL = 'https://web-production-34444.up.railway.app';

interface SaveResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident: Incident | null;
  onSuccess?: (result: any) => void;
}

interface FormData {
  incidentId: string;
  title: string;
  description: string;
  service: string;
  rootCause: string;
  resolution: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  tags: string;
}

export function SaveResolutionModal({ isOpen, onClose, incident, onSuccess }: SaveResolutionModalProps) {
  const [formData, setFormData] = useState<FormData>({
    incidentId: '',
    title: '',
    description: '',
    service: '',
    rootCause: '',
    resolution: '',
    severity: 'medium',
    tags: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Pre-fill form when incident changes
  useEffect(() => {
    if (incident && isOpen) {
      setFormData({
        incidentId: incident.id || generateIncidentId(),
        title: incident.title || '',
        description: incident.description || '',
        service: incident.location || 'system',
        rootCause: '',
        resolution: '',
        severity: mapSeverity(incident.severity) || 'medium',
        tags: ''
      });
    }
  }, [incident, isOpen]);

  const generateIncidentId = () => {
    return `INC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  };

  const mapSeverity = (incidentSeverity?: string): 'critical' | 'high' | 'medium' | 'low' => {
    if (!incidentSeverity) return 'medium';
    const severity = incidentSeverity.toLowerCase();
    if (severity.includes('crit')) return 'critical';
    if (severity.includes('high')) return 'high';
    if (severity.includes('low')) return 'low';
    return 'medium';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.rootCause.trim()) {
      setError('Root Cause is required - this is critical for AI learning');
      return false;
    }
    if (!formData.resolution.trim()) {
      setError('Resolution steps are required - help others solve similar issues');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        incident_id: formData.incidentId,
        title: formData.title,
        description: formData.description,
        service: formData.service,
        root_cause: formData.rootCause,
        resolution: formData.resolution,
        severity: formData.severity,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      const response = await fetch(`${AI_API_BASE_URL}/incidents/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Resolution saved successfully:', result);

      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        if (onSuccess) onSuccess(result);
      }, 2500);

    } catch (err: any) {
      console.error('❌ Error saving resolution:', err);
      setError(err.message || 'Failed to save resolution. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setError('');
      setShowSuccess(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const badges = {
      critical: { emoji: '🔴', color: 'bg-red-100 text-red-800 border-red-300' },
      high: { emoji: '🟠', color: 'bg-orange-100 text-orange-800 border-orange-300' },
      medium: { emoji: '🟡', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      low: { emoji: '🟢', color: 'bg-green-100 text-green-800 border-green-300' }
    };
    return badges[severity as keyof typeof badges] || badges.medium;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Solid Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-slate-900/95"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
          className="relative w-full max-w-5xl max-h-[95vh] flex flex-col"
        >
          <Card className="w-full h-full bg-white dark:bg-slate-900 border-none shadow-2xl overflow-hidden flex flex-col">
            {/* Gradient Header */}
            <CardHeader className="shrink-0 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-lg ring-2 ring-white/30">
                    <Brain className="h-8 w-8" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-bold">
                      Save to AI Knowledge Base
                    </CardTitle>
                    <p className="text-purple-100 text-sm mt-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Help AI learn from this resolution to assist future incidents
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 rounded-full transition-all h-10 w-10"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
            </CardHeader>

            {/* Scrollable Content */}
            <CardContent className="flex-1 overflow-y-auto p-8 space-y-6">
              {/* Success Banner */}
              <AnimatePresence>
                {showSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-l-4 border-green-500 rounded-xl shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-green-500 rounded-full">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-green-900 dark:text-green-100 text-lg">
                          ✅ Successfully Saved!
                        </h4>
                        <p className="text-green-700 dark:text-green-300 mt-1">
                          This resolution is now part of the AI knowledge base and will help with similar incidents.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Banner */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-6 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 border-l-4 border-red-500 rounded-xl shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-red-500 rounded-full">
                        <AlertCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-red-900 dark:text-red-100 text-lg">
                          Error Saving Resolution
                        </h4>
                        <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Info Banner */}
              <div className="p-5 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                  <div className="text-sm text-blue-900 dark:text-blue-100">
                    <span className="font-semibold block mb-1">📚 How AI Learning Works:</span>
                    The more detailed your root cause and resolution, the better AI can identify patterns and suggest solutions for similar future incidents.
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Read-Only Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                    <Lock className="h-4 w-4" />
                    Incident Information (Read-Only)
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Incident ID - Read Only */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                      <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1 mb-2">
                        <Lock className="h-3 w-3" />
                        Incident ID
                      </label>
                      <div className="text-base font-mono font-semibold text-slate-900 dark:text-white">
                        {formData.incidentId}
                      </div>
                    </div>

                    {/* Service - Read Only */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                      <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1 mb-2">
                        <Lock className="h-3 w-3" />
                        Service
                      </label>
                      <div className="text-base font-semibold text-slate-900 dark:text-white">
                        {formData.service}
                      </div>
                    </div>

                    {/* Severity - Read Only */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                      <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1 mb-2">
                        <Lock className="h-3 w-3" />
                        Severity
                      </label>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border ${getSeverityBadge(formData.severity).color}`}>
                        <span>{getSeverityBadge(formData.severity).emoji}</span>
                        {formData.severity.charAt(0).toUpperCase() + formData.severity.slice(1)}
                      </div>
                    </div>
                  </div>

                  {/* Title - Read Only */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1 mb-2">
                      <Lock className="h-3 w-3" />
                      Title
                    </label>
                    <div className="text-base font-semibold text-slate-900 dark:text-white">
                      {formData.title}
                    </div>
                  </div>

                  {/* Description - Read Only */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1 mb-2">
                      <Lock className="h-3 w-3" />
                      Description
                    </label>
                    <div className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                      {formData.description}
                    </div>
                  </div>
                </div>

                {/* Editable Section */}
                <div className="space-y-6 pt-6 border-t-2 border-dashed border-slate-300 dark:border-slate-700">
                  <div className="flex items-center gap-2 text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                    <Zap className="h-4 w-4" />
                    Add Your Analysis (Required)
                  </div>

                  {/* Root Cause */}
                  <div>
                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      Root Cause Analysis <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="rootCause"
                      value={formData.rootCause}
                      onChange={handleChange}
                      placeholder="What caused this incident? Be as specific as possible...&#10;&#10;Example: Memory leak in user authentication service after deployment of version 2.3.4. The connection pool wasn't properly closed, causing gradual memory buildup over 6 hours."
                      required
                      rows={5}
                      className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
                    />
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                      <span className="font-medium">AI Learning Tip:</span> Include technical details, error codes, and what led to the issue
                    </p>
                  </div>

                  {/* Resolution */}
                  <div>
                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      Resolution Steps <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="resolution"
                      value={formData.resolution}
                      onChange={handleChange}
                      placeholder="How did you fix it? Include step-by-step instructions...&#10;&#10;Example:&#10;1. Identified memory leak using heap dump analysis&#10;2. Rolled back to version 2.3.3 immediately&#10;3. Fixed connection pool closure in authentication module&#10;4. Deployed hotfix version 2.3.5 with proper resource cleanup&#10;5. Monitored memory usage for 24 hours - stable"
                      required
                      rows={6}
                      className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
                    />
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                      <span className="font-medium">AI Learning Tip:</span> Include commands, configuration changes, and verification steps
                    </p>
                  </div>

                  {/* Tags (Optional) */}
                  <div>
                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <Tags className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      Tags (Optional)
                    </label>
                    <Input
                      name="tags"
                      value={formData.tags}
                      onChange={handleChange}
                      placeholder="memory-leak, authentication, deployment, hotfix"
                      className="border-2 border-slate-300 dark:border-slate-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white h-12"
                    />
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Add comma-separated keywords to help categorize this incident
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6 border-t-2 border-slate-200 dark:border-slate-700">
                  <Button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    variant="outline"
                    className="flex-1 h-12 border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold transition-all"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 h-12 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Saving to AI Knowledge Base...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Save to Knowledge Base
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}