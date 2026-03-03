import React, { useState, useRef, useEffect } from 'react';
import { Wand2, AlertCircle, ShoppingBag, Layout, Link as LinkIcon, Share2, FileSpreadsheet, MessageSquarePlus, RefreshCw, Globe, Image as ImageIcon, X, List, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ImageCard } from './components/ImageCard';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { FacebookModal } from './components/FacebookModal';
import { WordPressModal } from './components/WordPressModal';
import { SocialPostCard } from './components/SocialPostCard';
import { VideoScriptCard } from './components/VideoScriptCard';
import { analyzeProductUrl, generateProductImage } from './services/geminiService';
// Fix: Import SHEET_ID along with the fetching function
import { fetchCampaignsFromSheet, SHEET_ID } from './services/googleSheetsService';
import { AppState, GeneratedImage, ProductAnalysis, CampaignItem } from './types';

function App() {
  const [isKeyReady, setIsKeyReady] = useState(false);
  const [url, setUrl] = useState('');
  const [affiliateLink, setAffiliateLink] = useState('');
  const [userInstructions, setUserInstructions] = useState('');
  const [wpPostLink, setWpPostLink] = useState(''); 
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [error, setError] = useState<string | null>(null);
  
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [showSheetsModal, setShowSheetsModal] = useState(false);
  const [showFacebookModal, setShowFacebookModal] = useState(false);
  const [showWordPressModal, setShowWordPressModal] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [isCampaignsLoading, setIsCampaignsLoading] = useState(false);

  const [heroImage, setHeroImage] = useState<GeneratedImage>({ ratio: '16:9', type: 'hero', url: '', loading: false });
  const [adImage, setAdImage] = useState<GeneratedImage>({ ratio: '1:1', type: 'ad', url: '', loading: false });
  const [pinImage, setPinImage] = useState<GeneratedImage>({ ratio: '9:16', type: 'pinterest', url: '', loading: false });

  // Fetch campaigns from the sheet on mount or when key is ready
  useEffect(() => {
    if (isKeyReady) {
      refreshCampaigns();
    }
  }, [isKeyReady]);

  const refreshCampaigns = async () => {
    setIsCampaignsLoading(true);
    try {
      const data = await fetchCampaignsFromSheet();
      setCampaigns(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCampaignsLoading(false);
    }
  };

  const selectCampaign = (campaign: CampaignItem) => {
    setUrl(campaign.url);
    setAffiliateLink(campaign.affiliateLink);
    setWpPostLink(campaign.articleUrl);
    setUserInstructions(campaign.instructions);
    
    // Scroll to form smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeReferenceImage = () => {
    setReferenceImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setState(AppState.ANALYZING);
    setError(null);
    setAnalysis(null);
    setHeroImage(prev => ({ ...prev, url: '', loading: false }));
    setAdImage(prev => ({ ...prev, url: '', loading: false }));
    setPinImage(prev => ({ ...prev, url: '', loading: false }));

    try {
      const analysisResult = await analyzeProductUrl(url, affiliateLink.trim(), userInstructions.trim());
      
      if (wpPostLink.trim()) {
        const linkText = `\n\nFull Review: ${wpPostLink.trim()}`;
        analysisResult.socialPosts.facebook += linkText;
        analysisResult.socialPosts.instagram += linkText;
        analysisResult.socialPosts.tiktok += linkText;
        analysisResult.socialPosts.threads += linkText;
        analysisResult.socialPosts.youtube.description += linkText;
        // CRITICAL: Exclude Pinterest description from link injection
        // analysisResult.socialPosts.pinterest.description += linkText; 
      }

      setAnalysis(analysisResult);
      setState(AppState.GENERATING_IMAGES);

      const visualDesc = analysisResult.visualDescription;

      let refImgData: string | undefined;
      let refMimeType: string | undefined;
      
      if (referenceImage) {
        const parts = referenceImage.split(';base64,');
        if (parts.length === 2) {
          refMimeType = parts[0].split(':')[1];
          refImgData = parts[1];
        }
      }

      const tasks = [
        async () => {
          setHeroImage(prev => ({ ...prev, loading: true }));
          try {
            const heroUrl = await generateProductImage(visualDesc, '16:9', 'hero', refImgData, refMimeType);
            setHeroImage(prev => ({ ...prev, url: heroUrl, loading: false }));
          } catch (err) {
            console.error("Hero generation failed", err);
            setHeroImage(prev => ({ ...prev, loading: false }));
          }
        },
        async () => {
          setAdImage(prev => ({ ...prev, loading: true }));
          try {
            const adUrl = await generateProductImage(visualDesc, '1:1', 'ad', refImgData, refMimeType);
            setAdImage(prev => ({ ...prev, url: adUrl, loading: false }));
          } catch (err) {
            console.error("Ad generation failed", err);
            setAdImage(prev => ({ ...prev, loading: false }));
          }
        },
        async () => {
          setPinImage(prev => ({ ...prev, loading: true }));
          try {
            const pinUrl = await generateProductImage(visualDesc, '9:16', 'pinterest', refImgData, refMimeType, analysisResult.pinterestHook);
            setPinImage(prev => ({ ...prev, url: pinUrl, loading: false }));
          } catch (err) {
            console.error("Pin generation failed", err);
            setPinImage(prev => ({ ...prev, loading: false }));
          }
        }
      ];

      await Promise.all(tasks.map(t => t()));
      setState(AppState.COMPLETE);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
      setState(AppState.ERROR);
    }
  };

  const handleInjectLink = () => {
    if (!analysis || !wpPostLink.trim()) return;
    const linkText = `\n\nFull Review: ${wpPostLink.trim()}`;
    const append = (text: string) => text.includes(wpPostLink.trim()) ? text : text + linkText;
    setAnalysis({
      ...analysis,
      socialPosts: {
        ...analysis.socialPosts,
        facebook: append(analysis.socialPosts.facebook),
        instagram: append(analysis.socialPosts.instagram),
        tiktok: append(analysis.socialPosts.tiktok),
        threads: append(analysis.socialPosts.threads),
        youtube: { ...analysis.socialPosts.youtube, description: append(analysis.socialPosts.youtube.description) },
        // CRITICAL: Exclude Pinterest from link injection
        // pinterest: { ...analysis.socialPosts.pinterest, description: append(analysis.socialPosts.pinterest.description) }
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <ApiKeyModal onReady={() => setIsKeyReady(true)} />
      
      {analysis && (
        <GoogleSheetsModal 
          isOpen={showSheetsModal} 
          onClose={() => setShowSheetsModal(false)} 
          productName={analysis.productName} 
          productUrl={url} 
          affiliateLink={affiliateLink} 
        />
      )}

      {analysis && (
        <FacebookModal
          isOpen={showFacebookModal}
          onClose={() => setShowFacebookModal(false)}
          message={analysis.socialPosts.facebook}
          imageBase64={adImage.url}
        />
      )}

      {analysis && (
        <WordPressModal
          isOpen={showWordPressModal}
          onClose={() => setShowWordPressModal(false)}
          blogTitle={`Review: ${analysis.productName}`}
          blogContent={analysis.socialPosts.facebook} // Or a dedicated blog content field if added
        />
      )}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg"><Wand2 className="w-6 h-6 text-white" /></div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">ProductVision AI</h1>
          </div>
          <div className="flex items-center gap-4">
             <button 
                onClick={refreshCampaigns} 
                className="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                disabled={isCampaignsLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isCampaignsLoading ? 'animate-spin' : ''}`} />
                Sync Sheet
              </button>
             <div className="text-sm text-slate-500 hidden sm:block">Nano Banana Pro Active</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-12">
          <section>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-6 text-center">Campaign Configuration</h2>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-grow space-y-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><ShoppingBag className="h-5 w-5 text-gray-400" /></div>
                      <input type="url" placeholder="Amazon/Product URL..." className="w-full pl-10 p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={url} onChange={(e) => setUrl(e.target.value)} required disabled={!isKeyReady || state === AppState.ANALYZING || state === AppState.GENERATING_IMAGES} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><LinkIcon className="h-5 w-5 text-gray-400" /></div>
                        <input type="text" placeholder="Your Affiliate Link..." className="w-full pl-10 p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={affiliateLink} onChange={(e) => setAffiliateLink(e.target.value)} />
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Globe className="h-5 w-5 text-gray-400" /></div>
                        <input type="text" placeholder="WordPress Article Link..." className="w-full pl-10 p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={wpPostLink} onChange={(e) => setWpPostLink(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-48 shrink-0">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`h-full min-h-[120px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group
                      ${referenceImage ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}
                    >
                      {referenceImage ? (
                        <>
                          <img src={referenceImage} alt="Reference" className="w-full h-full object-cover" />
                          <button 
                            onClick={(e) => { e.stopPropagation(); removeReferenceImage(); }}
                            className="absolute top-1 right-1 bg-white/80 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </button>
                        </>
                      ) : (
                        <div className="text-center p-2">
                          <ImageIcon className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                          <span className="text-[10px] font-medium text-slate-500 block">Reference Image</span>
                          <span className="text-[8px] text-slate-400 block">(Optional)</span>
                        </div>
                      )}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                      />
                    </div>
                  </div>
                </div>

                <div className="relative">
                   <div className="absolute top-4 left-3 pointer-events-none"><MessageSquarePlus className="h-5 w-5 text-gray-400" /></div>
                   <textarea placeholder="Instructions / Emphasis (e.g., Focus on durability, target outdoor enthusiasts...)" className="w-full pl-10 p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-24 text-sm" value={userInstructions} onChange={(e) => setUserInstructions(e.target.value)} />
                </div>

                <div className="flex gap-3">
                  <button type="submit" disabled={!isKeyReady || state === AppState.ANALYZING || state === AppState.GENERATING_IMAGES} className="flex-grow bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2">
                    {state === AppState.ANALYZING ? 'Analyzing Product...' : state === AppState.GENERATING_IMAGES ? 'Generating Assets...' : 'Generate Campaign'}
                    {(state === AppState.ANALYZING || state === AppState.GENERATING_IMAGES) && <Wand2 className="w-4 h-4 animate-spin" />}
                  </button>
                  {analysis && (
                    <button type="button" onClick={handleInjectLink} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 rounded-xl border border-slate-200 flex items-center gap-2" title="Apply current WP Link to existing posts">
                      <RefreshCw className="w-5 h-5" />
                      Apply Link
                    </button>
                  )}
                </div>
              </form>
              {error && <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 text-sm"><AlertCircle className="w-5 h-5 shrink-0" /><p>{error}</p></div>}
            </div>
          </section>

          {(state !== AppState.IDLE && !error && state !== AppState.ANALYZING) && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <section>
                <div className="flex items-center justify-between mb-6">
                   <h2 className="text-2xl font-bold flex items-center gap-2"><Layout className="w-6 h-6 text-indigo-600" /> Visual Assets</h2>
                   <button onClick={() => setShowSheetsModal(true)} className="flex items-center gap-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-shadow shadow-sm"><FileSpreadsheet className="w-4 h-4" /> Save to Sheet</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="col-span-1 md:col-span-2 lg:col-span-2"><ImageCard image={heroImage} title="Hero Image" description="16:9 • Website Header" /></div>
                  <div className="col-span-1"><ImageCard image={adImage} title="Social Ad" description="1:1 • Square Feed" /></div>
                  <div className="col-span-1"><ImageCard image={pinImage} title="Pinterest Pin" description="9:16 • Vertical Lifestyle" hookText={analysis?.pinterestHook} /></div>
                </div>

                {analysis?.groundingUrls && analysis.groundingUrls.length > 0 && (
                  <div className="mt-8 bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                    <h3 className="text-xs font-bold text-indigo-800 mb-4 flex items-center gap-2 uppercase tracking-widest">
                      <Globe className="w-4 h-4" />
                      Sources & Grounding (Verified via Google Search)
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {analysis.groundingUrls.map((source, idx) => (
                        <a 
                          key={idx} 
                          href={source.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-white px-4 py-2 rounded-full border border-indigo-200 shadow-sm hover:shadow transition-all flex items-center gap-2"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                          {source.title || 'Source'}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {analysis?.socialPosts && (
                <section>
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Share2 className="w-6 h-6 text-indigo-600" /> Social Media Content</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-1">
                      <VideoScriptCard script={analysis.soraVideoScript || ""} type="sora" />
                    </div>
                    <div className="md:col-span-1">
                      <VideoScriptCard script={analysis.veoVideoPrompt || ""} type="veo" />
                    </div>
                    <div className="md:col-span-2"><SocialPostCard platform="youtube" content={analysis.socialPosts.youtube} /></div>
                    <SocialPostCard 
                      platform="facebook" 
                      content={analysis.socialPosts.facebook} 
                      image={adImage} 
                      onAutomate={() => setShowFacebookModal(true)}
                    />
                    <SocialPostCard 
                      platform="instagram" 
                      content={analysis.socialPosts.instagram} 
                      image={adImage} 
                    />
                    <SocialPostCard 
                      platform="threads" 
                      content={analysis.socialPosts.threads} 
                      image={adImage} 
                    />
                    <SocialPostCard 
                      platform="tiktok" 
                      content={analysis.socialPosts.tiktok} 
                    />
                    <SocialPostCard 
                      platform="pinterest" 
                      content={analysis.socialPosts.pinterest} 
                      image={pinImage} 
                    />
                    <div className="md:col-span-2">
                      <button 
                        onClick={() => setShowWordPressModal(true)}
                        className="w-full py-4 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"
                      >
                        <Globe className="w-5 h-5" />
                        Send Full Campaign to WordPress Draft
                      </button>
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        {/* Campaign Hub Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[80vh] sticky top-24">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                 <h2 className="font-bold flex items-center gap-2 text-slate-800">
                    <List className="w-5 h-5 text-indigo-600" />
                    Campaign Hub
                 </h2>
                 <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {campaigns.length} Active
                 </span>
              </div>
              
              <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {isCampaignsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-xs">Fetching campaigns...</span>
                  </div>
                ) : campaigns.length > 0 ? (
                  campaigns.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => selectCampaign(item)}
                      className={`group p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 cursor-pointer transition-all ${url === item.url ? 'border-indigo-500 bg-indigo-50' : 'bg-white'}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className={`w-4 h-4 ${url === item.url ? 'text-indigo-600' : 'text-slate-400'}`} />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Row #{item.rowIndex + 1}</span>
                        </div>
                        {item.status.toLowerCase() === 'published' ? (
                          <div className="flex items-center gap-1 bg-green-50 text-green-600 text-[8px] font-bold px-1.5 py-0.5 rounded border border-green-100">
                            <CheckCircle2 className="w-2 h-2" />
                            PUBLISHED
                          </div>
                        ) : (
                          <div className="bg-slate-50 text-slate-500 text-[8px] font-bold px-1.5 py-0.5 rounded border border-slate-100">
                            NEW
                          </div>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-slate-800 truncate mb-1" title={item.url}>
                        {item.url}
                      </div>
                      {item.instructions && (
                        <p className="text-[10px] text-slate-500 line-clamp-1 italic">
                          "{item.instructions}"
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1">
                           Load <ArrowRight className="w-3 h-3" />
                         </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 px-4">
                    <p className="text-sm text-slate-400">No campaigns found matching "Published" or empty status.</p>
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl">
                 <p className="text-[9px] text-slate-400 leading-tight">
                    Syncing with sheet: <br/>
                    <code className="text-[8px] break-all">{SHEET_ID}</code>
                 </p>
              </div>
           </div>
        </aside>
      </main>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}

export default App;