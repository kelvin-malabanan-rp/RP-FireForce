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
  Sparkles
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import type { Incident } from "../../types";

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

      const response = await fetch('http://localhost:8000/incidents/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Resolution saved successfully:', result);

      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        if (onSuccess) onSuccess(result);
      }, 2000);

    } catch (err: any) {
      console.error('Error saving resolution:', err);
      setError('Failed to save resolution. Please ensure the AI service is running on port 8000.');
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto border-2 border-purple-500/30 shadow-2xl">
              {/* Header */}
              <CardHeader className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white border-b-0 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Brain className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold">Save Resolution for AI Learning</CardTitle>
                      <p className="text-purple-100 text-sm mt-1">Help the AI learn from this incident</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleClose}
                    disabled={isSubmitting}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 disabled:opacity-50"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {/* Success Message */}
                <AnimatePresence>
                  {showSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg flex items-start gap-3"
                    >
                      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-green-900 dark:text-green-100 text-lg">✅ Saved Successfully!</h3>
                        <p className="text-green-700 dark:text-green-300 mt-1">
                          AI will learn from this incident and improve future recommendations.
                        </p>
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
                      className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg flex items-start gap-3"
                    >
                      <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-red-900 dark:text-red-100">Error</h3>
                        <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
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
                      placeholder="e.g., INC-2024-001 or auto-generated"
                      className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Auto-generated if not provided
                    </p>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      Title <span className="text-red-500 ml-1">*</span>
                    </label>
                    <Input
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Brief title of the incident"
                      required
                      className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      Description <span className="text-red-500 ml-1">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Detailed description of what happened"
                      required
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-sm resize-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>

                  {/* Service */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      Service <span className="text-red-500 ml-1">*</span>
                    </label>
                    <Input
                      name="service"
                      value={formData.service}
                      onChange={handleChange}
                      placeholder="e.g., web-server, database, api"
                      required
                      className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Root Cause */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        Root Cause <span className="text-red-500 ml-1">*</span>
                      </label>
                      <textarea
                        name="rootCause"
                        value={formData.rootCause}
                        onChange={handleChange}
                        placeholder="What was the underlying cause of this incident?"
                        required
                        rows={4}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-sm resize-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Be specific - this helps AI understand similar issues in the future
                      </p>
                    </div>

                    {/* Resolution */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        Resolution <span className="text-red-500 ml-1">*</span>
                      </label>
                      <textarea
                        name="resolution"
                        value={formData.resolution}
                        onChange={handleChange}
                        placeholder="How was this incident resolved? What steps were taken?"
                        required
                        rows={4}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-sm resize-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Include step-by-step actions for future reference
                      </p>
                    </div>

                    {/* Severity */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        Severity <span className="text-red-500 ml-1">*</span>
                      </label>
                      <select
                        name="severity"
                        value={formData.severity}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
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
                        placeholder="e.g., network, outage, dns"
                        className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Comma-separated
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Resolution
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
