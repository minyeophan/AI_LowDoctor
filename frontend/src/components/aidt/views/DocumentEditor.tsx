import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { forwardRef, useImperativeHandle, useEffect } from 'react';
import './DocumentEditor.css';

export interface DocumentEditorRef {
  getHTML: () => string;
}

interface Props {
  initialContent: string;
}

const DocumentEditor = forwardRef<DocumentEditorRef, Props>(({ initialContent }, ref) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialContent,
  });

  useEffect(() => {
    if (editor && initialContent) {
      editor.commands.setContent(initialContent);
    }
  }, [initialContent]);

  useImperativeHandle(ref, () => ({
    getHTML: () => editor?.getHTML() || '',
  }));

  return (
    <div className="document-editor-wrapper">
      <EditorContent editor={editor} className="document-editor-content" />
    </div>
  );
});

export default DocumentEditor;
