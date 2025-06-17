import React, { useCallback } from 'react';
import {
  Button,
  TextField,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
  Tooltip,
} from '@mui/material';
import Link from '@tiptap/extension-link';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  FormatBold as FormatBoldIcon,
  FormatItalic as FormatItalicIcon,
  FormatUnderlined as FormatUnderlinedIcon,
  FormatStrikethrough as FormatStrikethroughIcon,
  FormatListBulleted as FormatListBulletedIcon,
  FormatListNumbered as FormatListNumberedIcon,
  FormatQuote as FormatQuoteIcon,
  Code as CodeIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
} from '@mui/icons-material';

const BodyEditor = ({ content, onContentChange, label, editable = true }) => {
  const [urlDialogOpen, setUrlDialogOpen] = React.useState(false);
  const [currentUrl, setCurrentUrl] = React.useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({}),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onContentChange(editor.getHTML());
    },
    editable,
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content',
        'aria-label': label,
      },
    },
  });

  const handleUrlDialogOpen = useCallback(() => {
    setCurrentUrl(editor.getAttributes('link').href || '');
    setUrlDialogOpen(true);
  }, [editor]);

  const handleUrlDialogClose = useCallback(() => {
    setUrlDialogOpen(false);
    setCurrentUrl('');
  }, []);

  const setLink = useCallback(() => {
    if (
      editor.isActive('link') &&
      editor.getAttributes('link').href === currentUrl
    ) {
      editor.chain().focus().unsetLink().run();
      setUrlDialogOpen(false);
      return;
    }
    if (currentUrl === null || currentUrl.trim() === '') {
      editor.chain().focus().unsetLink().run();
      setUrlDialogOpen(false);
      return;
    }
    editor.chain().focus().setLink({ href: currentUrl }).run();
    setUrlDialogOpen(false);
  }, [editor, currentUrl]);

  if (!editor) {
    return null;
  }

  const customButtonSx = {
    minWidth: '28px',
    height: '28px',
    padding: '4px',
    '& .MuiSvgIcon-root': {
      fontSize: '1rem',
    },
  };

  return (
    <Box
      sx={{
        border: '1px solid #c4c4c4',
        borderRadius: '4px',
        '&:hover': { borderColor: '#000' },
        '&.Mui-focused': { borderColor: 'primary.main', borderWidth: '2px' },
        position: 'relative',
        p: 1,
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '-12px',
          left: '12px',
          backgroundColor: 'background.paper',
          px: 0.5,
          fontSize: '0.75rem',
          color: '#757575',
          zIndex: 1,
        }}
      >
        {label}
      </Box>

      {editable && (
        <Paper
          elevation={0}
          sx={{ mb: 1, p: 0.5, borderBottom: '1px solid #eee' }}
        >
          <ToggleButtonGroup
            size="small"
            exclusive
            sx={{ '& .MuiToggleButton-root': customButtonSx }}
          >
            <ToggleButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={!editor.can().chain().focus().toggleBold().run()}
              selected={editor.isActive('bold')}
              value="bold"
              aria-label="bold"
            >
              <FormatBoldIcon />
            </ToggleButton>
            <ToggleButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={!editor.can().chain().focus().toggleItalic().run()}
              selected={editor.isActive('italic')}
              value="italic"
              aria-label="italic"
            >
              <FormatItalicIcon />
            </ToggleButton>
            <ToggleButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              disabled={!editor.can().chain().focus().toggleStrike().run()}
              selected={editor.isActive('strike')}
              value="strike"
              aria-label="strike"
            >
              <FormatStrikethroughIcon />
            </ToggleButton>
            <ToggleButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              disabled={!editor.can().chain().focus().toggleCode().run()}
              selected={editor.isActive('code')}
              value="code"
              aria-label="code"
            >
              <CodeIcon />
            </ToggleButton>
            <ToggleButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              selected={editor.isActive('blockquote')}
              value="blockquote"
              aria-label="blockquote"
            >
              <FormatQuoteIcon />
            </ToggleButton>
            <ToggleButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              selected={editor.isActive('bulletList')}
              value="bulletList"
              aria-label="bulleted list"
            >
              <FormatListBulletedIcon />
            </ToggleButton>
            <ToggleButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              selected={editor.isActive('orderedList')}
              value="orderedList"
              aria-label="ordered list"
            >
              <FormatListNumberedIcon />
            </ToggleButton>

            <Tooltip title="Add Link">
              <ToggleButton
                onClick={handleUrlDialogOpen}
                selected={editor.isActive('link')}
                value="link"
                aria-label="add link"
              >
                <LinkIcon />
              </ToggleButton>
            </Tooltip>
            <Tooltip title="Remove Link">
              <ToggleButton
                onClick={() => editor.chain().focus().unsetLink().run()}
                disabled={!editor.isActive('link')}
                value="unlink"
                aria-label="remove link"
              >
                <LinkOffIcon />
              </ToggleButton>
            </Tooltip>
          </ToggleButtonGroup>

          <IconButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            size="small"
            sx={customButtonSx}
            aria-label="undo"
          >
            <UndoIcon />
          </IconButton>
          <IconButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            size="small"
            sx={customButtonSx}
            aria-label="redo"
          >
            <RedoIcon />
          </IconButton>
        </Paper>
      )}

      <EditorContent editor={editor} style={{ flexGrow: 1, outline: 'none' }} />

      <Dialog open={urlDialogOpen} onClose={handleUrlDialogClose}>
        <DialogTitle>Set Link URL</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="url"
            label="URL"
            type="url"
            fullWidth
            variant="standard"
            value={currentUrl}
            onChange={(e) => setCurrentUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUrlDialogClose}>Cancel</Button>
          <Button onClick={setLink}>Set Link</Button>
        </DialogActions>
      </Dialog>

      <style jsx global>{`
        .tiptap-editor-content {
          padding: 8px 12px;
          min-height: 150px;
          outline: none;
          /* Ensure text content is clickable/editable */
          cursor: text;
        }

        /* Basic styling for links within the editor */
        .tiptap-editor-content a {
          color: #1976d2; /* MUI primary blue */
          text-decoration: underline;
          cursor: pointer;
        }
        .tiptap-editor-content a:hover {
          text-decoration: none;
        }

        /* ... (existing styles for p, ul, ol, h1-h6, strong, em, etc.) ... */
        .tiptap-editor-content p {
          margin: 0 0 0.5em;
        }
        .tiptap-editor-content p:last-child {
          margin-bottom: 0;
        }
        .tiptap-editor-content ul,
        .tiptap-editor-content ol {
          padding-left: 1.5em;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        .tiptap-editor-content h1,
        .tiptap-editor-content h2,
        .tiptap-editor-content h3,
        .tiptap-editor-content h4,
        .tiptap-editor-content h5,
        .tiptap-editor-content h6 {
          margin-top: 1.2em;
          margin-bottom: 0.5em;
          font-weight: bold;
        }
        .tiptap-editor-content h1 {
          font-size: 2em;
        }
        .tiptap-editor-content h2 {
          font-size: 1.5em;
        }
        .tiptap-editor-content h3 {
          font-size: 1.2em;
        }
        .tiptap-editor-content strong {
          font-weight: bold;
        }
        .tiptap-editor-content em {
          font-style: italic;
        }
        .tiptap-editor-content strike {
          text-decoration: line-through;
        }
        .tiptap-editor-content code {
          font-family: monospace;
          background-color: #f0f0f0;
          padding: 0.2em 0.4em;
          border-radius: 3px;
        }
        .tiptap-editor-content pre {
          background: #0d0d0d;
          color: #fff;
          font-family: 'JetBrainsMono', monospace;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
        }
        .tiptap-editor-content pre code {
          color: inherit;
          padding: 0;
          background: none;
          font-size: 0.8em;
        }
        .tiptap-editor-content img {
          max-width: 100%;
          height: auto;
        }
        .tiptap-editor-content blockquote {
          padding-left: 1rem;
          border-left: 2px solid rgba(0, 0, 0, 0.1);
        }
        .tiptap-editor-content hr {
          border: none;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          margin: 1rem 0;
        }
        .tiptap-editor-content:focus {
          outline: none;
        }
      `}</style>
    </Box>
  );
};

export default BodyEditor;
