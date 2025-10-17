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
  Hash,
  Sparkles,
  TrendingUp
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
    if (!formData.incidentId.trim()) {
      setError('Incident ID is required');
      return false;
    }
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }
    if (!formData.service.trim()) {
      setError('Service is required');
      return false;
    }
    if (!formData.rootCause.trim()) {
      setError('Root Cause is required');
      return false;
    }
    if (!formData.resolution.trim()) {
      setError('Resolution is required');
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

      // ✅ Use Railway API endpoint
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
      }, 2000);

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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border-slate-200 dark:border-slate-700">
              {/* Header */}
              <CardHeader className="sticky top-0 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white border-b-0 z-10 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                      <Brain className="h-7 w-7" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        AI Knowledge Base
                        <TrendingUp className="h-5 w-5 text-purple-200" />
                      </CardTitle>
                      <p className="text-purple-100 text-sm mt-1 font-medium">
                        Document this resolution to improve AI predictions
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleClose}
                    disabled={isSubmitting}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 disabled:opacity-50 rounded-lg transition-all"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Success Message */}
                <AnimatePresence>
                  {showSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mb-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-500 rounded-xl shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-500 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-green-900 dark:text-green-100 text-lg">
                            Successfully Saved!
                          </h3>
                          <p className="text-green-700 dark:text-green-300 mt-1 text-sm">
                            AI will now use this resolution to help with similar incidents in the future.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mb-6 p-5 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-500 rounded-xl shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-500 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-red-900 dark:text-red-100 text-lg">
                            Error Saving Resolution
                          </h3>
                          <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Info Banner */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl"
                >
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <span className="font-semibold">How this helps:</span> By documenting root causes and resolutions, the AI can suggest relevant solutions when similar incidents occur.
                    </p>
                  </div>
                </motion.div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Incident ID */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        <Hash className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        Incident ID
                      </label>
                      <Input
                        name="incidentId"
                        value={formData.incidentId}
                        onChange={handleChange}
                        placeholder="Auto-generated"
                        className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:border-purple-500 dark:focus:border-purple-400"
                      />
                    </div>

                    {/* Service */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        Service <span className="text-red-500">*</span>
                      </label>
                      <Input
                        name="service"
                        value={formData.service}
                        onChange={handleChange}
                        placeholder="e.g., api-gateway, database"
                        required
                        className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:border-purple-500 dark:focus:border-purple-400"
                      />
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      Incident Title <span className="text-red-500">*</span>
                    </label>
                    <Input
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Brief, descriptive title"
                      required
                      className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:border-purple-500 dark:focus:border-purple-400"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="What happened? Include symptoms and impact..."
                      required
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-sm resize-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                    />
                  </div>

                  {/* Root Cause */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      Root Cause <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="rootCause"
                      value={formData.rootCause}
                      onChange={handleChange}
                      placeholder="What was the underlying cause? Be specific for better AI learning..."
                      required
                      rows={4}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-sm resize-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                    />
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Be detailed - this helps AI recognize patterns
                    </p>
                  </div>

                  {/* Resolution */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      Resolution Steps <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="resolution"
                      value={formData.resolution}
                      onChange={handleChange}
                      placeholder="How was it fixed? Include step-by-step actions taken..."
                      required
                      rows={4}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-sm resize-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                    />
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Include commands, configs, or procedures used
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Severity */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        Severity <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="severity"
                        value={formData.severity}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all"
                      >
                        <option value="low">🟢 Low</option>
                        <option value="medium">🟡 Medium</option>
                        <option value="high">🟠 High</option>
                        <option value="critical">🔴 Critical</option>
                      </select>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        <Tags className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        Tags (Optional)
                      </label>
                      <Input
                        name="tags"
                        value={formData.tags}
                        onChange={handleChange}
                        placeholder="network, timeout, memory"
                        className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:border-purple-500 dark:focus:border-purple-400"
                      />
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Comma-separated keywords
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <Button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      variant="outline"
                      className="flex-1 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving to AI...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save to Knowledge Base
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}