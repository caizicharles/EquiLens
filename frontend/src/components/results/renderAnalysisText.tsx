import React from 'react';

/**
 * Regex matching highlightable metric values:
 * - Percentages: 94.0%, 75%, 85.4%
 * - Decimal ratios / F1 scores: 0.875, 0.937, 1.200
 * - Point-gap expressions: 31.4-point, 9.8-point
 */
const METRIC_RE = /(\d+\.?\d*%|\b\d\.\d{2,3}\b|\d+\.?\d*-point\b)/g;

/** Highlight metric values inline (returns fragment, no block wrappers) */
export function renderMetrics(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  METRIC_RE.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = METRIC_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <span key={match.index} style={{ fontWeight: 600 }}>
        {match[0]}
      </span>,
    );
    lastIndex = METRIC_RE.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

/** Render analysis text with paragraph breaks and highlighted metric values */
export function renderAnalysisText(
  text: string,
  style: React.CSSProperties,
): React.ReactNode {
  const paragraphs = text.split(/\n\n+/);
  return paragraphs.map((para, i) => (
    <p key={i} style={{ ...style, margin: 0, marginTop: i > 0 ? 8 : 0 }}>
      {renderMetrics(para)}
    </p>
  ));
}
