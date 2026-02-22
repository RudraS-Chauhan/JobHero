import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { RoadmapStep } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';

interface RoadmapVisualizerProps {
  steps: RoadmapStep[];
  isPro?: boolean;
}

export const RoadmapVisualizer: React.FC<RoadmapVisualizerProps> = ({ steps, isPro = false }) => {
  const [expandedSteps, setExpandedSteps] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const toggleStep = (index: number) => {
    setExpandedSteps(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleDownload = async () => {
    if (!containerRef.current) return;
    setIsDownloading(true);
    
    // Allow time for re-render to expand all items
    await new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      containerRef.current.classList.add('capturing');
      
      const canvas = await html2canvas(containerRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        onclone: (doc) => {
            const el = doc.querySelector('.capturing');
            if (el) {
                (el as HTMLElement).style.padding = '40px';
                // Force all details to be visible in the clone if not already
                const details = el.querySelectorAll('.step-details');
                details.forEach((d) => {
                    (d as HTMLElement).style.height = 'auto';
                    (d as HTMLElement).style.opacity = '1';
                    (d as HTMLElement).style.display = 'block';
                });
            }
        }
      });
      
      containerRef.current.classList.remove('capturing');

      const link = document.createElement('a');
      link.download = `Career_Roadmap_${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download roadmap.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="relative w-full bg-white dark:bg-slate-950 rounded-2xl p-6 md:p-10 border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Career Roadmap Visualization</h3>
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold uppercase tracking-wider rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <DownloadIcon className="w-4 h-4" />
          {isDownloading ? 'Generating High-Res Map...' : 'Download Map'}
        </button>
      </div>

      <div ref={containerRef} className="relative pl-4 md:pl-8 py-4 bg-white dark:bg-slate-950 rounded-xl">
        {/* Vertical Line with Gradient */}
        <div className="absolute left-[27px] md:left-[43px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-blue-200 dark:from-blue-900 dark:via-purple-900 dark:to-blue-900" />

        <div className="space-y-8 relative">
          {steps.map((step, index) => {
            const isExpanded = expandedSteps.includes(index) || isDownloading;
            const isLast = index === steps.length - 1;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex gap-6 md:gap-10 group"
              >
                {/* Node with Pulse Effect */}
                <div className="relative z-10 shrink-0 mt-1 flex flex-col items-center">
                    {isExpanded && <div className="absolute top-1 w-full h-full bg-blue-500/30 rounded-full animate-ping" style={{ width: '2rem', height: '2rem' }} />}
                    <button
                    onClick={() => !isDownloading && toggleStep(index)}
                    className={`relative flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full border-2 transition-all duration-300 z-20 ${
                        isExpanded
                        ? 'bg-blue-600 border-blue-600 text-white scale-110 shadow-lg shadow-blue-600/30'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-500 hover:border-blue-500 hover:text-blue-500'
                    }`}
                    >
                    <span className="text-[10px] font-bold">{index + 1}</span>
                    </button>
                    {!isLast && (
                        <div className={`w-0.5 flex-grow mt-2 ${isExpanded ? 'bg-blue-200 dark:bg-blue-800' : 'bg-transparent'}`} style={{ height: '100%' }}></div>
                    )}
                </div>

                {/* Content Card */}
                <div
                  className={`flex-1 transition-all duration-300 ${
                    isExpanded ? 'scale-[1.02]' : 'hover:translate-x-1'
                  }`}
                >
                  <div
                    onClick={() => !isDownloading && toggleStep(index)}
                    className={`cursor-pointer p-5 rounded-xl border transition-all duration-300 ${
                      isExpanded
                        ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 shadow-md'
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-blue-100 dark:hover:border-blue-900 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                      <h4 className={`font-bold text-sm ${isExpanded ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-white'}`}>
                        {step.title}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded self-start md:self-auto">
                        {step.phase || step.duration}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3 line-clamp-2 group-hover:line-clamp-none transition-all">
                      {step.description}
                    </p>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden step-details"
                        >
                          <div className="pt-3 mt-3 border-t border-slate-200/50 dark:border-slate-700/50 grid gap-4 md:grid-cols-2">
                            {step.milestones && step.milestones.length > 0 && (
                              <div>
                                <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Milestones</h5>
                                <ul className="space-y-2">
                                  {step.milestones.map((m, i) => (
                                    <li key={i} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0 shadow-sm shadow-blue-500/50" />
                                      <span className="leading-tight">{m}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {step.tools && step.tools.length > 0 && (
                              <div>
                                <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Tools & Tech</h5>
                                <div className="flex flex-wrap gap-1.5">
                                  {step.tools.map((tool, i) => (
                                    <span key={i} className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-medium text-slate-600 dark:text-slate-300 shadow-sm">
                                      {tool}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {step.resources && step.resources.length > 0 && (
                                <div className="md:col-span-2">
                                    <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Resources</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {step.resources.map((res, i) => {
                                            const isPremium = res.type === 'Premium';
                                            const isLocked = isPremium && !isPro;
                                            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(res.title)}`;
                                            
                                            return (
                                                <a 
                                                    key={i} 
                                                    href={isLocked ? undefined : searchUrl}
                                                    target={isLocked ? undefined : '_blank'}
                                                    rel={isLocked ? undefined : "noopener noreferrer"}
                                                    onClick={(e) => {
                                                        if (isLocked) {
                                                            e.preventDefault();
                                                            e.stopPropagation(); // Stop propagation to prevent collapsing card
                                                            // Custom Interactive Alert
                                                            const overlay = document.createElement('div');
                                                            overlay.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200';
                                                            overlay.innerHTML = `
                                                                <div class="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 transform scale-100 animate-in zoom-in-95 duration-200 relative overflow-hidden">
                                                                    <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-600"></div>
                                                                    <div class="text-center space-y-4">
                                                                        <div class="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                                                                            <span class="text-3xl">💎</span>
                                                                        </div>
                                                                        <h3 class="text-2xl font-black text-slate-900 dark:text-white">Unlock Elite Strategy</h3>
                                                                        <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                                                            You've discovered a <strong>Premium Resource</strong>. This includes:
                                                                        </p>
                                                                        <ul class="text-left text-xs font-medium text-slate-700 dark:text-slate-300 space-y-2 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                                                            <li class="flex items-center gap-2">✅ Interactive Learning Flowchart</li>
                                                                            <li class="flex items-center gap-2">✅ Deep-Dive Implementation Guide</li>
                                                                            <li class="flex items-center gap-2">✅ Expert-Vetted Best Practices</li>
                                                                        </ul>
                                                                        <div class="flex gap-3 pt-2">
                                                                            <button id="cancel-upgrade" class="flex-1 px-4 py-3 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">Maybe Later</button>
                                                                            <button id="confirm-upgrade" class="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg hover:shadow-amber-500/25 hover:scale-105 transition-all">🚀 Upgrade Now</button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            `;
                                                            document.body.appendChild(overlay);
                                                            
                                                            document.getElementById('cancel-upgrade')?.addEventListener('click', () => {
                                                                overlay.remove();
                                                            });
                                                            
                                                            document.getElementById('confirm-upgrade')?.addEventListener('click', () => {
                                                                overlay.remove();
                                                                const mainUpgradeBtn = document.querySelector('button[class*="bg-gradient-to-r from-amber-500"]') as HTMLButtonElement;
                                                                if(mainUpgradeBtn) mainUpgradeBtn.click();
                                                                else alert("Redirecting to payment gateway...");
                                                            });
                                                        } else {
                                                            e.stopPropagation(); // Stop propagation for non-premium links too
                                                        }
                                                    }}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 ${
                                                        isPremium 
                                                        ? (isLocked 
                                                            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 cursor-pointer border border-amber-200 dark:border-amber-800/50 hover:shadow-md hover:shadow-amber-500/10 hover:-translate-y-0.5'
                                                            : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800/50 hover:shadow-sm hover:-translate-y-0.5')
                                                        : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800/50 hover:shadow-sm hover:-translate-y-0.5'
                                                    }`}
                                                >
                                                    <span>{isPremium ? (isLocked ? '💎' : '🔓') : (res.type === 'Tool' ? '🛠️' : '📚')}</span> 
                                                    <span className={isPremium ? 'underline decoration-amber-300/50 underline-offset-2' : 'hover:underline'}>{res.title}</span>
                                                    {isPremium && <span className={`ml-1 text-[8px] px-1.5 py-0.5 rounded-full font-black tracking-wider shadow-sm ${isLocked ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>{isLocked ? 'PRO' : 'OPEN'}</span>}
                                                </a>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
