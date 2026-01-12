import React from 'react';
import { X, Calendar, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { Project } from '../../types/project.types';

interface ProjectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  if (!isOpen || !project) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pre-lim':
        return <Badge variant="info">Preliminary</Badge>;
      case 'ongoing':
        return <Badge variant="success">Ongoing</Badge>;
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const hoursPercentage = project.plannedHours > 0
    ? Math.round(((project.actualHours || 0) / project.plannedHours) * 100)
    : 0;

  const isOverBudget = (project.actualHours || 0) > project.plannedHours;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{project.projectCode}</h2>
            <p className="text-primary-100 text-sm mt-1">{project.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-primary-800 p-1 rounded transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Status and Progress */}
          <div className="grid grid-cols-2 gap-4">
            <Card variant="bordered" padding="md">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600 font-medium">Status</p>
                {getStatusBadge(project.status)}
              </div>
            </Card>

            <Card variant="bordered" padding="md">
              <div className="mb-3">
                <p className="text-sm text-gray-600 font-medium mb-2">Hours Progress</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">{project.actualHours || 0}</span>
                  <span className="text-sm text-gray-500">of {project.plannedHours} hrs</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(hoursPercentage, 100)}%` }}
                />
              </div>
              <p className={`text-xs mt-2 font-medium ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                {isOverBudget ? (
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {(project.actualHours || 0) - project.plannedHours} hrs over budget
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {hoursPercentage}% complete
                  </span>
                )}
              </p>
            </Card>
          </div>

          {/* Project Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Client */}
            <Card variant="bordered" padding="md">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Client</p>
              <p className="text-sm font-medium text-gray-900">{project.clientName}</p>
            </Card>

            {/* Engineer */}
            <Card variant="bordered" padding="md">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Lead Engineer</p>
              <p className="text-sm font-medium text-gray-900">{project.engineerName}</p>
            </Card>

            {/* Start Date */}
            <Card variant="bordered" padding="md">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Start Date
              </p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(project.startDate).toLocaleDateString()}
              </p>
            </Card>

            {/* End Date */}
            <Card variant="bordered" padding="md">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                End Date
              </p>
              <p className="text-sm font-medium text-gray-900">
                {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}
              </p>
            </Card>
          </div>

          {/* Description */}
          {project.description && (
            <Card variant="bordered" padding="md">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Description</p>
              <p className="text-sm text-gray-700 leading-relaxed">{project.description}</p>
            </Card>
          )}

          {/* Hours Breakdown */}
          <Card variant="bordered" padding="md">
            <p className="text-xs text-gray-500 uppercase font-semibold mb-4 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Hours Overview
            </p>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">Planned Hours</span>
                <span className="font-semibold text-gray-900">{project.plannedHours} hrs</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">Actual Hours</span>
                <span className={`font-semibold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                  {project.actualHours} hrs
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Variance</span>
                <span className={`font-semibold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                  {isOverBudget ? '+' : ''}{(project.actualHours || 0) - project.plannedHours} hrs
                </span>
              </div>
            </div>
          </Card>

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4">
            <Card variant="bordered" padding="md">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Project Code</p>
              <p className="text-sm font-mono font-medium text-gray-900">{project.projectCode}</p>
            </Card>

            <Card variant="bordered" padding="md">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Created</p>
              <p className="text-sm text-gray-900">
                {new Date(project.createdDate || new Date()).toLocaleDateString()}
              </p>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
