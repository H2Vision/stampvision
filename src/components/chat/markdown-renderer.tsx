"use client";

interface MarkdownRendererProps {
  content: string;
  streaming?: boolean;
}

export function MarkdownRenderer({ content, streaming }: MarkdownRendererProps) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre
          key={i}
          className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-xs font-mono my-3"
        >
          {lang && (
            <div className="text-gray-500 text-[10px] mb-2 uppercase tracking-wider">{lang}</div>
          )}
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      i++;
      continue;
    }

    // H1
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-lg font-bold text-gray-900 mt-4 mb-2 first:mt-0">
          {inlineFormat(line.slice(2))}
        </h1>
      );
      i++;
      continue;
    }

    // H2
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-base font-semibold text-gray-800 mt-3 mb-1.5 first:mt-0">
          {inlineFormat(line.slice(3))}
        </h2>
      );
      i++;
      continue;
    }

    // H3
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-sm font-semibold text-gray-800 mt-2 mb-1 first:mt-0">
          {inlineFormat(line.slice(4))}
        </h3>
      );
      i++;
      continue;
    }

    // Unordered list
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const listItems: string[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        listItems.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={i} className="space-y-1 my-2 pl-1">
          {listItems.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-yellow-d flex-shrink-0" />
              <span>{inlineFormat(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const listItems: string[] = [];
      let n = 1;
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
        n++;
      }
      elements.push(
        <ol key={i} className="space-y-1 my-2 pl-1">
          {listItems.map((item, j) => (
            <li key={j} className="flex items-start gap-2.5 text-sm text-gray-700">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-yellow-10 text-brand-yellow-d text-[10px] font-bold flex items-center justify-center mt-0.5">
                {j + 1}
              </span>
              <span>{inlineFormat(item)}</span>
            </li>
          ))}
        </ol>
      );
      void n;
      continue;
    }

    // Horizontal rule
    if (line === "---" || line === "***") {
      elements.push(<hr key={i} className="my-3 border-gray-200" />);
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="text-sm text-gray-700 leading-relaxed">
        {inlineFormat(line)}
      </p>
    );
    i++;
  }

  return (
    <div className="space-y-0.5">
      {elements}
      {streaming && (
        <span className="inline-block w-0.5 h-4 bg-brand-yellow-d animate-pulse ml-0.5 align-middle" />
      )}
    </div>
  );
}

// Inline formatting: bold, italic, inline code, links
function inlineFormat(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold **text**
    const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*(.*)/s);
    // Italic *text*
    const italicMatch = remaining.match(/^(.*?)\*(.+?)\*(.*)/s);
    // Inline code `text`
    const codeMatch = remaining.match(/^(.*?)`([^`]+)`(.*)/s);

    const matchIndex = (m: RegExpMatchArray | null) =>
      m ? m[1].length : Infinity;

    const first = Math.min(
      matchIndex(boldMatch),
      matchIndex(italicMatch),
      matchIndex(codeMatch)
    );

    if (first === Infinity) {
      parts.push(remaining);
      break;
    }

    if (first === matchIndex(boldMatch) && boldMatch) {
      if (boldMatch[1]) parts.push(boldMatch[1]);
      parts.push(<strong key={key++} className="font-semibold text-gray-900">{boldMatch[2]}</strong>);
      remaining = boldMatch[3];
    } else if (first === matchIndex(italicMatch) && italicMatch) {
      if (italicMatch[1]) parts.push(italicMatch[1]);
      parts.push(<em key={key++} className="italic">{italicMatch[2]}</em>);
      remaining = italicMatch[3];
    } else if (codeMatch) {
      if (codeMatch[1]) parts.push(codeMatch[1]);
      parts.push(
        <code key={key++} className="px-1 py-0.5 bg-gray-100 text-gray-800 rounded text-[11px] font-mono">
          {codeMatch[2]}
        </code>
      );
      remaining = codeMatch[3];
    } else {
      parts.push(remaining);
      break;
    }
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}
