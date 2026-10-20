import React from 'react';
import { STATUS_COLORS } from '../utils/constants';
import { capitalize } from '../utils/format';

export default function StatusBadge({ status }) {
  if (!status) return null;
  const normalized = status.toLowerCase();
  const theme = STATUS_COLORS[normalized] || {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${theme.bg} ${theme.text} ${theme.border}`}
    >
      {capitalize(status)}
    </span>
  );
}
