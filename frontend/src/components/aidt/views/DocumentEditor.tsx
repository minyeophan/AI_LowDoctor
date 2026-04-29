import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { forwardRef, useImperativeHandle, useEffect } from 'react';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { SearchQuery, findNext } from 'prosemirror-search';
import './DocumentEditor.css';

export interface DocumentEditorRef {
  getHTML: () => string;
}

interface Props {
  initialContent: string;
  searchTerm?: string;
  zoomLevel?: number;
}

// 검색 하이라이팅 Extension
const searchPluginKey = new PluginKey('search');

const createSearchExtension = (searchTerm: string) =>
  Extension.create({
    name: 'search',
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: searchPluginKey,
          state: {
            init() { return { term: '', decorations: DecorationSet.empty }; },
            apply(tr, old) {
              const newTerm = tr.getMeta('search');
              const term = newTerm !== undefined ? newTerm : old.term;
              
              if (!term.trim()) return { term, decorations: DecorationSet.empty };
              
              const decorations: Decoration[] = [];
              tr.doc.descendants((node, pos) => {
                if (!node.isText) return;
                const text = node.text || '';
                const lower = text.toLowerCase();
                const searchLower = term.toLowerCase();
                let idx = 0;
                while ((idx = lower.indexOf(searchLower, idx)) !== -1) {
                  decorations.push(
                    Decoration.inline(pos + idx, pos + idx + term.length, {
                      class: 'search-highlight',
                    })
                  );
                  idx += term.length;
                }
              });
              return { term, decorations: DecorationSet.create(tr.doc, decorations) };
            },
          },
          props: {
            decorations(state) {
              return searchPluginKey.getState(state)?.decorations;
            },
          },
        }),
      ];
    },
  });

const DocumentEditor = forwardRef<DocumentEditorRef, Props>(
  ({ initialContent, searchTerm = '', zoomLevel = 100 }, ref) => {
    const editor = useEditor({
      extensions: [
        StarterKit,
        Table.configure({ resizable: false }),
        TableRow,
        TableHeader,
        TableCell,
        createSearchExtension(searchTerm),
      ],
      content: initialContent,
    });

    useEffect(() => {
      if (editor && initialContent) {
        editor.commands.setContent(initialContent);
      }
    }, [initialContent]);

    useEffect(() => {
      if (!editor) return;

      editor.view.dispatch(editor.view.state.tr.setMeta('search', searchTerm));
    }, [searchTerm, editor]);

    useImperativeHandle(ref, () => ({
      getHTML: () => editor?.getHTML() || '',
    }));

    useEffect(() => {
  const wrapper = document.querySelector('.document-editor-wrapper') as HTMLElement;
    if (wrapper) {
      wrapper.style.fontSize = `${zoomLevel}%`;
    }
  }, [zoomLevel]);

    return (
      <div className="document-editor-wrapper">
        <EditorContent editor={editor} className="document-editor-content" />
      </div>
    );
  }
);

export default DocumentEditor;