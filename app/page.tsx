'use client';

import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  Download,
  Grid2X2,
  Image as ImageIcon,
  Layers3,
  LoaderCircle,
  Moon,
  Plus,
  Search,
  Sparkles,
  Sun,
  Trash2,
  WandSparkles,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  clearHistoryRecords,
  deleteHistoryRecord,
  readHistoryRecords,
  saveHistoryRecord,
  type HistoryRecord,
} from '@/lib/history';

type Theme = 'dark' | 'light';
type PageView = 'create' | 'history';
type DisplayRecord = HistoryRecord & { previewUrl: string };

const STYLES = [
  { name: 'Photorealistic', note: 'Lifelike detail', icon: '◉' },
  { name: 'Cinematic', note: 'Film-inspired', icon: '▣' },
  { name: '3D Render', note: 'Depth & polish', icon: '◇' },
  { name: 'Anime', note: 'Expressive art', icon: '✳' },
  { name: 'Digital Art', note: 'Creative finish', icon: '✦' },
  { name: 'Watercolor', note: 'Soft pigments', icon: '◌' },
  { name: 'Oil Painting', note: 'Classic brushwork', icon: '✺' },
  { name: 'Minimalist', note: 'Clean & simple', icon: '○' },
  { name: 'Fantasy', note: 'Magical worlds', icon: '✧' },
  { name: 'Cyberpunk', note: 'Neon atmosphere', icon: '⌁' },
  { name: 'Vintage Film', note: 'Analog mood', icon: '▤' },
  { name: 'Editorial', note: 'Art-directed', icon: '▧' },
  { name: 'Isometric', note: 'Miniature worlds', icon: '⬡' },
  { name: 'Pixel Art', note: 'Retro pixels', icon: '▦' },
  { name: 'Surrealism', note: 'Dream logic', icon: '☼' },
];

const ASPECTS = [
  { ratio: '1:1', label: 'Square', width: 1024, height: 1024, shape: 'square' },
  { ratio: '4:5', label: 'Portrait', width: 896, height: 1120, shape: 'portrait' },
  { ratio: '3:4', label: 'Tall', width: 864, height: 1152, shape: 'tall' },
  { ratio: '9:16', label: 'Story', width: 720, height: 1280, shape: 'story' },
  { ratio: '4:3', label: 'Classic', width: 1152, height: 864, shape: 'classic' },
  { ratio: '16:9', label: 'Wide', width: 1280, height: 720, shape: 'wide' },
  { ratio: '3:2', label: 'Photo', width: 1152, height: 768, shape: 'photo' },
  { ratio: '2:3', label: 'Poster', width: 768, height: 1152, shape: 'poster' },
];

const SURPRISE_PROMPTS = [
  'A tiny glass greenhouse floating above a sea of clouds at sunrise, miniature plants glowing softly inside, dreamy atmosphere, intricate details',
  'An elegant silver fox wandering through a moonlit forest filled with luminous blue flowers, magical realism, beautiful depth and atmosphere',
  'A luxury perfume bottle sculpted from translucent amber glass on a sculptural stone pedestal, warm desert light, premium product campaign',
  'A quiet Mediterranean street after rainfall, sunlit pastel architecture, reflections on cobblestones, cinematic travel photography',
  'A tiny astronaut tending a garden on an enormous leaf, delicate droplets, whimsical scale, richly detailed imaginative world',
  'An ancient library hidden inside a giant tree, warm lanterns, floating dust, endless spiral bookshelves, enchanting visual storytelling',
  'A dramatic close-up portrait of a wild horse with wind-swept mane against a soft golden field, editorial wildlife photography',
  'A surreal staircase made of white marble rising through a calm ocean into a peach-colored sky, minimalist dreamlike composition',
  'A futuristic concept of a botanical listening room, sculptural speakers, natural materials, lush greenery, refined interior design',
  'A handcrafted ceramic tea set on a linen table beside an open window, gentle morning shadows, tactile textures, quiet luxury',
  'A whale swimming gracefully through a star-filled night sky above a sleeping coastal town, poetic surrealist illustration',
  'A red vintage motorcycle parked at a lonely roadside diner in the desert, late afternoon sun, 35mm film aesthetic',
];

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function dataUrlToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Uint8Array(byteCharacters.length);
  for (let index = 0; index < byteCharacters.length; index += 1) {
    byteNumbers[index] = byteCharacters.charCodeAt(index);
  }
  const buffer = new ArrayBuffer(byteNumbers.length);
  new Uint8Array(buffer).set(byteNumbers);
  return new Blob([buffer], { type: mimeType });
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(timestamp);
}

function fileNameFromRecord(record: Pick<HistoryRecord, 'style' | 'createdAt' | 'blob'>) {
  const date = new Date(record.createdAt).toISOString().replace(/[:.]/g, '-');
  const extension = record.blob.type === 'image/png' ? 'png' : record.blob.type === 'image/webp' ? 'webp' : 'jpg';
  return `prismora-${record.style.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${date}.${extension}`;
}

export default function Home() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [view, setView] = useState<PageView>('create');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Photorealistic');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [current, setCurrent] = useState<DisplayRecord | null>(null);
  const [history, setHistory] = useState<DisplayRecord[]>([]);
  const [toast, setToast] = useState('');
  const [styleSearch, setStyleSearch] = useState('');
  const [showAllStyles, setShowAllStyles] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const activeAspect = ASPECTS.find((item) => item.ratio === aspectRatio) ?? ASPECTS[0];
  const filteredStyles = useMemo(
    () => STYLES.filter((item) => item.name.toLowerCase().includes(styleSearch.toLowerCase())),
    [styleSearch],
  );
  const filteredHistory = useMemo(() => history.filter((item) =>
    `${item.prompt} ${item.style} ${item.aspectRatio}`.toLowerCase().includes(historySearch.toLowerCase()),
  ), [history, historySearch]);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3000);
  }, []);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('prismora-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme);

    let active = true;
    readHistoryRecords()
      .then((records) => {
        if (!active) return;
        const items = records.map((record) => ({ ...record, previewUrl: URL.createObjectURL(record.blob) }));
        setHistory(items);
      })
      .catch(() => {
        if (active) notify('Local image history is unavailable in this browser.');
      });

    return () => {
      active = false;
    };
  }, [notify]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('prismora-theme', theme);
  }, [theme]);

  useEffect(() => {
    return () => {
      history.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      if (current && !history.some((item) => item.id === current.id)) URL.revokeObjectURL(current.previewUrl);
    };
    // URLs are intentionally revoked on unmount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const downloadRecord = useCallback((record: DisplayRecord) => {
    const url = URL.createObjectURL(record.blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileNameFromRecord(record);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    notify('Your image download has started.');
  }, [notify]);

  const handleGenerate = async () => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      notify('Write a prompt to bring your idea to life.');
      return;
    }
    if (cleanPrompt.length > 1800) {
      notify('Please keep your prompt under 1,800 characters.');
      return;
    }

    setIsGenerating(true);
    setView('create');
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: cleanPrompt, style, aspectRatio }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `Generation failed (${response.status}).`);
      if (!payload.image || !payload.mimeType) throw new Error('The image service returned an empty result.');

      const blob = dataUrlToBlob(payload.image, payload.mimeType);
      const createdAt = Date.now();
      const record: HistoryRecord = {
        id: makeId(),
        prompt: cleanPrompt,
        style,
        aspectRatio,
        width: payload.width || activeAspect.width,
        height: payload.height || activeAspect.height,
        createdAt,
        blob,
      };
      const displayRecord: DisplayRecord = { ...record, previewUrl: URL.createObjectURL(blob) };
      setCurrent(displayRecord);
      setHistory((previous) => [displayRecord, ...previous.filter((item) => item.id !== displayRecord.id)]);
      try {
        await saveHistoryRecord(record);
      } catch {
        notify('Image generated. Browser storage was unavailable, so this image may not remain in history after you close the page.');
        return;
      }
      notify('Your image is ready.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const surpriseMe = () => {
    const randomPrompt = SURPRISE_PROMPTS[Math.floor(Math.random() * SURPRISE_PROMPTS.length)];
    const randomStyle = STYLES[Math.floor(Math.random() * STYLES.length)].name;
    const randomAspect = ASPECTS[Math.floor(Math.random() * ASPECTS.length)].ratio;
    setPrompt(randomPrompt);
    setStyle(randomStyle);
    setAspectRatio(randomAspect);
    setShowAllStyles(true);
    notify('A fresh creative direction is ready.');
  };

  const handleUseAgain = (record: DisplayRecord) => {
    setPrompt(record.prompt);
    setStyle(record.style);
    setAspectRatio(record.aspectRatio);
    setCurrent(record);
    setView('create');
    notify('Previous settings restored.');
  };

  const handleDelete = async (record: DisplayRecord) => {
    try {
      await deleteHistoryRecord(record.id);
      setHistory((previous) => previous.filter((item) => item.id !== record.id));
      if (current?.id === record.id) setCurrent(null);
      URL.revokeObjectURL(record.previewUrl);
      notify('Image removed from your history.');
    } catch {
      notify('Could not remove this image from history.');
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearHistoryRecords();
      history.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      setHistory([]);
      setCurrent(null);
      setConfirmClear(false);
      notify('Your local history has been cleared.');
    } catch {
      notify('Could not clear your history.');
    }
  };

  const copyPrompt = async () => {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current.prompt);
      notify('Prompt copied to clipboard.');
    } catch {
      notify('Clipboard access was blocked by your browser.');
    }
  };

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup">
          <img src="/logo.svg" alt="PRISMORA" className="brand-symbol" />
          <div className="brand-copy">
            <span className="brand-name">PRISMORA</span>
            <span className="brand-caption">AI IMAGE STUDIO</span>
          </div>
          <button className="icon-button mobile-close" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)}><X size={18} /></button>
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <button className={`nav-item ${view === 'create' ? 'active' : ''}`} onClick={() => { setView('create'); setMobileMenuOpen(false); }}>
            <span className="nav-icon"><WandSparkles size={18} /></span><span>Create image</span>
          </button>
          <button className={`nav-item ${view === 'history' ? 'active' : ''}`} onClick={() => { setView('history'); setMobileMenuOpen(false); }}>
            <span className="nav-icon"><Clock3 size={18} /></span><span>Generation history</span><span className="nav-count">{history.length}</span>
          </button>
        </nav>

        <div className="sidebar-divider" />
        <div className="sidebar-section-label">YOUR STUDIO</div>
        <div className="studio-card">
          <div className="studio-card-icon"><Layers3 size={18} /></div>
          <div className="studio-card-copy"><strong>Creative space</strong><span>Your ideas, beautifully made.</span></div>
          <span className="online-dot" />
        </div>

        <div className="sidebar-spacer" />
        <div className="sidebar-footer">
          <div className="footer-note"><span className="footer-sparkle"><Sparkles size={13} /></span><span>Made for curious minds.</span></div>
          <button className="theme-toggle" onClick={() => setTheme((value) => value === 'dark' ? 'light' : 'dark')}>
            <span className="theme-toggle-icon">{theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}</span>
            <span>{theme === 'dark' ? 'Dark appearance' : 'Light appearance'}</span>
            <span className={`toggle-track ${theme === 'light' ? 'toggle-on' : ''}`}><span /></span>
          </button>
          <div className="sidebar-version">PRISMORA STUDIO <span>V1.0</span></div>
        </div>
      </aside>

      {mobileMenuOpen && <button className="sidebar-backdrop" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)} />}

      <section className="main-panel">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu-button" aria-label="Open menu" onClick={() => setMobileMenuOpen(true)}><Grid2X2 size={19} /></button>
            <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{view === 'create' ? 'Create image' : 'Generation history'}</strong></div>
          </div>
          <div className="topbar-actions">
            <span className="engine-status"><span className="status-pulse" /> FLUX.2 KLEIN</span>
            <button className="topbar-theme" aria-label="Toggle theme" onClick={() => setTheme((value) => value === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <div className="avatar-mark"><img src="/logo.svg" alt="Prismora" /></div>
          </div>
        </header>

        {view === 'create' ? (
          <div className="content-area">
            <div className="page-heading">
              <div>
                <div className="eyebrow"><span className="eyebrow-line" /> THE CREATIVE CANVAS</div>
                <h1>Imagine it. <span>Generate it.</span></h1>
                <p>Turn a simple thought into something extraordinary.</p>
              </div>
              <button className="secondary-button new-image-button" onClick={() => { setPrompt(''); setCurrent(null); }}><Plus size={16} /> New canvas</button>
            </div>

            <div className="studio-layout">
              <section className="controls-panel">
                <div className="panel-title-row">
                  <div className="panel-title-icon"><WandSparkles size={17} /></div>
                  <div><h2>Image settings</h2><p>Shape your next creation</p></div>
                </div>

                <div className="form-section prompt-section">
                  <div className="field-heading"><label htmlFor="image-prompt">Your prompt</label><span className="field-count">{prompt.length}/1800</span></div>
                  <textarea
                    id="image-prompt"
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value.slice(0, 1800))}
                    placeholder="Describe the image you want to create... Be as imaginative as you like."
                    maxLength={1800}
                  />
                  <button className="surprise-button" onClick={surpriseMe}><Sparkles size={14} /> Surprise me <span>Let inspiration lead</span></button>
                </div>

                <div className="form-section style-section">
                  <div className="field-heading"><label>Visual style</label><span className="field-meta">15 CURATED STYLES</span></div>
                  <div className="style-search-wrap"><Search size={14} /><input aria-label="Search styles" placeholder="Find a style..." value={styleSearch} onChange={(event) => setStyleSearch(event.target.value)} /></div>
                  <div className="style-grid">
                    {(styleSearch ? filteredStyles : showAllStyles ? filteredStyles : filteredStyles.slice(0, 6)).map((item) => (
                      <button key={item.name} className={`style-option ${style === item.name ? 'selected' : ''}`} onClick={() => setStyle(item.name)}>
                        <span className="style-symbol">{item.icon}</span><span className="style-text"><strong>{item.name}</strong><small>{item.note}</small></span>
                        {style === item.name && <span className="style-check"><Check size={11} /></span>}
                      </button>
                    ))}
                  </div>
                  {filteredStyles.length === 0 && <div className="no-styles">No styles match that search.</div>}
                  {!styleSearch && <button className="show-styles-button" onClick={() => setShowAllStyles((value) => !value)}>{showAllStyles ? 'Show fewer styles' : 'Explore all 15 styles'} <ChevronDown size={14} className={showAllStyles ? 'rotate-chevron' : ''} /></button>}
                </div>

                <div className="form-section aspect-section">
                  <div className="field-heading"><label>Aspect ratio</label><span className="field-meta">CANVAS SIZE</span></div>
                  <div className="aspect-grid">
                    {ASPECTS.map((item) => (
                      <button key={item.ratio} className={`aspect-option ${aspectRatio === item.ratio ? 'selected' : ''}`} onClick={() => setAspectRatio(item.ratio)}>
                        <span className={`ratio-shape ratio-${item.shape}`}><i /></span>
                        <span className="ratio-name">{item.label}</span>
                        <span className="ratio-value">{item.ratio}</span>
                      </button>
                    ))}
                  </div>
                  <div className="dimensions-note"><span className="dimensions-dot" /> Output dimensions <strong>{activeAspect.width} × {activeAspect.height}px</strong></div>
                </div>

                <div className="generate-area">
                  <button className="generate-button" onClick={handleGenerate} disabled={isGenerating || !prompt.trim()}>
                    {isGenerating ? <><LoaderCircle size={18} className="spin" /> Creating your image...</> : <><Sparkles size={18} /> Generate image <ArrowRight size={17} /></>}
                  </button>
                  <div className="generate-caption"><span className="secure-dot" /> Cloudflare credentials stay server-side</div>
                </div>
              </section>

              <section className="preview-column">
                <div className="preview-topline"><div className="preview-title-wrap"><span className="preview-live-dot" /><span>LIVE PREVIEW</span></div><div className="preview-meta">{current ? `${current.width} × ${current.height} PX` : 'YOUR CANVAS AWAITS'}</div></div>
                <div className={`preview-stage ${current ? 'has-image' : ''}`}>
                  {isGenerating ? (
                    <div className="generation-state">
                      <div className="generation-orbit"><div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" /><div className="orbit-core"><img src="/logo.svg" alt="" /></div><span className="orbit-star star-a">✦</span><span className="orbit-star star-b">✧</span></div>
                      <h3>Bringing your vision to life</h3><p>Our image model is crafting every detail.</p>
                      <div className="loading-bar"><span /></div>
                      <span className="loading-caption">THIS CAN TAKE A FEW MOMENTS</span>
                    </div>
                  ) : current ? (
                    <div className="result-wrap">
                      <img src={current.previewUrl} alt={current.prompt} className="result-image" />
                      <div className="result-overlay-top"><span className="result-badge"><span /> GENERATED</span><button className="result-more" aria-label="Copy prompt" onClick={copyPrompt}><Copy size={15} /></button></div>
                      <div className="result-overlay-bottom"><div className="result-caption"><strong>{current.style} creation</strong><span>{current.aspectRatio} · {formatDate(current.createdAt)}</span></div><button className="download-button" onClick={() => downloadRecord(current)}><Download size={16} /> Download</button></div>
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-art"><div className="empty-glow" /><div className="empty-prism"><img src="/logo.svg" alt="" /></div><span className="empty-star star-one">✦</span><span className="empty-star star-two">✧</span><span className="empty-star star-three">·</span><span className="empty-orbit orbit-left" /><span className="empty-orbit orbit-right" /></div>
                      <div className="empty-copy"><span className="empty-kicker">A WORLD OF POSSIBILITIES</span><h3>Your next masterpiece<br /><span>starts with a prompt.</span></h3><p>Your generated image will appear here.<br />Let your imagination take the lead.</p></div>
                      <div className="empty-hints"><span><ImageIcon size={13} /> HD output</span><span><Sparkles size={13} /> 15 styles</span><span><Layers3 size={13} /> 8 ratios</span></div>
                    </div>
                  )}
                </div>
                <div className="preview-footer"><div className="preview-footer-left"><span className="mini-prism"><img src="/logo.svg" alt="" /></span><span>Made with <strong>PRISMORA</strong></span></div><span>CREATE WITHOUT LIMITS</span></div>

                {current && !isGenerating && (
                  <div className="current-details"><div className="details-heading"><span>CREATION DETAILS</span><button onClick={copyPrompt}><Copy size={13} /> Copy prompt</button></div><p>{current.prompt}</p><div className="detail-chips"><span>{current.style}</span><span>{current.aspectRatio}</span><span>{current.width} × {current.height}px</span></div></div>
                )}

                {history.length > 0 && (
                  <div className="recent-section"><div className="recent-heading"><div><h3>Recent creations</h3><span>Your latest moments of inspiration</span></div><button onClick={() => setView('history')}>View all <ArrowRight size={14} /></button></div><div className="recent-strip">{history.slice(0, 4).map((item) => <button className={`recent-thumb ${current?.id === item.id ? 'active' : ''}`} key={item.id} onClick={() => handleUseAgain(item)}><img src={item.previewUrl} alt={item.prompt} /><span>{item.style}</span></button>)}</div></div>
                )}
              </section>
            </div>
            <footer className="page-footer"><span>© 2026 PRISMORA STUDIO</span><span>CRAFTED FOR YOUR IMAGINATION</span></footer>
          </div>
        ) : (
          <div className="content-area history-page">
            <div className="page-heading history-heading">
              <div><div className="eyebrow"><span className="eyebrow-line" /> YOUR CREATIVE JOURNEY</div><h1>Every idea, <span>remembered.</span></h1><p>Revisit, reuse and download your previous creations.</p></div>
              <div className="history-actions"><button className="secondary-button" onClick={() => { setView('create'); setCurrent(null); }}><Plus size={16} /> Create new</button>{history.length > 0 && <button className="clear-history-button" onClick={() => setConfirmClear(true)}><Trash2 size={15} /> Clear history</button>}</div>
            </div>

            <div className="history-toolbar"><div className="history-count"><strong>{history.length}</strong> {history.length === 1 ? 'creation' : 'creations'} saved on this device</div><div className="history-search"><Search size={15} /><input value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="Search your creations..." /></div></div>

            {history.length === 0 ? (
              <div className="history-empty"><div className="history-empty-icon"><Clock3 size={25} /></div><h3>Your story starts here.</h3><p>Images you generate will be saved in this browser, ready whenever inspiration strikes again.</p><button className="generate-button history-create-button" onClick={() => setView('create')}><Sparkles size={17} /> Create your first image <ArrowRight size={16} /></button></div>
            ) : filteredHistory.length === 0 ? (
              <div className="no-history-results"><Search size={22} /><strong>No creations found</strong><span>Try another search term.</span></div>
            ) : (
              <div className="history-grid">{filteredHistory.map((item) => (
                <article className="history-card" key={item.id}>
                  <button className="history-card-image" onClick={() => handleUseAgain(item)} aria-label="Open this creation"><img src={item.previewUrl} alt={item.prompt} /><span className="history-open-overlay">Open creation <ArrowRight size={14} /></span></button>
                  <div className="history-card-content"><div className="history-card-meta"><span>{item.style}</span><span>{item.aspectRatio}</span></div><p>{item.prompt}</p><div className="history-card-bottom"><span>{formatDate(item.createdAt)}</span><div><button title="Use these settings again" aria-label="Use again" onClick={() => handleUseAgain(item)}><WandSparkles size={15} /></button><button title="Download image" aria-label="Download image" onClick={() => downloadRecord(item)}><Download size={15} /></button><button title="Delete image" aria-label="Delete image" onClick={() => handleDelete(item)}><Trash2 size={15} /></button></div></div></div>
                </article>
              ))}</div>
            )}
            <footer className="page-footer"><span>© 2026 PRISMORA STUDIO</span><span>YOUR CREATIVE JOURNEY, ALL IN ONE PLACE</span></footer>
          </div>
        )}
      </section>

      {confirmClear && <div className="modal-backdrop" role="presentation"><div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="clear-title"><div className="confirm-icon"><Trash2 size={20} /></div><h3 id="clear-title">Clear your history?</h3><p>This will permanently remove all generated images saved in this browser. This action cannot be undone.</p><div className="modal-actions"><button className="secondary-button" onClick={() => setConfirmClear(false)}>Cancel</button><button className="danger-button" onClick={handleClearHistory}>Clear everything</button></div></div></div>}
      {toast && <div className="toast-message"><span className="toast-icon"><Check size={14} /></span>{toast}<button onClick={() => setToast('')} aria-label="Dismiss notification"><X size={14} /></button></div>}
    </main>
  );
}
