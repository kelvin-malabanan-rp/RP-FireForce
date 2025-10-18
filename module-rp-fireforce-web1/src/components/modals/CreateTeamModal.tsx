// modals/CreateTeamModal.tsx
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import {teamManagementServiceV2} from "@/services/team-management-service.ts";

interface CreateTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTeamCreated: () => void;
}

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
                                                                    isOpen,
                                                                    onClose,
                                                                    onTeamCreated,
                                                                }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClose = () => {
        if (!isSubmitting) {
            setFormData({ name: '', description: '' });
            setError(null);
            onClose();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setError('Team name is required');
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            // Get current user ID from localStorage
            const userStr = localStorage.getItem('user');
            const currentUserId = userStr ? JSON.parse(userStr).id : null;

            if (!currentUserId) {
                setError('User not authenticated');
                return;
            }

            console.log('🏗️ Creating team:', formData.name);

            const response = await teamManagementServiceV2.createTeam({
                name: formData.name.trim(),
                description: formData.description.trim(),
                createdBy: currentUserId,
            });

            if (response.success) {
                console.log('✅ Team created successfully:', response.data?.data?.teamId);
                onTeamCreated();
                handleClose();
            } else {
                setError(response.data?.message || 'Failed to create team');
            }
        } catch (error: any) {
            console.error('❌ Error creating team:', error);
            setError(error.message || 'Failed to create team');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                        Create New Team
                    </DialogTitle>
                    <DialogDescription className="text-slate-600 dark:text-slate-400">
                        Create a new team to organize your on-call members
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-slate-900 dark:text-white">
                                Team Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder="e.g., Backend Team, Frontend Team"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                                disabled={isSubmitting}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-slate-900 dark:text-white">
                                Description
                            </Label>
                            <textarea
                                id="description"
                                placeholder="Brief description of the team's responsibilities"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="flex min-h-[100px] w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 dark:focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                                💡 After creating the team, you can add members and assign roles (Primary, Backup, Escalation)
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                        >
                            {isSubmitting ? 'Creating...' : 'Create Team'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};