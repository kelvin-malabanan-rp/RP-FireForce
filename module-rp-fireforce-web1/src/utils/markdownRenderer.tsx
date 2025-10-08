import React from 'react';

/**
 * Renders markdown text with proper formatting
 * Supports: **bold**, code blocks (```), bullet points, numbered lists
 */
export function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentCodeBlock: string[] = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for code block start/end
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        // Start code block
        inCodeBlock = true;
        currentCodeBlock = [];
      } else {
        // End code block
        inCodeBlock = false;
        elements.push(
          <pre
            key={`code-${i}`}
            className="bg-slate-900 dark:bg-slate-950 text-green-400 p-4 rounded-lg overflow-x-auto my-2 border border-slate-700"
          >
            <code className="text-sm font-mono">
              {currentCodeBlock.join('\n')}
            </code>
          </pre>
        );
        currentCodeBlock = [];
      }
      continue;
    }

    // If inside code block, collect lines
    if (inCodeBlock) {
      currentCodeBlock.push(line);
      continue;
    }

    // Process regular markdown
    if (line.trim() === '') {
      // Empty line
      elements.push(<br key={`br-${i}`} />);
    } else if (line.trim().match(/^#+\s/)) {
      // Headers (# ## ###)
      const level = line.match(/^(#+)/)?.[0].length || 1;
      const text = line.replace(/^#+\s/, '');
      const fontSize = level === 1 ? 'text-xl' : level === 2 ? 'text-lg' : 'text-base';
      elements.push(
        <div
          key={`h-${i}`}
          className={`font-bold text-slate-900 dark:text-white mt-3 mb-2 ${fontSize}`}
        >
          {processInlineFormatting(text)}
        </div>
      );
    } else if (line.trim().match(/^\d+\.\s/)) {
      // Numbered list
      const text = line.replace(/^\d+\.\s/, '');
      elements.push(
        <div key={`num-${i}`} className="flex gap-2 ml-4 my-1">
          <span className="text-slate-600 dark:text-slate-400 font-medium min-w-[1.5rem]">
            {line.match(/^\d+/)?.[0]}.
          </span>
          <span className="text-slate-800 dark:text-slate-200">
            {processInlineFormatting(text)}
          </span>
        </div>
      );
    } else if (line.trim().match(/^[•\-\*]\s/) || line.trim().match(/^  [•\-\*]\s/)) {
      // Bullet points (including indented)
      const isIndented = line.startsWith('  ');
      const text = line.trim().replace(/^[•\-\*]\s/, '');
      elements.push(
        <div
          key={`bullet-${i}`}
          className={`flex gap-2 my-1 ${isIndented ? 'ml-8' : 'ml-4'}`}
        >
          <span className="text-orange-600 dark:text-orange-400 mt-0.5">•</span>
          <span className="text-slate-800 dark:text-slate-200">
            {processInlineFormatting(text)}
          </span>
        </div>
      );
    } else {
      // Regular paragraph
      elements.push(
        <p key={`p-${i}`} className="text-slate-800 dark:text-slate-200 my-1 leading-relaxed">
          {processInlineFormatting(line)}
        </p>
      );
    }
  }

  return <div className="space-y-1">{elements}</div>;
}

/**
 * Process inline formatting like **bold** and `code`
 */
function processInlineFormatting(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let currentText = text;
  let key = 0;

  while (currentText.length > 0) {
    // Check for **bold**
    const boldMatch = currentText.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      // Add text before bold
      if (boldMatch.index > 0) {
        const beforeText = currentText.substring(0, boldMatch.index);
        parts.push(processInlineCode(beforeText, key++));
      }
      // Add bold text
      parts.push(
        <strong key={`bold-${key++}`} className="font-bold text-slate-900 dark:text-white">
          {boldMatch[1]}
        </strong>
      );
      // Continue with remaining text
      currentText = currentText.substring(boldMatch.index + boldMatch[0].length);
      continue;
    }

    // No more formatting, add remaining text
    parts.push(processInlineCode(currentText, key++));
    break;
  }

  return <>{parts}</>;
}

/**
 * Process inline `code` formatting
 */
function processInlineCode(text: string, baseKey: number): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let currentText = text;
  let key = 0;

  while (currentText.length > 0) {
    const codeMatch = currentText.match(/`(.+?)`/);
    if (codeMatch && codeMatch.index !== undefined) {
      // Add text before code
      if (codeMatch.index > 0) {
        parts.push(currentText.substring(0, codeMatch.index));
      }
      // Add code text
      parts.push(
        <code
          key={`code-${baseKey}-${key++}`}
          className="bg-slate-200 dark:bg-slate-700 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded text-sm font-mono"
        >
          {codeMatch[1]}
        </code>
      );
      // Continue with remaining text
      currentText = currentText.substring(codeMatch.index + codeMatch[0].length);
      continue;
    }

    // No more code formatting
    parts.push(currentText);
    break;
  }

  return <>{parts}</>;
}

/**
 * Component wrapper for markdown rendering
 */
export function MarkdownContent({ content }: { content: string }) {
  return <div className="markdown-content">{renderMarkdown(content)}</div>;
}
