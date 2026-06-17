import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Link, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Heading1,
  Heading2,
  Quote,
  Code,
  Undo,
  Redo
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  dir?: 'ltr' | 'rtl';
  minHeight?: string;
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = 'Start writing...',
  className,
  dir = 'ltr',
  minHeight = '200px'
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isSourceMode, setIsSourceMode] = useState(false);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    // Sync content after command
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const ToolbarButton = ({ 
    command, 
    icon: Icon, 
    value 
  }: { 
    command: string; 
    icon: React.ElementType; 
    value?: string 
  }) => (
    <Toggle
      size="sm"
      pressed={document.queryCommandState(command)}
      onPressedChange={() => execCommand(command, value)}
      className="h-8 w-8 p-0"
    >
      <Icon className="h-4 w-4" />
    </Toggle>
  );

  return (
    <div className={cn("border rounded-md overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b bg-muted/30">
        <ToolbarButton command="bold" icon={Bold} />
        <ToolbarButton command="italic" icon={Italic} />
        <ToolbarButton command="underline" icon={Underline} />
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <Toggle
          size="sm"
          onPressedChange={() => execCommand('formatBlock', '<h1>')}
          className="h-8 w-8 p-0"
        >
          <Heading1 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          onPressedChange={() => execCommand('formatBlock', '<h2>')}
          className="h-8 w-8 p-0"
        >
          <Heading2 className="h-4 w-4" />
        </Toggle>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <ToolbarButton command="insertUnorderedList" icon={List} />
        <ToolbarButton command="insertOrderedList" icon={ListOrdered} />
        <ToolbarButton command="formatBlock" icon={Quote} value="<blockquote>" />
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <ToolbarButton command="justifyLeft" icon={AlignLeft} />
        <ToolbarButton command="justifyCenter" icon={AlignCenter} />
        <ToolbarButton command="justifyRight" icon={AlignRight} />
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <Toggle
          size="sm"
          onPressedChange={insertLink}
          className="h-8 w-8 p-0"
        >
          <Link className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          onPressedChange={() => execCommand('formatBlock', '<pre>')}
          className="h-8 w-8 p-0"
        >
          <Code className="h-4 w-4" />
        </Toggle>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <Toggle
          size="sm"
          onPressedChange={() => execCommand('undo')}
          className="h-8 w-8 p-0"
        >
          <Undo className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          onPressedChange={() => execCommand('redo')}
          className="h-8 w-8 p-0"
        >
          <Redo className="h-4 w-4" />
        </Toggle>

        <div className="flex-1" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsSourceMode(!isSourceMode)}
          className="text-xs"
        >
          {isSourceMode ? 'Preview' : 'HTML'}
        </Button>
      </div>

      {/* Editor Area */}
      {isSourceMode ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-3 font-mono text-sm bg-background focus:outline-none resize-none"
          style={{ minHeight }}
          dir={dir}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onPaste={handlePaste}
          dangerouslySetInnerHTML={{ __html: value }}
          className="w-full p-3 focus:outline-none prose prose-sm max-w-none"
          style={{ minHeight }}
          dir={dir}
          data-placeholder={placeholder}
        />
      )}

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          pointer-events: none;
        }
        [contenteditable] h1 { font-size: 1.5em; font-weight: bold; margin: 0.5em 0; }
        [contenteditable] h2 { font-size: 1.25em; font-weight: bold; margin: 0.5em 0; }
        [contenteditable] blockquote { border-left: 3px solid hsl(var(--border)); padding-left: 1em; margin: 0.5em 0; color: hsl(var(--muted-foreground)); }
        [contenteditable] pre { background: hsl(var(--muted)); padding: 0.5em; border-radius: 4px; font-family: monospace; }
        [contenteditable] ul, [contenteditable] ol { padding-left: 1.5em; margin: 0.5em 0; }
        [contenteditable] a { color: hsl(var(--primary)); text-decoration: underline; }
      `}</style>
    </div>
  );
}
