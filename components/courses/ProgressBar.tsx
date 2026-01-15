/**
 * ProgressBar Component
 * 
 * Shows course completion progress
 */

'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ProgressBarProps {
  completed: number;
  total: number;
  percentage: number;
}

export function ProgressBar({
  completed,
  total,
  percentage,
}: ProgressBarProps) {
  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          Progress: {completed} of {total} chapters
        </span>
        <span className="font-semibold text-gray-900">{percentage.toFixed(0)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-green-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
