/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Database, 
  BarChart3, 
  History as HistoryIcon, 
  Zap, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  Layers, 
  FileBox, 
  Settings,
  ClipboardList,
  Sparkles,
  ArrowRight,
  Upload,
  FileSpreadsheet,
  Download,
  Trash2,
  Table as TableIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { MABEC_CATALOG, MabecItem } from './data/mabec-database';
import { matchSupplierDescription, MatchResult } from './services/geminiService';

export default function App() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [history, setHistory] = useState<MatchResult[]>([]);
  const [view, setView] = useState<'match' | 'catalog' | 'history' | 'import'>('match');
  const [catalog, setCatalog] = useState<MabecItem[]>(MABEC_CATALOG);
  const [importStatus, setImportStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history and catalog from local storage
  useEffect(() => {
    const savedHistory = localStorage.getItem('mabec_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const savedCatalog = localStorage.getItem('mabec_catalog_v2');
    if (savedCatalog) {
      setCatalog(JSON.parse(savedCatalog));
    }
  }, []);

  const handleMatch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    try {
      const lines = input.split('\n').filter(l => l.trim() !== '');
      const newResults: MatchResult[] = [];

      for (const line of lines) {
        // Pass the dynamic catalog to the matcher
        const res = await matchSupplierDescription(line, catalog);
        newResults.push(res);
      }

      setResults(newResults);
      
      const updatedHistory = [...newResults, ...history].slice(0, 50);
      setHistory(updatedHistory);
      localStorage.setItem('mabec_history', JSON.stringify(updatedHistory));
      
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          setImportStatus({ message: "Le fichier semble vide.", type: 'error' });
          return;
        }

        // Map the Excel data to our MabecItem interface
        // Expected headers: "Article", "Désignation article"
        const newCatalog: MabecItem[] = data.map((row: any) => ({
          article: row["Article"] || row["article"] || row["Code"] || "N/A",
          designation: row["Désignation article"] || row["designation"] || row["Description"] || "Sans description"
        }));

        setCatalog(newCatalog);
        localStorage.setItem('mabec_catalog_v2', JSON.stringify(newCatalog));
        setImportStatus({ message: `${newCatalog.length} articles importés avec succès.`, type: 'success' });
      } catch (err: any) {
        setImportStatus({ message: `Erreur d'import : ${err.message}`, type: 'error' });
      }
    };
    reader.readAsBinaryString(file);
  };

  const resetCatalog = () => {
    if (confirm("Voulez-vous restaurer le catalogue par défaut ?")) {
      setCatalog(MABEC_CATALOG);
      localStorage.removeItem('mabec_catalog_v2');
      setImportStatus({ message: "Catalogue par défaut restauré.", type: 'info' });
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 70) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
  };

  return (
    <div className="min-h-screen bg-stellantis-grey text-stellantis-blue font-sans selection:bg-stellantis-blue selection:text-white">
      {/* Sidebar / Navigation */}
      <nav className="fixed left-0 top-0 h-full w-16 md:w-64 border-r border-stellantis-blue/10 bg-white z-50 flex flex-col items-center md:items-stretch shadow-sm">
        <div className="p-6 border-b border-stellantis-blue/10 flex items-center gap-3">
          <div className="w-8 h-8 bg-stellantis-blue rounded flex items-center justify-center text-white">
            <Layers size={20} />
          </div>
          <span className="hidden md:block font-bold tracking-tighter text-lg uppercase">Stellantis Match</span>
        </div>

        <div className="flex-1 px-3 py-6 flex flex-col gap-2">
          <button 
            onClick={() => setView('match')}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${view === 'match' ? 'bg-stellantis-blue text-white shadow-md' : 'hover:bg-stellantis-blue/5 text-stellantis-blue/60 hover:text-stellantis-blue'}`}
          >
            <Zap size={20} />
            <span className="hidden md:block font-medium">Matching Assistant</span>
          </button>
          <button 
            onClick={() => setView('catalog')}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${view === 'catalog' ? 'bg-stellantis-blue text-white shadow-md' : 'hover:bg-stellantis-blue/5 text-stellantis-blue/60 hover:text-stellantis-blue'}`}
          >
            <Database size={20} />
            <span className="hidden md:block font-medium">Internal Catalog</span>
          </button>
          <button 
            onClick={() => setView('import')}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${view === 'import' ? 'bg-stellantis-blue text-white shadow-md' : 'hover:bg-stellantis-blue/5 text-stellantis-blue/60 hover:text-stellantis-blue'}`}
          >
            <Upload size={20} />
            <span className="hidden md:block font-medium">Import Data</span>
          </button>
          <button 
            onClick={() => setView('history')}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${view === 'history' ? 'bg-stellantis-blue text-white shadow-md' : 'hover:bg-stellantis-blue/5 text-stellantis-blue/60 hover:text-stellantis-blue'}`}
          >
            <HistoryIcon size={20} />
            <span className="hidden md:block font-medium">History</span>
          </button>
        </div>

        <div className="p-4 border-t border-stellantis-blue/10 space-y-4">
          <div className="hidden md:block p-4 bg-stellantis-blue/5 rounded-xl border border-stellantis-blue/10">
            <h4 className="text-[10px] font-bold text-stellantis-blue/40 uppercase tracking-widest mb-2">Powered by</h4>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles size={14} className="text-stellantis-blue" />
              <span>Gemini 1.5 Flash AI</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2 text-stellantis-blue/30 cursor-not-allowed">
            <Settings size={20} />
            <span className="hidden md:block text-sm font-medium">Settings</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="ml-16 md:ml-64 p-4 md:p-8 min-h-screen">
        <header className="mb-12">
          <div className="flex items-center gap-2 text-xs font-bold text-stellantis-blue/40 uppercase tracking-[0.2em] mb-4">
            <BarChart3 size={14} />
            <span>Industrial Procurement Systems</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none mb-4 uppercase">
            {view === 'import' ? 'Maintain Your Database.' : 'Automate Your Internal Coding.'}
          </h1>
          <p className="max-w-xl text-stellantis-blue/60 leading-relaxed font-light">
            {view === 'import' 
              ? 'Importez vos propres fichiers Excel pour mettre à jour le catalogue de référence utilisé par l\'IA Stellantis.'
              : 'Transform ambiguous supplier strings into verified MABEC codes using our technical AI engine optimized for automotive standards.'}
          </p>
        </header>

        <AnimatePresence mode="wait">
          {view === 'match' && (
            <motion.div 
              key="match"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Input Area */}
              <div className="bg-stellantis-blue p-1 rounded-2xl shadow-2xl">
                <form onSubmit={handleMatch} className="bg-white rounded-[14px] overflow-hidden">
                  <div className="p-4 border-b border-stellantis-blue/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse opacity-75" />
                      <span className="text-[10px] uppercase font-bold tracking-widest text-stellantis-blue/50">
                        Operational System | {catalog.length} references
                      </span>
                    </div>
                    <div className="flex gap-2">
                       <button 
                        type="button" 
                        onClick={() => setInput('Bouton bleu\nDistributeur 3/2\nSonde de température G1/2 0-50 deg\nBush flanged')}
                        className="text-[10px] uppercase font-bold tracking-widest text-stellantis-blue hover:bg-stellantis-blue hover:text-white px-2 py-1 rounded transition-colors border border-stellantis-blue"
                      >
                        Try Samples
                      </button>
                    </div>
                  </div>
                  <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter supplier descriptions... (one per line for batch mode)"
                    className="w-full h-40 p-6 bg-transparent border-none focus:ring-0 text-xl font-mono placeholder:text-stellantis-blue/20 resize-none"
                    disabled={loading}
                  />
                  <div className="p-4 bg-stellantis-grey flex justify-end gap-4 items-center">
                    <p className="text-xs text-stellantis-blue/40 font-medium font-sans">
                      Shift + Enter for new line
                    </p>
                    <button 
                      type="submit"
                      disabled={loading || !input.trim()}
                      className="group relative px-8 py-3 bg-stellantis-blue text-white rounded-lg font-bold overflow-hidden disabled:opacity-50 transition-all hover:shadow-lg active:scale-95"
                    >
                      <div className="flex items-center gap-2 transition-transform duration-300 group-hover:-translate-y-px">
                        {loading ? 'Processing...' : 'Execute Matcher'}
                        <ArrowRight size={18} />
                      </div>
                      <div className="absolute right-0 top-0 h-full w-0 bg-stellantis-light-blue transition-all duration-300 group-hover:w-2" />
                    </button>
                  </div>
                </form>
              </div>

              {/* Results Section */}
              {results.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-stellantis-blue pb-4">
                    <h3 className="font-bold text-2xl uppercase tracking-tight">Technical Analysis Summary</h3>
                    <button 
                      onClick={() => setResults([])}
                      className="text-xs font-bold uppercase tracking-widest text-stellantis-blue/40 hover:text-stellantis-blue"
                    >
                      Discard
                    </button>
                  </div>

                  <div className="grid gap-6">
                    {results.map((res, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className="group grid grid-cols-1 lg:grid-cols-[1fr,60px,1.5fr] items-stretch gap-0 bg-white border border-stellantis-blue/10 rounded-xl overflow-hidden hover:shadow-xl transition-all"
                      >
                        {/* Supplier Data */}
                        <div className="p-6 border-b lg:border-b-0 lg:border-r border-stellantis-blue/10 bg-slate-50">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-2 block">Supplier Input</span>
                          <p className="text-lg font-mono font-medium text-stellantis-blue">{res.supplierDescription}</p>
                        </div>

                        {/* Connector */}
                        <div className="flex items-center justify-center bg-stellantis-blue/5 py-4 lg:py-0">
                          <ArrowRight className="text-stellantis-blue/20 group-hover:text-stellantis-blue transition-colors" />
                        </div>

                        {/* MABEC Data */}
                          <div className="flex flex-col justify-between items-start">
                            <div className="w-full">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex flex-col gap-1">
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Standardized Reference</span>
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                    res.actionRecommandee === 'VALIDER_AUTO' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 
                                    res.actionRecommandee === 'VERIFIER' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 
                                    'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                  }`}>
                                    {res.actionRecommandee}
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  {res.matches.length > 0 && (
                                    <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${getConfidenceColor(res.matches[0].confiance)}`}>
                                      {res.matches[0].niveau} ({res.matches[0].confiance}%)
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {res.matches.length > 0 ? (
                                <div className="space-y-6">
                                  {/* Top 3 Matches */}
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-stellantis-blue/40 uppercase tracking-widest mb-1">
                                      <Sparkles size={12} />
                                      <span>Top 3 Matches</span>
                                    </div>
                                    <div className="grid gap-3">
                                      {res.matches.slice(0, 3).map((match, idx) => (
                                        <div key={idx} className={`p-4 rounded-xl border transition-all ${idx === 0 ? 'bg-stellantis-blue/5 border-stellantis-blue/20 ring-1 ring-stellantis-blue/10 shadow-sm' : 'bg-white border-stellantis-blue/10 hover:border-stellantis-blue/30'}`}>
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                              <span className={`px-2 py-0.5 ${idx === 0 ? 'bg-stellantis-blue text-white' : 'bg-stellantis-grey text-stellantis-blue'} font-mono text-[10px] font-bold rounded`}>
                                                {match.code}
                                              </span>
                                              {idx === 0 && <CheckCircle2 size={14} className="text-blue-500" />}
                                            </div>
                                            <span className={`text-[10px] font-black ${getConfidenceColor(match.confiance).split(' ')[0]}`}>
                                              {match.confiance}%
                                            </span>
                                          </div>
                                          <h4 className={`font-black tracking-tight uppercase leading-tight ${idx === 0 ? 'text-lg' : 'text-sm'}`}>
                                            {match.description}
                                          </h4>
                                          <p className="mt-2 text-[10px] text-stellantis-blue/60 italic font-light leading-snug">
                                            {match.justification}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Extraction details (only for first result context) */}
                                  <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(res.attributsExtraits).map(([key, val]) => val && val !== '...' && val !== 'N/A' && (
                                      <div key={key} className="flex flex-col p-2 bg-stellantis-blue/5 rounded border border-stellantis-blue/5">
                                        <span className="text-[8px] font-bold text-stellantis-blue/40 uppercase tracking-tighter">{key}</span>
                                        <span className="text-[10px] font-bold truncate">{val as string}</span>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Extended Suggestions Toggle */}
                                  {res.matches.length > 3 && (
                                    <div className="pt-2 border-t border-stellantis-blue/5">
                                      <details className="group/details">
                                        <summary className="flex items-center gap-2 text-[10px] font-bold text-stellantis-blue/40 uppercase cursor-pointer hover:text-stellantis-blue transition-colors list-none">
                                          <ChevronRight size={14} className="transition-transform group-open/details:rotate-90" />
                                          <span>Other potential suggestions ({res.matches.length - 3})</span>
                                        </summary>
                                        <div className="mt-3 space-y-2 pl-4 border-l-2 border-stellantis-blue/5">
                                          {res.matches.slice(3).map((match, idx) => (
                                            <div key={idx} className="p-3 bg-white border border-stellantis-blue/10 rounded-lg hover:bg-stellantis-blue/5 transition-colors">
                                              <div className="flex items-center justify-between mb-1">
                                                <span className="font-mono text-[9px] font-bold text-stellantis-blue/60">{match.code}</span>
                                                <span className="text-[9px] font-bold opacity-40">{match.confiance}%</span>
                                              </div>
                                              <h5 className="text-[11px] font-bold uppercase">{match.description}</h5>
                                              <p className="mt-1 text-[9px] text-stellantis-blue/40 italic">{match.justification}</p>
                                            </div>
                                          ))}
                                        </div>
                                      </details>
                                    </div>
                                  )}

                                  {res.remarque && (
                                    <div className="p-3 bg-rose-50 border border-rose-100 rounded">
                                      <p className="text-[10px] text-rose-600 font-bold uppercase tracking-tight">
                                        System Note: {res.remarque}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex flex-col gap-4">
                                  <div className="flex items-center gap-3 text-rose-500">
                                    <AlertCircle size={20} />
                                    <span className="font-bold">No match found in library.</span>
                                  </div>
                                  <div className="p-4 bg-rose-50 border border-rose-100 rounded text-sm text-rose-800 italic">
                                    L'IA n'a pas pu identifier de correspondance technique fiable dans votre catalogue actuel. 
                                    Veuillez vérifier manuellement ou enrichir votre base de données.
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {view === 'catalog' && (
            <motion.div 
              key="catalog"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-2xl uppercase tracking-tight">Internal Reference Library ({catalog.length})</h3>
                <div className="flex items-center gap-3 bg-white px-4 py-2 border border-stellantis-blue/10 rounded-lg shadow-sm">
                  <Search size={16} className="text-stellantis-blue/40" />
                  <input placeholder="Filter references..." className="bg-transparent border-none focus:ring-0 text-sm font-medium w-48" />
                </div>
              </div>

              <div className="bg-white border border-stellantis-blue/10 overflow-y-auto max-h-[600px] rounded-2xl shadow-sm">
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead className="sticky top-0 z-10 bg-stellantis-blue text-white text-[10px] uppercase tracking-widest font-bold">
                    <tr>
                      <th className="p-4 border-r border-b border-white/10 uppercase">Article ID</th>
                      <th className="p-4 border-b border-white/10 uppercase">Technical Designation</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-xs">
                    {catalog.map((item, i) => (
                      <tr key={i} className="border-b border-stellantis-blue/5 hover:bg-stellantis-blue/5 transition-colors cursor-default">
                        <td className="p-4 border-r border-stellantis-blue/5 font-bold bg-slate-50/30">{item.article}</td>
                        <td className="p-4 text-stellantis-blue/80">{item.designation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {view === 'import' && (
            <motion.div 
              key="import"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-6">
                   <div className="p-8 bg-white border-2 border-dashed border-stellantis-blue/20 rounded-2xl flex flex-col items-center justify-center text-center group hover:border-stellantis-blue transition-all cursor-pointer relative"
                     onClick={() => fileInputRef.current?.click()}
                   >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden" 
                      accept=".xlsx, .xls, .csv"
                    />
                    <div className="w-16 h-16 bg-stellantis-blue/5 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <FileSpreadsheet size={32} className="text-stellantis-blue" />
                    </div>
                    <h4 className="text-xl font-black mb-2 tracking-tight">Cliquer pour importer</h4>
                    <p className="text-sm text-stellantis-blue/60 mb-8 font-light px-12">
                      Sélectionnez un fichier Excel (.xlsx) contenant les colonnes "Article" et "Désignation article".
                    </p>
                    <div className="px-6 py-2 bg-stellantis-blue text-white rounded font-bold text-xs uppercase tracking-widest">
                      Parcourir les fichiers
                    </div>
                  </div>

                  {importStatus && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 rounded-lg flex items-center gap-3 border ${
                        importStatus.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
                        importStatus.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 
                        'bg-blue-50 border-blue-200 text-blue-800'
                      }`}
                    >
                      {importStatus.type === 'success' ? <CheckCircle2 size={18} /> : 
                       importStatus.type === 'error' ? <AlertCircle size={18} /> : 
                       <Sparkles size={18} />}
                      <span className="text-sm font-bold">{importStatus.message}</span>
                      <button onClick={() => setImportStatus(null)} className="ml-auto opacity-40 hover:opacity-100">
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  )}
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="font-bold text-2xl uppercase">Instructions & Format</h3>
                    <div className="space-y-4">
                      <div className="flex gap-4 p-4 bg-white border border-stellantis-blue/10 rounded-xl">
                        <div className="w-8 h-8 bg-stellantis-blue text-white rounded flex items-center justify-center font-bold text-sm shrink-0">1</div>
                        <div>
                          <h5 className="font-bold text-sm mb-1 uppercase">Entêtes de colonnes</h5>
                          <p className="text-xs text-stellantis-blue/60 font-light">Votre fichier doit contenir au minimum les colonnes nommées "Article" et "Désignation article".</p>
                        </div>
                      </div>
                      <div className="flex gap-4 p-4 bg-white border border-stellantis-blue/10 rounded-xl">
                        <div className="w-8 h-8 bg-stellantis-blue text-white rounded flex items-center justify-center font-bold text-sm shrink-0">2</div>
                        <div>
                          <h5 className="font-bold text-sm mb-1 uppercase">Qualité des données</h5>
                          <p className="text-xs text-stellantis-blue/60 font-light">Une désignation précise permet à l'IA de faire de meilleurs rapprochements techniques.</p>
                        </div>
                      </div>
                      <div className="flex gap-4 p-4 bg-white border border-stellantis-blue/10 rounded-xl">
                        <div className="w-8 h-8 bg-stellantis-blue text-white rounded flex items-center justify-center font-bold text-sm shrink-0">3</div>
                        <div>
                          <h5 className="font-bold text-sm mb-1 uppercase">Confidentialité</h5>
                          <p className="text-xs text-stellantis-blue/60 font-light">Les données importées sont stockées localement dans votre navigateur.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 flex flex-col gap-4">
                    <button 
                      onClick={resetCatalog}
                      className="flex items-center justify-center gap-3 p-4 bg-rose-500/10 text-rose-600 border border-rose-500/20 rounded-xl font-bold text-sm hover:bg-rose-500/20 transition-colors"
                    >
                      <Trash2 size={18} />
                      Réinitialiser le catalogue
                    </button>
                    <a 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        const ws = XLSX.utils.json_to_sheet(MABEC_CATALOG);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, "Catalog");
                        XLSX.writeFile(wb, "mabec_template.xlsx");
                      }}
                      className="flex items-center justify-center gap-3 p-4 bg-stellantis-blue/5 text-stellantis-blue border border-stellantis-blue/10 rounded-xl font-bold text-sm hover:bg-stellantis-blue/10 transition-colors"
                    >
                      <Download size={18} />
                      Download Template
                    </a>
                  </div>
                </div>
              </div>

              {/* Preview currently loaded data */}
               <div className="space-y-4">
                 <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stellantis-blue/40">
                    <TableIcon size={14} />
                    <span>Database active ({catalog.length} references)</span>
                 </div>
                 <div className="bg-white border border-stellantis-blue/10 h-64 overflow-auto rounded-xl">
                    <table className="w-full text-left text-[10px] font-mono">
                      <thead className="sticky top-0 bg-stellantis-blue text-white">
                        <tr>
                          <th className="p-3">CODE</th>
                          <th className="p-3">DESIGNATION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {catalog.slice(0, 50).map((item, i) => (
                          <tr key={i} className="border-b border-stellantis-blue/10">
                            <td className="p-3 font-bold">{item.article}</td>
                            <td className="p-3">{item.designation}</td>
                          </tr>
                        ))}
                        {catalog.length > 50 && (
                          <tr>
                            <td colSpan={2} className="p-3 text-center text-stellantis-blue/40 bg-stellantis-blue/5 italic">
                              ... plus {catalog.length - 50} autres articles
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                 </div>
               </div>
            </motion.div>
          )}

          {view === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-serif italic text-2xl">Session History</h3>
                <button 
                  onClick={() => {
                    localStorage.removeItem('mabec_history');
                    setHistory([]);
                  }}
                  className="text-xs font-bold uppercase tracking-widest text-rose-500 hover:underline"
                >
                  Clear History
                </button>
              </div>

              {history.length > 0 ? (
                <div className="bg-white border border-stellantis-blue/10 rounded-2xl overflow-hidden shadow-sm">
                  {history.map((h, i) => (
                    <div key={i} className="p-4 border-b border-stellantis-blue/5 flex items-center justify-between hover:bg-stellantis-blue/5 transition-colors">
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-bold text-stellantis-blue/40 uppercase">Input</span>
                          <span className="text-sm font-mono">{h.supplierDescription}</span>
                        </div>
                        <ArrowRight size={14} className="text-stellantis-blue/20" />
                        <div className="flex flex-col">
                          <span className="text-[8px] font-bold text-stellantis-blue/40 uppercase">Match</span>
                          <span className="text-sm font-bold">{h.matches?.[0]?.code || 'Failed'}</span>
                        </div>
                      </div>
                      <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${getConfidenceColor(h.matches?.[0]?.confiance || 0)}`}>
                        {h.matches?.[0]?.confiance || 0}%
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 border border-dashed border-stellantis-blue/20 rounded-2xl text-center flex flex-col items-center bg-white">
                  <ClipboardList size={32} className="text-stellantis-blue/20 mb-4" />
                  <p className="font-light text-stellantis-blue/60 italic">Your processing history will appear here.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-24 pt-8 border-t border-stellantis-blue/10 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-stellantis-blue/30">
          <div className="flex items-center gap-2">
            <FileBox size={14} />
            <span>Industrial Procurement Systems v1.1.0</span>
          </div>
          <div>© 2026 Stellantis Supply Chain . Optimization Engine</div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-stellantis-blue">Internal Portal</a>
            <a href="#" className="hover:text-stellantis-blue">Support</a>
          </div>
        </footer>
      </main>
    </div>
  );
}

