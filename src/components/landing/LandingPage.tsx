import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Shield,
  Layers,
  Cpu,
  RefreshCw,
  Search,
  Users,
  BarChart3,
  FolderKanban,
  FileCheck,
  ChevronDown,
  X,
  Sparkles,
  ExternalLink,
  Code2,
  Copy,
  Check,
  Menu,
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onOpenDemoWorkspace?: () => void;
}

export function LandingPage({
  onGetStarted,
  onSignIn,
  onOpenDemoWorkspace,
}: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sampleReportModalOpen, setSampleReportModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [interactiveTab, setInteractiveTab] = useState<'sample' | 'breakdown'>('sample');

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCopyCode = () => {
    const code = `{
  "field_id": "SKILLS-LIST",
  "status": "FOUND",
  "value": "SQL, PostgreSQL, MongoDB, Python",
  "evidence": "Skills: SQL, PostgreSQL, MongoDB, Python, Docker"
}`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const faqs = [
    {
      question: 'Does the parser invent skills or candidate details?',
      answer:
        'The system follows an evidence-first approach. Information that cannot be supported by resume evidence should be reported as missing rather than invented.',
    },
    {
      question: 'What happens if the AI scorer is unavailable?',
      answer:
        'The independent ATS engine provides a fallback so screening can continue without depending entirely on AI availability.',
    },
    {
      question: 'What file formats are supported?',
      answer:
        'Supported formats depend on the implemented parser, with PDF and DOCX as the primary formats. Unsupported or unreadable files are rejected before screening.',
    },
    {
      question: 'Can I screen multiple resumes against one JD?',
      answer:
        'Yes. One job description can be used to screen multiple resumes and automatically rank the candidates.',
    },
    {
      question: 'Can I see why a candidate matched?',
      answer:
        'Yes. Results can display matched requirements, missing requirements and supporting evidence.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 font-sans antialiased selection:bg-teal-500 selection:text-white">
      {/* 1. NAVIGATION BAR */}
      <header className="sticky top-0 z-50 bg-[#0B0F17]/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center shadow-md shadow-teal-500/10">
              <FileCheck className="w-5 h-5 text-white stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-lg text-white tracking-tight leading-none">
                Resume Parser Agent
              </span>
              <span className="text-[11px] text-teal-400 font-medium tracking-wide uppercase mt-1">
                Evidence-First ATS
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('product')}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Product
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('docs')}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Docs
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={onSignIn}
              className="text-sm font-medium text-slate-200 hover:text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="inline-flex items-center justify-center text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 px-5 py-2.5 rounded-lg shadow-sm hover:shadow-teal-500/20 transition-all cursor-pointer whitespace-nowrap"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Hamburger Menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0B0F17] border-b border-slate-800 px-4 pt-3 pb-6 space-y-3">
            <button
              onClick={() => scrollToSection('product')}
              className="block w-full text-left py-2 text-base font-medium text-slate-200 hover:text-white"
            >
              Product
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="block w-full text-left py-2 text-base font-medium text-slate-200 hover:text-white"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left py-2 text-base font-medium text-slate-200 hover:text-white"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('docs')}
              className="block w-full text-left py-2 text-base font-medium text-slate-200 hover:text-white"
            >
              Docs
            </button>
            <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSignIn();
                }}
                className="w-full text-center py-2.5 text-sm font-medium text-slate-300 bg-slate-900 rounded-lg border border-slate-800"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onGetStarted();
                }}
                className="w-full text-center py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden bg-[#0B0F17] pt-16 pb-24 lg:pt-24 lg:pb-36 border-b border-slate-800/60">
        {/* Background Image with Dark Overlay & Cinematic Texture */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2000&q=80"
            alt="Recruiting professionals collaborating in modern office"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F17]/80 via-[#0B0F17]/95 to-[#0B0F17]" />
          {/* Subtle architectural grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            <span>EVIDENCE-FIRST RESUME SCREENING</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.15] mb-6">
            Resume Screening You Can{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-teal-200 to-indigo-300">
              Actually Verify
            </span>
          </h1>

          {/* Subheadline */}
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-300 leading-relaxed mb-10">
            Every match backed by real evidence — not a black-box AI score.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button
              onClick={onOpenDemoWorkspace || onGetStarted}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 text-base font-semibold text-white bg-teal-600 hover:bg-teal-500 px-8 py-3.5 rounded-xl shadow-lg shadow-teal-900/30 transition-all cursor-pointer"
            >
              <span>Try the Free Demo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSampleReportModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-semibold text-slate-200 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 px-8 py-3.5 rounded-xl transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-teal-400" />
              <span>View Sample Report</span>
            </button>
          </div>

          {/* Trust Line */}
          <div className="pt-6 border-t border-slate-800/80 max-w-xl mx-auto">
            <p className="text-xs sm:text-sm text-slate-400 font-medium tracking-wide">
              Evidence-first • ATS + Agentic Analysis • Built for Screening at Scale
            </p>
          </div>
        </div>

        {/* 3. HERO PRODUCT PREVIEW (Floating SaaS Table Card) */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl shadow-black/60 overflow-hidden">
            {/* Mock Window Header */}
            <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-950/70 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs text-slate-500 font-mono ml-2 hidden sm:inline">
                  workspace/job-session-709
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  Senior AI Engineer
                </span>
                <span className="text-xs text-slate-400 font-medium bg-slate-800 px-2.5 py-1 rounded">
                  127 Candidates
                </span>
              </div>
            </div>

            {/* Candidate Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 bg-slate-950/40">
                    <th className="py-3.5 px-6">#</th>
                    <th className="py-3.5 px-6">Candidate</th>
                    <th className="py-3.5 px-6 text-center">ATS</th>
                    <th className="py-3.5 px-6 text-center">AI</th>
                    <th className="py-3.5 px-6 text-center">Overall</th>
                    <th className="py-3.5 px-6 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {/* Candidate 1 */}
                  <tr className="bg-teal-500/[0.04] hover:bg-teal-500/[0.08] transition-colors">
                    <td className="py-4 px-6 font-bold text-teal-400">1</td>
                    <td className="py-4 px-6 font-sans">
                      <div className="font-semibold text-white text-sm">Alex Johnson</div>
                      <div className="text-slate-400 text-xs font-mono">Stanford • 7 yrs exp</div>
                    </td>
                    <td className="py-4 px-6 text-center text-slate-300 font-bold text-sm">94</td>
                    <td className="py-4 px-6 text-center text-slate-300 font-bold text-sm">96</td>
                    <td className="py-4 px-6 text-center font-bold text-teal-300 text-base">95.2</td>
                    <td className="py-4 px-6 text-right font-sans">
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>100% Grounded</span>
                      </span>
                    </td>
                  </tr>

                  {/* Candidate 2 */}
                  <tr className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 text-slate-400">2</td>
                    <td className="py-4 px-6 font-sans">
                      <div className="font-semibold text-slate-200 text-sm">Priya Sharma</div>
                      <div className="text-slate-400 text-xs font-mono">CMU • 6 yrs exp</div>
                    </td>
                    <td className="py-4 px-6 text-center text-slate-300 font-medium">91</td>
                    <td className="py-4 px-6 text-center text-slate-300 font-medium">92</td>
                    <td className="py-4 px-6 text-center font-bold text-slate-100 text-sm">91.6</td>
                    <td className="py-4 px-6 text-right font-sans">
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>100% Grounded</span>
                      </span>
                    </td>
                  </tr>

                  {/* Candidate 3 */}
                  <tr className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 text-slate-400">3</td>
                    <td className="py-4 px-6 font-sans">
                      <div className="font-semibold text-slate-200 text-sm">Daniel Lee</div>
                      <div className="text-slate-400 text-xs font-mono">MIT • 5 yrs exp</div>
                    </td>
                    <td className="py-4 px-6 text-center text-slate-300 font-medium">88</td>
                    <td className="py-4 px-6 text-center text-slate-300 font-medium">90</td>
                    <td className="py-4 px-6 text-center font-bold text-slate-100 text-sm">89.2</td>
                    <td className="py-4 px-6 text-right font-sans">
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>100% Grounded</span>
                      </span>
                    </td>
                  </tr>

                  {/* Candidate 4 */}
                  <tr className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 text-slate-400">4</td>
                    <td className="py-4 px-6 font-sans">
                      <div className="font-semibold text-slate-200 text-sm">Sarah Williams</div>
                      <div className="text-slate-400 text-xs font-mono">UC Berkeley • 4 yrs exp</div>
                    </td>
                    <td className="py-4 px-6 text-center text-slate-300 font-medium">84</td>
                    <td className="py-4 px-6 text-center text-slate-300 font-medium">86</td>
                    <td className="py-4 px-6 text-center font-bold text-slate-100 text-sm">85.2</td>
                    <td className="py-4 px-6 text-right font-sans">
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>100% Grounded</span>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Micro Footer inside Preview */}
            <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Showing Top 4 of 127 Verified Candidates</span>
              <span className="text-teal-400 font-medium">Deterministic Ranking Formula: 40% ATS + 60% Agentic</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. VALUE PROPOSITION SECTION */}
      <section id="product" className="bg-white text-slate-900 py-20 lg:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow */}
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-teal-700 mb-4">
            THE EVIDENCE-FIRST APPROACH
          </span>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight mb-8">
            The Parsing Engine Built for Hiring Decisions You Can Defend
          </h2>

          {/* Paragraph */}
          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto mb-16">
            Resume Parser Agent extracts candidate data with a deterministic, evidence-linked
            parser — every field is traceable back to the exact evidence it came from. Matching
            against a job description combines fast ATS analysis with grounded AI reasoning and an
            automatic fallback, so results don't depend on a single point of failure.
          </p>

          {/* Three Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center mb-6 shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Evidence First</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Every important result is traceable.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-6 shadow-sm">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">ATS + AI</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Deterministic matching plus intelligent analysis.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-6 shadow-sm">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Reliable Fallback</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Screening continues when AI is unavailable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. THREE BENEFIT CARDS SECTION */}
      <section className="relative py-24 bg-[#0F172A] border-y border-slate-800">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=2000&q=80"
            alt="Hiring committee reviewing candidate evaluations"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-10"
          />
          <div className="absolute inset-0 bg-slate-950/85" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Why Teams Trust Resume Parser Agent
            </h2>
          </div>

          {/* Three White Benefit Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-100 flex flex-col">
              <div className="h-48 overflow-hidden bg-slate-100 relative">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=80"
                  alt="Recruiters reviewing a resume together"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-8 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    Extract Data You Can Trace
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Every extracted field — name, skills, education, experience, projects and more
                    — is linked to supporting resume evidence. If information cannot be found, the
                    system reports it as missing instead of inventing it.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-100 flex flex-col">
              <div className="h-48 overflow-hidden bg-slate-100 relative">
                <img
                  src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1000&q=80"
                  alt="Recruiter reviewing candidate results on laptop"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-8 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    Screen Faster Without the Guesswork
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Requirements are matched using deterministic ATS analysis and grounded AI
                    reasoning. When AI processing is unavailable, a reliable fallback keeps
                    screening moving.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-100 flex flex-col">
              <div className="h-48 overflow-hidden bg-slate-100 relative">
                <img
                  src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1000&q=80"
                  alt="Hiring team reviewing candidate results"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-8 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    Built to Integrate. Built to Audit.
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Structured candidate profiles, scores, rankings and evidence make screening
                    results easier to inspect, understand and defend.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="bg-white text-slate-900 py-24 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-700 mb-3 inline-block">
              WORKFLOW
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              From Resume to Ranked Candidate
            </h2>
          </div>

          {/* Connected Timeline: Desktop 6 Columns / Mobile Vertical */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 relative">
            {/* Step 1 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between hover:border-teal-500/50 transition-colors">
              <div>
                <span className="text-xs font-mono font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
                  01 — Upload
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-4 mb-2">Upload</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Upload a job description and one or multiple resumes.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between hover:border-teal-500/50 transition-colors">
              <div>
                <span className="text-xs font-mono font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
                  02 — Extract
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-4 mb-2">Extract</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Extract structured candidate information.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between hover:border-teal-500/50 transition-colors">
              <div>
                <span className="text-xs font-mono font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
                  03 — Validate
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-4 mb-2">Validate</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Reject unsupported, corrupted or insufficient inputs.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between hover:border-teal-500/50 transition-colors">
              <div>
                <span className="text-xs font-mono font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
                  04 — Match
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-4 mb-2">Match</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Compare candidate information against job requirements.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between hover:border-teal-500/50 transition-colors">
              <div>
                <span className="text-xs font-mono font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
                  05 — Analyze
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-4 mb-2">Analyze</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Generate evidence-grounded AI analysis.
                </p>
              </div>
            </div>

            {/* Step 6 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between hover:border-teal-500/50 transition-colors">
              <div>
                <span className="text-xs font-mono font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
                  06 — Rank
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-4 mb-2">Rank</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Calculate the comprehensive score and rank candidates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. VALIDATION SECTION */}
      <section className="py-24 bg-[#0B0F17] text-white border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-400 mb-3 inline-block">
              INPUT INTEGRITY
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Bad Input Shouldn't Become a Bad Hiring Decision
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">
              Resume Parser Agent validates resumes and job descriptions before screening begins.
              Unsupported files, corrupted documents, empty resumes, unreadable documents and
              insufficiently informative job descriptions are rejected before expensive analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Input Validation Card (Ready Status) */}
            <div className="bg-slate-900/90 rounded-2xl p-8 border border-slate-800 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                    INPUT VALIDATION
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                    PASSED
                  </span>
                </div>

                {/* Resume checks */}
                <div className="mb-6">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wide block mb-2">
                    Resume
                  </span>
                  <ul className="space-y-2 text-sm text-slate-300 font-mono">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>PDF detected</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>Text extracted</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>Candidate information found</span>
                    </li>
                  </ul>
                </div>

                {/* JD checks */}
                <div className="mb-6">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wide block mb-2">
                    Job Description
                  </span>
                  <ul className="space-y-2 text-sm text-slate-300 font-mono">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>Job title detected</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>Required skills detected</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>Responsibilities detected</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">STATUS</span>
                <span className="text-xs font-bold text-teal-400 bg-teal-950/60 border border-teal-800/60 px-3 py-1 rounded">
                  READY FOR SCREENING
                </span>
              </div>
            </div>

            {/* Rejected Example Card */}
            <div className="bg-slate-900/90 rounded-2xl p-8 border border-rose-900/40 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                  <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">
                    RESUME REJECTED
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-rose-950/60 text-rose-400 border border-rose-800/60">
                    BLOCKED
                  </span>
                </div>

                <div className="py-6">
                  <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">Insufficient Information</h4>
                  <p className="text-slate-300 text-sm leading-relaxed mb-6">
                    This file does not contain enough information for reliable screening.
                  </p>
                </div>
              </div>

              <button
                onClick={onOpenDemoWorkspace || onGetStarted}
                className="w-full text-center py-2.5 px-4 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                [ Upload Another Resume ]
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. EVIDENCE-FIRST SECTION */}
      <section className="bg-white text-slate-900 py-24 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* UI Card Left */}
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 shadow-md">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Requirement Verification
                </span>
                <span className="text-xs font-semibold text-teal-700 bg-teal-100 px-2.5 py-1 rounded-full">
                  Verified In Resume
                </span>
              </div>

              {/* Requirement Match Block */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                    <span className="text-xl font-bold text-slate-900">Python</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full">
                    MATCHED
                  </span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Evidence
                  </span>
                  <p className="text-slate-800 font-mono text-sm leading-relaxed">
                    "Built production ML services using Python..."
                  </p>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Source: Experience Section • Page 1</span>
                    <span>Confidence: 100%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Text Right */}
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-teal-700 mb-3 inline-block">
                EVIDENCE-FIRST
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-6">
                Screen With{' '}
                <span className="text-teal-600 underline decoration-teal-300 decoration-2 underline-offset-4">
                  Evidence
                </span>
                , Not Assumptions
              </h2>
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-6">
                Resume Parser Agent connects extracted candidate information to the evidence found in
                the resume. Reviewers can understand why a requirement matched, why it was
                considered missing, and what information supports the conclusion.
              </p>
              <div className="flex items-center gap-4 text-sm font-semibold text-slate-900">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Exact Quote Attribution</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Zero Hallucinations</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. ATS + AGENTIC ANALYSIS SECTION */}
      <section className="bg-slate-50 text-slate-900 py-24 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text Left */}
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-700 mb-3 inline-block">
                DUAL ANALYSIS
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-6">
                Two Analysis Engines. One Clearer Decision.
              </h2>
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-8">
                A deterministic ATS engine handles exact, normalized and fuzzy requirement matching.
                Agentic analysis evaluates relevance, strengths, weaknesses and missing requirements
                using the extracted evidence.
              </p>

              {/* Formula Badge */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm inline-flex items-center gap-3 text-xs sm:text-sm font-mono font-medium text-slate-700">
                <span className="text-indigo-600 font-bold">40% ATS</span>
                <span>+</span>
                <span className="text-teal-600 font-bold">60% Agentic</span>
                <span>=</span>
                <span className="text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded">
                  Overall Score
                </span>
              </div>
            </div>

            {/* Product Visualization Right */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* ATS Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md text-center">
                <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wide block mb-2">
                  ATS SCORE
                </span>
                <span className="text-4xl font-bold text-indigo-600 font-mono">94%</span>
                <span className="text-[11px] text-slate-400 block mt-2 font-mono">
                  Deterministic Match
                </span>
              </div>

              {/* Agentic Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md text-center">
                <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wide block mb-2">
                  AGENTIC SCORE
                </span>
                <span className="text-4xl font-bold text-teal-600 font-mono">96%</span>
                <span className="text-[11px] text-slate-400 block mt-2 font-mono">
                  Grounded AI Reasoning
                </span>
              </div>

              {/* Comprehensive Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-lg text-center sm:scale-105 border border-slate-700">
                <span className="text-xs font-mono font-bold text-teal-400 uppercase tracking-wide block mb-2">
                  COMPREHENSIVE
                </span>
                <span className="text-4xl font-bold text-white font-mono">95.2%</span>
                <span className="text-[11px] text-slate-300 block mt-2 font-mono">
                  Final Synthesis
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. AI FALLBACK SECTION */}
      <section className="bg-[#0B0F17] text-white py-24 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-400 mb-3 inline-block">
              FAULT TOLERANCE
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              AI Failure Shouldn't Stop Screening
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">
              OpenRouter-powered analysis provides intelligent candidate evaluation, while an
              independent ATS engine provides a reliable fallback when AI processing is
              unavailable.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Visual Flow Diagram */}
            <div className="bg-slate-900/80 p-8 rounded-2xl border border-slate-800 shadow-xl font-mono text-sm text-slate-200">
              <div className="text-xs text-slate-500 mb-4 uppercase tracking-widest">
                EXECUTION FLOW DIAGRAM
              </div>
              <div className="space-y-4">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center font-bold text-white">
                  Uploaded Resume
                </div>
                <div className="flex justify-center text-slate-500">↓</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-indigo-950/40 border border-indigo-800/60 rounded-lg text-center text-indigo-300">
                    ATS Engine (Zero LLM)
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center text-slate-400">
                    OpenRouter Agent
                  </div>
                </div>
                <div className="flex justify-center text-slate-500">↓</div>
                <div className="p-3 bg-teal-950/40 border border-teal-800/60 rounded-lg text-center font-bold text-teal-300">
                  Final Analysis & Ranking
                </div>
              </div>
            </div>

            {/* Fallback Status Card */}
            <div className="bg-slate-900/80 p-8 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    AI Analysis
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-950/60 text-amber-400 border border-amber-800/60">
                    Unavailable
                  </span>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    Fallback
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-indigo-950/60 text-indigo-400 border border-indigo-800/60">
                    ATS Analysis
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">STATUS</span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded">
                    SCREENING CONTINUES
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. BATCH SCREENING SECTION */}
      <section className="bg-white text-slate-900 py-24 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-700 mb-3 inline-block">
              SCREEN AT SCALE
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">
              One JD. Hundreds of Resumes. One Ranked List.
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              Create one screening session with a job description and multiple resumes. Each
              candidate is analyzed independently, scored consistently and automatically ranked
              from strongest match to weakest.
            </p>
          </div>

          {/* Batch Preview Table */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-white">Senior AI Engineer</span>
                <span className="text-xs font-mono text-teal-400 bg-teal-950/60 border border-teal-800/60 px-2 py-0.5 rounded">
                  127 Candidates
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">Ranked by Fit</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 bg-slate-950/40">
                    <th className="py-3 px-6">#</th>
                    <th className="py-3 px-6 font-sans">Candidate</th>
                    <th className="py-3 px-6 text-center">ATS</th>
                    <th className="py-3 px-6 text-center">AI</th>
                    <th className="py-3 px-6 text-center">Overall</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs text-slate-200">
                  {/* Top Candidate (Highlighted) */}
                  <tr className="bg-teal-950/40 border-l-4 border-teal-500">
                    <td className="py-3.5 px-6 font-bold text-teal-400">1</td>
                    <td className="py-3.5 px-6 font-sans font-bold text-white">Alex Johnson</td>
                    <td className="py-3.5 px-6 text-center text-slate-300">94</td>
                    <td className="py-3.5 px-6 text-center text-slate-300">96</td>
                    <td className="py-3.5 px-6 text-center font-bold text-teal-300 text-sm">95.2</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 text-slate-400">2</td>
                    <td className="py-3.5 px-6 font-sans text-slate-200">Priya Sharma</td>
                    <td className="py-3.5 px-6 text-center text-slate-300">91</td>
                    <td className="py-3.5 px-6 text-center text-slate-300">92</td>
                    <td className="py-3.5 px-6 text-center font-bold text-slate-100">91.6</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 text-slate-400">3</td>
                    <td className="py-3.5 px-6 font-sans text-slate-200">Daniel Lee</td>
                    <td className="py-3.5 px-6 text-center text-slate-300">88</td>
                    <td className="py-3.5 px-6 text-center text-slate-300">90</td>
                    <td className="py-3.5 px-6 text-center font-bold text-slate-100">89.2</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 text-slate-400">4</td>
                    <td className="py-3.5 px-6 font-sans text-slate-200">Sarah Williams</td>
                    <td className="py-3.5 px-6 text-center text-slate-300">84</td>
                    <td className="py-3.5 px-6 text-center text-slate-300">86</td>
                    <td className="py-3.5 px-6 text-center font-bold text-slate-100">85.2</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 text-slate-400">5</td>
                    <td className="py-3.5 px-6 font-sans text-slate-200">Michael Brown</td>
                    <td className="py-3.5 px-6 text-center text-slate-300">78</td>
                    <td className="py-3.5 px-6 text-center text-slate-300">81</td>
                    <td className="py-3.5 px-6 text-center font-bold text-slate-100">79.8</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 12. SAMPLE OUTPUT SECTION */}
      <section id="docs" className="bg-[#0B0F17] text-white py-24 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-400 mb-3 inline-block">
              STRUCTURED OUTPUT
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Every Field. Every Match. Fully Traceable.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Code Block Left */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden font-mono text-xs">
              <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-slate-400">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-teal-400" />
                  <span>extracted_evidence.json</span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer text-xs"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-6 text-slate-200 leading-relaxed overflow-x-auto">
                <code>{`{
  "field_id": "SKILLS-LIST",
  "status": "FOUND",
  "value": "SQL, PostgreSQL, MongoDB, Python",
  "evidence": "Skills: SQL, PostgreSQL, MongoDB, Python, Docker"
}`}</code>
              </pre>
            </div>

            {/* Requirement Match Card Right */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">
                  VERIFIED REQUIREMENT
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-mono text-slate-400">Requirement</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xl font-bold text-white">Python</span>
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded">
                        MATCHED
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300">
                    <span className="text-[11px] text-slate-500 block mb-1">Evidence</span>
                    "Developed machine learning applications using Python..."
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 13. FEATURE GRID SECTION */}
      <section id="features" className="bg-white text-slate-900 py-24 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-700 mb-3 inline-block">
              CAPABILITIES
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Everything You Need to Screen Candidates
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-500/50 transition-colors">
              <FileText className="w-7 h-7 text-teal-600 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">PDF & DOCX Parsing</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Extract structured candidate information.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-500/50 transition-colors">
              <CheckCircle2 className="w-7 h-7 text-teal-600 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Evidence Extraction</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Connect fields to supporting evidence.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-500/50 transition-colors">
              <Search className="w-7 h-7 text-teal-600 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">JD Analysis</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Identify job requirements.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-500/50 transition-colors">
              <Layers className="w-7 h-7 text-indigo-600 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">ATS Matching</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Deterministic requirement matching.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-500/50 transition-colors">
              <Cpu className="w-7 h-7 text-indigo-600 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Agentic Analysis</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Evaluate candidate relevance.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-500/50 transition-colors">
              <Users className="w-7 h-7 text-indigo-600 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Batch Screening</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Screen multiple resumes against one JD.
              </p>
            </div>

            {/* Feature 7 */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-500/50 transition-colors">
              <BarChart3 className="w-7 h-7 text-emerald-600 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Candidate Ranking</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Automatically rank candidates.
              </p>
            </div>

            {/* Feature 8 */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-500/50 transition-colors">
              <FolderKanban className="w-7 h-7 text-emerald-600 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">JD Workspaces</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Organize candidates by job description.
              </p>
            </div>

            {/* Feature 9 */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-500/50 transition-colors">
              <FileCheck className="w-7 h-7 text-emerald-600 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Evidence-Backed Reports</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Understand why candidates received their scores.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 14. TRUST PHILOSOPHY SECTION */}
      <section className="bg-[#0B0F17] text-white py-28 border-b border-slate-800 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-6">
            Better Hiring Decisions Start With Better Evidence.
          </h2>
          <p className="text-lg sm:text-xl text-slate-300 mb-14 max-w-2xl mx-auto">
            AI can accelerate screening. Evidence makes the result understandable.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-800 max-w-2xl mx-auto">
            <div className="text-2xl font-extrabold tracking-widest text-teal-400 font-mono">
              TRACEABLE
            </div>
            <div className="text-2xl font-extrabold tracking-widest text-indigo-400 font-mono">
              CONSISTENT
            </div>
            <div className="text-2xl font-extrabold tracking-widest text-emerald-400 font-mono">
              EXPLAINABLE
            </div>
          </div>
        </div>
      </section>

      {/* 15. FAQ SECTION */}
      <section className="bg-white text-slate-900 py-24 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-700 mb-3 inline-block">
              QUESTIONS & ANSWERS
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {faqs.map((faq, index) => (
              <div key={index} className="py-6">
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="flex w-full items-center justify-between text-left focus:outline-none cursor-pointer group"
                >
                  <span className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0 ${
                      activeFaq === index ? 'rotate-180 text-teal-600' : ''
                    }`}
                  />
                </button>
                {activeFaq === index && (
                  <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed animate-in fade-in duration-200">
                    {faq.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 16. FINAL CTA SECTION */}
      <section className="relative overflow-hidden bg-[#0B0F17] text-white py-28 border-b border-slate-800">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2000&q=80"
            alt="Modern architectural office workspace"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F17] via-[#0B0F17]/90 to-[#0B0F17]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-6">
            Make Resume Screening More Defensible
          </h2>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10">
            Parse. Match. Analyze. Rank — with evidence behind every decision.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 text-base font-semibold text-white bg-teal-600 hover:bg-teal-500 px-8 py-4 rounded-xl shadow-lg shadow-teal-900/40 transition-all cursor-pointer"
            >
              <span>Start Screening</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSampleReportModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-semibold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 px-8 py-4 rounded-xl transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-teal-400" />
              <span>View Sample Report</span>
            </button>
          </div>
        </div>
      </section>

      {/* 17. FOOTER */}
      <footer className="bg-[#070A0F] text-slate-400 py-16 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Brand column */}
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
                  <FileCheck className="w-4 h-4 text-white stroke-[2.2]" />
                </div>
                <span className="font-semibold text-white text-base tracking-tight">
                  Resume Parser Agent
                </span>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed max-w-sm">
                Evidence-first AI resume screening and candidate ranking engine with deterministic ATS analysis and grounded agentic reasoning.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold text-slate-200 mb-4 text-xs uppercase tracking-wider">
                Product
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors cursor-pointer">Features</button></li>
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors cursor-pointer">Screening</button></li>
                <li><button onClick={() => scrollToSection('product')} className="hover:text-white transition-colors cursor-pointer">Ranking</button></li>
                <li><button onClick={() => setSampleReportModalOpen(true)} className="hover:text-white transition-colors cursor-pointer">Reports</button></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold text-slate-200 mb-4 text-xs uppercase tracking-wider">
                Resources
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li><button onClick={() => scrollToSection('docs')} className="hover:text-white transition-colors cursor-pointer">Docs</button></li>
                <li><button onClick={() => scrollToSection('docs')} className="hover:text-white transition-colors cursor-pointer">API</button></li>
                <li><button onClick={() => setSampleReportModalOpen(true)} className="hover:text-white transition-colors cursor-pointer">Sample Report</button></li>
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors cursor-pointer">FAQ</button></li>
              </ul>
            </div>

            {/* Company & Legal */}
            <div>
              <h4 className="font-semibold text-slate-200 mb-4 text-xs uppercase tracking-wider">
                Company
              </h4>
              <ul className="space-y-2.5 text-xs mb-6">
                <li><span className="hover:text-white transition-colors cursor-pointer">About</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Contact</span></li>
              </ul>

              <h4 className="font-semibold text-slate-200 mb-4 text-xs uppercase tracking-wider">
                Legal
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li><span className="hover:text-white transition-colors cursor-pointer">Privacy</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Terms</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <span>© Resume Parser Agent</span>
            <span className="font-mono text-[11px]">Intelligent screening. Deterministic ATS. Evidence-backed analysis.</span>
          </div>
        </div>
      </footer>

      {/* SAMPLE REPORT MODAL */}
      {sampleReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <FileCheck className="w-5 h-5 text-teal-400" />
                <div>
                  <h3 className="font-bold text-white text-base">Verified Candidate Fit Report</h3>
                  <span className="text-xs text-slate-400 font-mono">Alex Johnson • Senior AI Engineer</span>
                </div>
              </div>
              <button
                onClick={() => setSampleReportModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-200">
              {/* Score Header */}
              <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono">
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase">ATS Score</span>
                  <span className="text-2xl font-bold text-indigo-400">94%</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase">Agentic Score</span>
                  <span className="text-2xl font-bold text-teal-400">96%</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase">Comprehensive</span>
                  <span className="text-2xl font-bold text-white">95.2%</span>
                </div>
              </div>

              {/* Grounded Evidence Breakdown */}
              <div className="space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider font-mono">
                  Verified Requirements & Evidence Quotes
                </h4>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">1. Python & FastAPI Backend Services</span>
                    <span className="text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      MATCHED (100%)
                    </span>
                  </div>
                  <p className="text-slate-300 italic pl-3 border-l-2 border-teal-500">
                    "Architected high-throughput microservices using Python FastAPI and PostgreSQL, serving 50M requests daily."
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">2. Kubernetes & Docker Orchestration</span>
                    <span className="text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      MATCHED (100%)
                    </span>
                  </div>
                  <p className="text-slate-300 italic pl-3 border-l-2 border-teal-500">
                    "Containerized legacy applications with Docker and deployed them to Kubernetes on AWS EKS with Terraform."
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">3. Distributed Ingestion & Caching</span>
                    <span className="text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      MATCHED (100%)
                    </span>
                  </div>
                  <p className="text-slate-300 italic pl-3 border-l-2 border-teal-500">
                    "Built low-latency caching infrastructure using Redis and PostgreSQL, handling 100k req/sec."
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-3">
              <button
                onClick={() => setSampleReportModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-lg"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  setSampleReportModalOpen(false);
                  onGetStarted();
                }}
                className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-sm"
              >
                Start Live Screening
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
