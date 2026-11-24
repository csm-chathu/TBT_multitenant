import Button from '@/components/Atomic/Button';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { useState, useEffect, useRef } from 'react';
import { getTicketSuggestion, sendTicketAiChatMessage, ChatTurn } from "@/services/ticketSuggestionService";

export const Suggestion = ({ id }: { id: string | undefined }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [isDark, setIsDark] = useState(() => 
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const checkTheme = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-color-mode'] });
    return () => observer.disconnect();
  }, []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, chatLoading]);

  const fetchInitialSuggestion = async (ticketId: string) => {
    setLoading(true);
    setError(null);
    setMessages([]);

    try {
      const resData = await getTicketSuggestion(ticketId);
      const resObj = typeof resData === 'string' ? JSON.parse(resData) : resData;
      const bodyVal = resObj?.body ?? resObj;
      
      let answerText = '';
      if (typeof bodyVal === 'string') {
        try {
          const parsed = JSON.parse(bodyVal);
          answerText = parsed.Answer || parsed.answer || bodyVal;
        } catch {
          answerText = bodyVal;
        }
      } else if (typeof bodyVal === 'object' && bodyVal !== null) {
        answerText = bodyVal.Answer || bodyVal.answer || '';
      }

      if (!answerText) {
        setError('No suggestion found for this ticket: ' + (resObj?.errorMessage || resObj?.message || 'Empty response'));
      } else {
        setMessages([{ sender: 'assistant', message: answerText }]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch suggestion');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !id || chatLoading) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    
    const updatedMessages: ChatTurn[] = [...messages, { sender: 'user', message: userText }];
    setMessages(updatedMessages);
    setChatLoading(true);

    try {
      const resData = await sendTicketAiChatMessage(id, userText, updatedMessages);
      const resObj = typeof resData === 'string' ? JSON.parse(resData) : resData;
      const bodyVal = resObj?.body ?? resObj;
      
      let replyText = '';
      if (typeof bodyVal === 'string') {
        try {
          const parsed = JSON.parse(bodyVal);
          replyText = parsed.Answer || parsed.answer || bodyVal;
        } catch {
          replyText = bodyVal;
        }
      } else if (typeof bodyVal === 'object' && bodyVal !== null) {
        replyText = bodyVal.Answer || bodyVal.answer || '';
      }

      if (replyText) {
        setMessages((prev) => [...prev, { sender: 'assistant', message: replyText }]);
      } else {
        setMessages((prev) => [...prev, { sender: 'assistant', message: 'Unable to process response. Please try again.' }]);
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to send message';
      setMessages((prev) => [...prev, { sender: 'assistant', message: `⚠️ Error: ${errMsg}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (modalOpen && id) {
      fetchInitialSuggestion(id);
    }
  }, [modalOpen, id]);

  return (
    <>
      <Button 
        onClick={() => setModalOpen(true)} 
        icon='wand_stars' 
        style='Icon' 
        className='bg-surface-primary rounded-md text-textColor-base' 
      />
      
      {modalOpen && (
        <div 
          className="flex items-center justify-center fixed top-0 left-0 h-screen w-screen bg-black/80 z-30" 
          onClick={() => setModalOpen(false)}
        >
          <div 
            className="max-w-4xl w-full mx-4 bg-surface-primary shadow-2xl rounded-lg overflow-hidden flex flex-col h-[85vh]" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="py-3 px-5 flex justify-between items-center border-b border-borderColor-secondary bg-surface-secondary">
              <h2 className="text-xl font-medium text-textColor-base">AI Ticket Assistant</h2>
              <Button style="Icon" icon="close" onClick={() => setModalOpen(false)} />
            </div>

            {/* Chat Body */}
            <div className="px-5 py-4 flex-1 overflow-y-auto space-y-4">
              {loading && (
                <div className="flex items-center space-x-2 text-textColor-base py-8 justify-center">
                  <span className="animate-spin text-2xl">⏳</span>
                  <p className="text-textColor-base font-medium">Analyzing ticket details and generating solution...</p>
                </div>
              )}

              {!loading && error && (
                <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-500 rounded-md text-red-800 dark:text-red-300">
                  <p>{error}</p>
                </div>
              )}

              {!loading && messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`text-xs font-semibold mb-1 px-1 ${msg.sender === 'user' ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {msg.sender === 'user' ? 'You' : 'AI Assistant'}
                  </div>
                  
                  <div 
                    className={`max-w-[88%] rounded-xl px-4 py-3 shadow-sm ${
                      msg.sender === 'user' 
                        ? 'bg-indigo-600 text-white dark:bg-indigo-600/50 border border-indigo-500/40' 
                        : 'bg-surface-secondary text-textColor-base border border-borderColor-secondary w-full'
                    }`}
                  >
                    {msg.sender === 'user' ? (
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                    ) : (
                      <MarkdownPreview 
                        source={msg.message} 
                        style={{ padding: 4, backgroundColor: 'transparent' }} 
                        wrapperElement={{
                          'data-color-mode': isDark ? 'dark' : 'light'
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex items-center space-x-2 text-textColor-base py-2 px-3">
                  <span className="animate-pulse">🤖</span>
                  <p className="text-sm italic font-semibold text-textColor-base">AI is thinking...</p>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Chat Footer Input */}
            <div className="p-3 border-t border-borderColor-secondary bg-surface-secondary flex items-center space-x-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !chatLoading && handleSendMessage()}
                placeholder="Ask follow-up question or instruct AI..."
                disabled={loading || chatLoading}
                className="flex-1 bg-surface-primary border border-borderColor-secondary rounded-lg px-4 py-2.5 text-sm text-textColor-base outline-none focus:border-blue-500 placeholder:text-textColor-muted"
              />
              <Button
                text="Send"
                onClick={handleSendMessage}
                disabled={loading || chatLoading || !inputMessage.trim()}
                className="bg-blue-600 text-white hover:bg-blue-700 px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

