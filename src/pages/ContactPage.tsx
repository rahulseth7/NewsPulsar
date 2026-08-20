import React, { useState } from 'react';
import { 
  Mail, 
  Send, 
  ArrowLeft, 
  CheckCircle2, 
  HelpCircle, 
  ShieldCheck, 
  MessageSquare, 
  Clock, 
  Globe, 
  ChevronDown, 
  ChevronUp, 
  FileText,
  AlertCircle,
  Copy,
  ExternalLink
} from 'lucide-react';

interface ContactPageProps {
  onBackToNews: () => void;
  onNavigatePage: (page: 'about' | 'advertise' | 'contact' | 'privacy' | 'dashboard') => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({
  onBackToNews,
  onNavigatePage
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'Editorial Feedback',
    priority: 'Normal',
    subject: '',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(false);

  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    const ref = 'NP-TICK-' + Math.floor(100000 + Math.random() * 900000);
    setTicketId(ref);
    setSubmitted(true);
  };

  const handleCopyEmail = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText('fciuttarakhand@gmail.com');
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const faqs = [
    {
      q: 'How frequently are news articles updated on News Pulsar?',
      a: 'Our server-side ingestion engine executes continuous polling across 30+ international RSS and XML news wire feeds every 10 minutes. Live stories are immediately processed, deduplicated, and enriched with AI tags and summaries.'
    },
    {
      q: 'How does the Gemini AI Summarization work?',
      a: 'When an article is parsed, our backend passes the headline, source, and raw content excerpt to Gemini 3.7 Flash. The model generates a one-line digest, three objective bullet points, and key takeaways under strict journalistic neutrality prompts.'
    },
    {
      q: 'Can publishers submit their RSS feeds for inclusion?',
      a: 'Yes! We welcome verified journalistic, educational, and scientific publication feeds. Submit your RSS/XML feed endpoint via this contact form or via the Admin Dashboard "Add RSS Source" interface.'
    },
    {
      q: 'How do I submit a DMCA takedown or correction request?',
      a: 'We respect intellectual property rights. If you are a copyright owner or authorized representative requesting feed removal or snippet modification, select "DMCA & Copyright" in the form below with the relevant article URL and verification details.'
    },
    {
      q: 'Is News Pulsar compliant with Google AdSense and /ads.txt?',
      a: 'Yes. News Pulsar maintains full compliance with Google Publisher Policies, Better Ads Standards, and hosts an active /ads.txt file identifying publisher ID ca-pub-6411773855584982.'
    }
  ];

  return (
    <div className="w-full bg-[#faf7ee] text-black font-neo pb-16 min-h-screen">
      {/* 1. Breadcrumb Bar */}
      <div className="bg-[#ffe600] border-b-2 border-black py-2.5 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase">
            <button 
              onClick={onBackToNews}
              className="flex items-center gap-1.5 bg-black text-[#ccff00] px-3 py-1 border border-black hover:bg-zinc-800 transition-all cursor-pointer neo-shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Back to Live News</span>
            </button>
            <span className="text-black/40">/</span>
            <span className="bg-white px-2 py-0.5 border border-black">CONTACT &amp; EDITORIAL BOARD</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-10">

        {/* 2. Hero Header */}
        <div className="bg-white border-3 border-black p-6 sm:p-10 neo-shadow relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-black text-[#ccff00] text-xs font-mono font-black px-2.5 py-1 uppercase border border-black flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                EDITORIAL COMMUNICATIONS DESK
              </span>
              <span className="bg-[#00f0ff] text-black text-xs font-black px-2.5 py-1 border border-black uppercase">
                24/7 INQUIRY TRIAGE
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-black leading-tight uppercase">
              Get in Touch with Our Newsroom
            </h1>

            <p className="text-base sm:text-lg text-zinc-800 max-w-3xl leading-relaxed font-body">
              Whether you have a breaking news tip, editorial correction, advertising partnership inquiry, 
              or syndicated feed proposal, our editorial board is here to assist you.
            </p>
          </div>
        </div>

        {/* 3. Direct Contact Channels Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="bg-white border-2 border-black p-5 neo-shadow space-y-3">
            <div className="w-9 h-9 bg-[#ccff00] border-2 border-black flex items-center justify-center neo-shadow-sm">
              <Mail className="w-5 h-5 text-black" />
            </div>
            <div className="text-xs font-mono font-black uppercase text-zinc-600">Direct Email Wire</div>
            <div className="text-sm font-mono font-black text-black break-all">
              rahul.seth7@gmail.com
            </div>
            <button
              onClick={handleCopyEmail}
              className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#faf7ee] px-2 py-1 border border-black hover:bg-black hover:text-white transition-all cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>{copiedEmail ? 'COPIED TO CLIPBOARD' : 'COPY ADDRESS'}</span>
            </button>
          </div>

          <div className="bg-white border-2 border-black p-5 neo-shadow space-y-3">
            <div className="w-9 h-9 bg-[#00f0ff] border-2 border-black flex items-center justify-center neo-shadow-sm">
              <Clock className="w-5 h-5 text-black" />
            </div>
            <div className="text-xs font-mono font-black uppercase text-zinc-600">Response SLA</div>
            <div className="text-base font-black text-black">
              24–48 Business Hours
            </div>
            <p className="text-[11px] text-zinc-600 font-body">
              Urgent breaking story corrections prioritized within 2 hours.
            </p>
          </div>

          <div className="bg-white border-2 border-black p-5 neo-shadow space-y-3">
            <div className="w-9 h-9 bg-[#ff2a85] text-white border-2 border-black flex items-center justify-center neo-shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-xs font-mono font-black uppercase text-zinc-600">Legal &amp; Compliance</div>
            <div className="text-base font-black text-black">
              DMCA &amp; Ethics Desk
            </div>
            <p className="text-[11px] text-zinc-600 font-body">
              Prompt handling of syndication permissions and attribution.
            </p>
          </div>

        </div>

        {/* 4. Interactive Contact Form */}
        <div className="bg-white border-2 border-black p-6 sm:p-8 neo-shadow space-y-6">
          <div className="flex items-center justify-between pb-2 border-b-2 border-black">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-black" />
              <h2 className="text-xl font-black uppercase tracking-tight text-black">
                Send a Message to the Editorial Desk
              </h2>
            </div>
            <span className="text-xs font-mono font-bold bg-[#ccff00] px-2 py-0.5 border border-black">
              ONLINE
            </span>
          </div>

          {submitted ? (
            <div className="bg-[#ccff00]/40 border-2 border-black p-8 text-center space-y-3">
              <div className="w-12 h-12 bg-black text-[#ccff00] border-2 border-black mx-auto flex items-center justify-center neo-shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black uppercase text-black">
                Dispatch Transmitted Successfully
              </h3>
              <p className="text-sm text-zinc-800 max-w-md mx-auto font-body">
                Your message has been assigned Ticket ID: <strong className="font-mono bg-white px-2 py-0.5 border border-black">{ticketId}</strong>.
                Our editorial coordinator will respond to <strong>{formData.email}</strong> shortly.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-3 px-5 py-2 bg-black text-white text-xs font-black uppercase border-2 border-black cursor-pointer hover:bg-zinc-800"
              >
                Send Another Dispatch
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alexander Hamilton"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 bg-[#faf7ee] border-2 border-black text-xs font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. editor@publication.org"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 bg-[#faf7ee] border-2 border-black text-xs font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase">Department / Inquiry Category</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-2.5 bg-[#faf7ee] border-2 border-black text-xs font-bold"
                  >
                    <option value="Editorial Feedback">Editorial Feedback &amp; Suggestions</option>
                    <option value="Editorial Correction">Editorial Correction / Fact Check</option>
                    <option value="Advertising">Advertising &amp; AdSense Sponsorship</option>
                    <option value="RSS Feed Submission">RSS Feed Syndication Request</option>
                    <option value="DMCA & Copyright">DMCA &amp; Copyright Notice</option>
                    <option value="Technical Support">Technical Bug / Crawler Report</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase">Priority Level</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full p-2.5 bg-[#faf7ee] border-2 border-black text-xs font-bold"
                  >
                    <option value="Normal">Normal (Routine Dispatch)</option>
                    <option value="Urgent">Urgent (Breaking Fact Check / Legal)</option>
                    <option value="Low">Low (General Feedback)</option>
                  </select>
                </div>

              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase">Subject Line *</label>
                <input
                  type="text"
                  required
                  placeholder="Summary of your inquiry or story reference..."
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full p-2.5 bg-[#faf7ee] border-2 border-black text-xs font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase">Message Body *</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Provide complete details, story headlines, URLs, or feedback..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full p-2.5 bg-[#faf7ee] border-2 border-black text-xs font-bold resize-none"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-[#ccff00] text-black font-black text-xs uppercase border-2 border-black neo-shadow-sm hover:bg-black hover:text-[#ccff00] transition-all cursor-pointer flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Transmit Message to Newsroom</span>
              </button>
            </form>
          )}
        </div>

        {/* 5. Frequently Asked Questions (FAQ Accordion) */}
        <div className="bg-[#f0eae0] border-2 border-black p-6 sm:p-8 neo-shadow space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b-2 border-black">
            <HelpCircle className="w-5 h-5 text-black" />
            <h2 className="text-xl font-black uppercase tracking-tight text-black">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isExpanded = expandedFaq === index;
              return (
                <div key={index} className="bg-white border-2 border-black neo-shadow-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isExpanded ? null : index)}
                    className="w-full p-3.5 text-left flex items-center justify-between gap-3 font-black text-xs sm:text-sm uppercase cursor-pointer hover:bg-[#faf7ee] transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-black shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-black shrink-0" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="p-3.5 pt-0 text-xs sm:text-sm text-zinc-800 font-body leading-relaxed border-t border-zinc-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
