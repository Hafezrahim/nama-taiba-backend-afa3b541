import { useState, useRef, useEffect, useMemo } from 'react';
import { MessageCircle, X, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import whatsappIcon from '@/assets/whatsapp-icon.svg';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
}

const ChatbotWidget = () => {
  const { language, t, isRTL } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchMode, setSearchMode] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: faqs = [] } = useQuery({
    queryKey: ['chatbot-faqs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chatbot_faqs')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data;
    },
  });

  const filteredFaqs = useMemo(() => {
    if (!input.trim()) return faqs.slice(0, 10);
    const query = input.toLowerCase();
    return faqs.filter(faq => {
      const q = language === 'en' ? faq.question_en : faq.question_ar;
      return q.toLowerCase().includes(query);
    }).slice(0, 8);
  }, [faqs, input, language]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        text: t(
          'Hello! 👋 How can I help you today? Type your question or browse common topics below.',
          'مرحباً! 👋 كيف يمكنني مساعدتك اليوم؟ اكتب سؤالك أو تصفح المواضيع الشائعة أدناه.'
        ),
        isBot: true,
      }]);
    }
  }, [isOpen]);

  const findAnswer = (question: string): string | null => {
    const query = question.toLowerCase();
    for (const faq of faqs) {
      const q = language === 'en' ? faq.question_en.toLowerCase() : faq.question_ar.toLowerCase();
      if (q.includes(query) || query.includes(q.slice(0, Math.min(q.length, 20)))) {
        return language === 'en' ? faq.answer_en : faq.answer_ar;
      }
    }
    const words = query.split(/\s+/).filter(w => w.length > 2);
    let bestMatch: typeof faqs[0] | null = null;
    let bestScore = 0;
    for (const faq of faqs) {
      const q = (language === 'en' ? faq.question_en + ' ' + faq.answer_en : faq.question_ar + ' ' + faq.answer_ar).toLowerCase();
      let score = 0;
      words.forEach(w => { if (q.includes(w)) score++; });
      if (score > bestScore) { bestScore = score; bestMatch = faq; }
    }
    if (bestScore >= 2 && bestMatch) {
      return language === 'en' ? bestMatch.answer_en : bestMatch.answer_ar;
    }
    return null;
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), text: input, isBot: false };
    setMessages(prev => [...prev, userMsg]);
    setSearchMode(false);

    const answer = findAnswer(input);
    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      text: answer || t(
        '⏳ I apologize, I am currently handling many requests and could not find an exact answer. Please contact our support team for assistance.',
        '⏳ أعتذر، أتعامل حالياً مع العديد من الطلبات ولم أتمكن من إيجاد إجابة دقيقة. يرجى التواصل مع فريق الدعم للمساعدة.'
      ),
      isBot: true,
    };

    setTimeout(() => {
      setMessages(prev => [...prev, botMsg]);
      if (!answer) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: (Date.now() + 2).toString(),
            text: 'WHATSAPP_CONTACT',
            isBot: true,
          }]);
        }, 500);
      }
    }, 600);

    setInput('');
  };

  const handleFaqClick = (faq: typeof faqs[0]) => {
    const question = language === 'en' ? faq.question_en : faq.question_ar;
    const answer = language === 'en' ? faq.answer_en : faq.answer_ar;
    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), text: question, isBot: false },
      { id: (Date.now() + 1).toString(), text: answer, isBot: true },
    ]);
    setSearchMode(false);
    setInput('');
  };

  const handleClear = () => {
    setMessages([]);
    setSearchMode(true);
    setInput('');
    setTimeout(() => {
      setMessages([{
        id: 'welcome',
        text: t(
          'Hello! 👋 How can I help you today? Type your question or browse common topics below.',
          'مرحباً! 👋 كيف يمكنني مساعدتك اليوم؟ اكتب سؤالك أو تصفح المواضيع الشائعة أدناه.'
        ),
        isBot: true,
      }]);
    }, 100);
  };

  const { data: contactInfo } = useQuery({
    queryKey: ['contact-info-chatbot'],
    queryFn: async () => {
      const { data } = await supabase.from('contact_info').select('whatsapp').limit(1).single();
      return data;
    },
  });

  const whatsappNumber = contactInfo?.whatsapp || '';

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+12.5rem)] md:bottom-[calc(env(safe-area-inset-bottom,0px)+11.5rem)] z-50 w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-110 animate-bounce"
          style={{ [isRTL ? 'left' : 'right']: '1rem' }}
          aria-label="Open chat"
        >
          <MessageCircle className="h-5 w-5 md:h-6 md:w-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-[6.5rem] md:bottom-[10.5rem] z-50 w-[calc(100vw-1rem)] md:w-[360px] max-w-[calc(100vw-1rem)] h-[60vh] md:h-[500px] max-h-[calc(100vh-6rem)] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ 
            [isRTL ? 'left' : 'right']: '0.5rem',
          }}
        >
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-3 md:p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 md:h-5 md:w-5" />
              <div>
                <h3 className="font-semibold text-xs md:text-sm">{t('Nama Steel Support', 'دعم نما للصلب')}</h3>
                <p className="text-[10px] md:text-xs opacity-80">{t('Ask us anything!', 'اسألنا أي شيء!')}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClear}
                className="text-primary-foreground hover:bg-white/20 h-7 w-7 md:h-8 md:w-8"
                title={t('Clear chat', 'مسح المحادثة')}
              >
                <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-primary-foreground hover:bg-white/20 h-7 w-7 md:h-8 md:w-8">
                <X className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 md:p-3 space-y-2 md:space-y-3">
            {messages.map(msg => (
              msg.text === 'WHATSAPP_CONTACT' ? (
                <div key={msg.id} className="flex justify-start">
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-green-500 text-white px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium hover:bg-green-600 transition-colors"
                  >
                    <img src={whatsappIcon} alt="WhatsApp" className="h-4 w-4 md:h-5 md:w-5" />
                    {t('Chat on WhatsApp', 'تواصل عبر واتساب')}
                  </a>
                </div>
              ) : (
                <div key={msg.id} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] px-3 py-2 md:px-3.5 md:py-2.5 rounded-2xl text-xs md:text-sm leading-relaxed ${
                    msg.isBot
                      ? 'bg-muted text-foreground rounded-tl-sm'
                      : 'bg-primary text-primary-foreground rounded-tr-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              )
            ))}

            {/* FAQ suggestions */}
            {searchMode && filteredFaqs.length > 0 && (
              <div className="space-y-1 md:space-y-1.5">
                <p className="text-[10px] md:text-xs text-muted-foreground font-medium px-1">
                  {t('Common Questions:', 'أسئلة شائعة:')}
                </p>
                {filteredFaqs.map(faq => (
                  <button
                    key={faq.id}
                    onClick={() => handleFaqClick(faq)}
                    className="w-full text-start px-2 md:px-3 py-1.5 md:py-2 rounded-lg bg-muted/50 hover:bg-muted text-xs md:text-sm text-foreground transition-colors border border-border/50 hover:border-border"
                  >
                    {language === 'en' ? faq.question_en : faq.question_ar}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-2 md:p-3 border-t border-border shrink-0">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => { setInput(e.target.value); setSearchMode(true); }}
                placeholder={t('Type your question...', 'اكتب سؤالك...')}
                className="flex-1 text-xs md:text-sm h-9 md:h-10"
              />
              <Button type="submit" size="icon" className="shrink-0 h-9 w-9 md:h-10 md:w-10">
                <Send className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
