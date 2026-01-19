// src/embed-chat/components/MessageInput.tsx
import { useRef, useEffect, type KeyboardEvent, type ChangeEvent } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { chatApi } from '../services/chatApi';

export function MessageInput() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    inputText,
    attachments,
    isSending,
    conversationId,
    config,
    setInputText,
    addAttachment,
    removeAttachment,
    updateAttachment,
    clearInput,
    addMessage,
    setTyping,
    setSending,
  } = useChatStore();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [inputText]);

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    const trimmedText = inputText.trim();
    if (!trimmedText || isSending || !conversationId || !config) return;

    // Add user message immediately
    const userMessage = {
      id: Math.random().toString(36).substring(2, 15),
      type: 'text' as const,
      sender: 'user' as const,
      content: trimmedText,
      timestamp: new Date(),
      isRead: true,
    };
    addMessage(userMessage);
    clearInput();
    setSending(true);

    // Show typing indicator
    setTyping({ isTyping: true, typingUser: config.aiName || 'YODA' });

    try {
      const response = await chatApi.sendMessage(
        conversationId,
        trimmedText,
        config.studioName,
        () => setTyping({ isTyping: true, typingUser: config.aiName || 'YODA' }),
        () => setTyping({ isTyping: false, typingUser: null })
      );

      if (response.data) {
        response.data.forEach((msg) => addMessage(msg));
      }
    } catch {
      addMessage({
        id: Math.random().toString(36).substring(2, 15),
        type: 'text',
        sender: 'ai',
        content: `Desole, une erreur s'est produite. Veuillez reessayer.`,
        timestamp: new Date(),
        isRead: false,
      });
    } finally {
      setSending(false);
      setTyping({ isTyping: false, typingUser: null });
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !conversationId) return;

    for (const file of Array.from(files)) {
      const attachmentId = Math.random().toString(36).substring(2, 15);

      addAttachment({
        id: attachmentId,
        name: file.name,
        type: file.type,
        size: file.size,
        uploading: true,
      });

      try {
        const result = await chatApi.uploadAttachment(
          conversationId,
          file,
          (progress) => {
            // Could update progress here if needed
          }
        );

        if (result.data) {
          updateAttachment(attachmentId, {
            url: result.data.url,
            uploading: false,
          });
        }
      } catch {
        updateAttachment(attachmentId, {
          uploading: false,
          error: 'Erreur lors de l\'upload',
        });
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const canSend = inputText.trim().length > 0 && !isSending;

  return (
    <div className="chat-input-container">
      {attachments.length > 0 && (
        <div className="chat-attachments">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="chat-attachment">
              <span className="chat-attachment-name">{attachment.name}</span>
              {attachment.uploading && <span>...</span>}
              <button
                className="chat-attachment-remove"
                onClick={() => removeAttachment(attachment.id)}
                aria-label="Supprimer"
              >
                <X />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="chat-input-wrapper">
        <textarea
          ref={textareaRef}
          className="chat-input-field"
          placeholder="Ecrivez votre message..."
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isSending}
        />

        <div className="chat-input-actions">
          {config?.enableAttachments && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                className="chat-hidden"
                onChange={handleFileSelect}
                multiple
                accept="image/*,.pdf,.doc,.docx"
              />
              <button
                className="chat-input-btn"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Joindre un fichier"
                title="Joindre un fichier"
              >
                <Paperclip />
              </button>
            </>
          )}

          <button
            className="chat-input-btn chat-input-send"
            onClick={handleSend}
            disabled={!canSend}
            aria-label="Envoyer"
            title="Envoyer"
          >
            <Send />
          </button>
        </div>
      </div>
    </div>
  );
}
