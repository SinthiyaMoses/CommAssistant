import React, { useState, useRef, useEffect } from 'react';
import {
  Image,
  Upload,
  Camera,
  Volume2,
  Copy,
  Check,
  FileText,
  Sparkles,
  Loader2,
  Globe,
  VideoOff,
  RefreshCw,
  Search,
  ChevronDown,
  VolumeX,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAudio } from '../../contexts/AudioContext';
import { extractAndTranslateImageAPI, translateTextAPI } from '../../services/api';
import { OCRResult, SupportedLanguageCode, LanguageInfo } from '../../types';
import { getLanguageByCode, SUPPORTED_LANGUAGES } from '../../services/languageService';

interface SampleDoc {
  id: string;
  title: string;
  icon: string;
  sourceLang: SupportedLanguageCode;
  sourceLangName: string;
  extractedText: string;
}

const SAMPLE_DOCUMENTS: SampleDoc[] = [
  {
    id: 'sample-ta',
    title: 'Tamil Hospital Signboard',
    icon: '🏥',
    sourceLang: 'ta',
    sourceLangName: 'Tamil',
    extractedText: 'அவசர சிகிச்சை பிரிவு மற்றும் கண் மருத்துவமனை',
  },
  {
    id: 'sample-hi',
    title: 'Hindi Railway Station Notice',
    icon: '🚆',
    sourceLang: 'hi',
    sourceLangName: 'Hindi',
    extractedText: 'यात्रियों से अनुरोध है कि वे प्लेटफार्म संख्या ३ पर स्वच्छता बनाए रखें और सुरक्षा नियमों का पालन करें।',
  },
  {
    id: 'sample-en',
    title: 'English Industrial Warning',
    icon: '⚠️',
    sourceLang: 'en',
    sourceLangName: 'English',
    extractedText: 'Warning: High Voltage Electrical Area. Authorized Personnel Only. Safety Helmet Required.',
  },
  {
    id: 'sample-te',
    title: 'Telugu Pharmacy & Clinic',
    icon: '🏬',
    sourceLang: 'te',
    sourceLangName: 'Telugu',
    extractedText: 'అత్యవసర ఔషధ విక్రయ కేంద్రం మరియు ఉచిత వైద్య పరీక్షల విభాగం.',
  },
  {
    id: 'sample-ja',
    title: 'Japanese Restaurant Menu',
    icon: '🍜',
    sourceLang: 'ja',
    sourceLangName: 'Japanese',
    extractedText: '本日のおすすめ：特製醤油ラーメンと手作り焼き餃子セット（ランチ限定価格）。',
  },
  {
    id: 'sample-es',
    title: 'Spanish Metro Transit Notice',
    icon: '🏛️',
    sourceLang: 'es',
    sourceLangName: 'Spanish',
    extractedText: 'Parada de Autobús Metropolitano. Líneas 42 y 105 con destino al Centro Histórico y Terminal.',
  },
];

export const OCRWorkspace: React.FC = () => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);

  // Live Camera Scanner states
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Language selection dropdown state
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState<boolean>(false);
  const [langSearch, setLangSearch] = useState<string>('');
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { targetLanguage, targetLanguageInfo, setTargetLanguage } = useLanguage();
  const { speakText, isSpeaking, stopSpeaking } = useAudio();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      // Fallback
      alert('Camera access unavailable. Please use file upload instead.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureCameraFrame = async () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setImagePreview(dataUrl);
    stopCamera();

    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        await processImageOCR(file);
      }
    }, 'image/jpeg', 0.9);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopCamera();
    setSelectedSampleId(null);
    setImagePreview(URL.createObjectURL(file));
    setOcrResult(null);
    await processImageOCR(file);
  };

  const processImageOCR = async (file: File) => {
    setIsProcessing(true);
    try {
      const result = await extractAndTranslateImageAPI(file, targetLanguage);
      setOcrResult(result);
    } catch (err) {
      console.warn('OCR execution notice:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Translates extracted text to ANY newly selected language immediately
   */
  const handleTargetLanguageChange = async (newLang: SupportedLanguageCode) => {
    setTargetLanguage(newLang);
    setIsLangDropdownOpen(false);

    // If text is already extracted, instantly translate it to the new language!
    if (ocrResult?.extractedText) {
      setIsProcessing(true);
      try {
        const translation = await translateTextAPI(
          ocrResult.extractedText,
          newLang,
          ocrResult.detectedLanguage as SupportedLanguageCode
        );
        const tgtInfo = getLanguageByCode(newLang);

        setOcrResult((prev) =>
          prev
            ? {
                ...prev,
                translatedText: translation.translatedText,
                transliteration: translation.transliteration,
                targetLanguage: newLang,
                targetLanguageName: tgtInfo.name,
              }
            : null
        );
      } catch (err) {
        console.warn('OCR re-translation error:', err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleSelectSample = async (sample: SampleDoc) => {
    setSelectedSampleId(sample.id);
    stopCamera();
    setImagePreview(null);
    setIsProcessing(true);

    try {
      // Translate the sample into WHATEVER language the user has chosen
      const translation = await translateTextAPI(sample.extractedText, targetLanguage, sample.sourceLang);
      const tgtInfo = getLanguageByCode(targetLanguage);

      setOcrResult({
        extractedText: sample.extractedText,
        detectedLanguage: sample.sourceLang,
        detectedLanguageName: sample.sourceLangName,
        translatedText: translation.translatedText,
        transliteration: translation.transliteration,
        targetLanguage,
        targetLanguageName: tgtInfo.name,
        provider: 'multilingual-sample-matrix',
      });
    } catch (err) {
      console.warn('Sample translation error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (ocrResult?.translatedText) {
      navigator.clipboard.writeText(ocrResult.translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSpeak = () => {
    if (!ocrResult?.translatedText) return;
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speakText(ocrResult.translatedText, ocrResult.targetLanguage);
    }
  };

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(
    (lang: LanguageInfo) =>
      lang.name.toLowerCase().includes(langSearch.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(langSearch.toLowerCase()) ||
      lang.code.toLowerCase().includes(langSearch.toLowerCase())
  );

  // Quick chips for top languages
  const QUICK_LANGS: SupportedLanguageCode[] = ['ta', 'hi', 'en', 'te', 'ml', 'kn', 'bn', 'es', 'fr', 'ja'];

  return (
    <div className="space-y-6 max-w-5xl mx-auto" role="region" aria-label="Visual OCR Document & Signboard Translation">
      {/* Header with Title and Target Language Selector */}
      <div className="glass-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-cyan-500/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
            <Image size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Visual OCR Document & Sign Translation</h2>
              <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-400/30">
                All 20+ Languages
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Extract text from images, signboards, notices, menus and translate into{' '}
              <span className="text-cyan-300 font-bold">{targetLanguageInfo.name}</span> or any chosen language.
            </p>
          </div>
        </div>

        {/* Target Language Dropdown */}
        <div className="relative" ref={langDropdownRef}>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">Translate To:</span>
            <button
              type="button"
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/40 text-xs font-bold text-white hover:border-cyan-400 transition-all shadow-md"
            >
              <Globe size={14} className="text-cyan-400" />
              <span>{targetLanguageInfo.flag}</span>
              <span>{targetLanguageInfo.name}</span>
              <span className="text-slate-400 text-[11px] font-normal">({targetLanguageInfo.nativeName})</span>
              <ChevronDown
                size={13}
                className={`text-slate-400 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          {/* Language Popover Menu */}
          {isLangDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-slate-950/95 border border-cyan-500/40 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-xl animate-fade-in">
              <div className="mb-2 p-1">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search any language..."
                    value={langSearch}
                    onChange={(e) => setLangSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                {filteredLanguages.map((lang) => {
                  const isSelected = lang.code === targetLanguage;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleTargetLanguageChange(lang.code as SupportedLanguageCode)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition-all ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/40'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{lang.flag}</span>
                        <div>
                          <span className="font-medium">{lang.name}</span>
                          <span className="text-[10px] text-slate-400 ml-1.5 font-indic">({lang.nativeName})</span>
                        </div>
                      </div>
                      {isSelected && <Check size={12} className="text-cyan-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Language Selection Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider shrink-0 mr-1">
          Quick Lang:
        </span>
        {QUICK_LANGS.map((code) => {
          const info = getLanguageByCode(code);
          const isActive = targetLanguage === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => handleTargetLanguageChange(code)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20 scale-105'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
              }`}
            >
              <span>{info.flag}</span>
              <span>{info.name}</span>
            </button>
          );
        })}
      </div>

      {/* Multi-Language Sample Signboards & Documents Bar */}
      <div className="glass-panel p-3.5 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Sparkles size={13} className="text-cyan-400" />
            <span>Multi-Language Sample Signboards (Click to Test Instant OCR):</span>
          </span>
          <span className="text-[10px] font-mono text-cyan-300">Translates to {targetLanguageInfo.name}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {SAMPLE_DOCUMENTS.map((sample) => {
            const isSelected = selectedSampleId === sample.id;
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between min-h-[64px] ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-400/50 shadow-md'
                    : 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-cyan-500/30'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-base">{sample.icon}</span>
                  <span className="text-[10px] font-mono bg-white/10 text-slate-300 px-1 rounded">
                    {sample.sourceLangName}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-200 line-clamp-1">{sample.title}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Upload Zone & Output Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Upload & Image Dropzone */}
        <div className="glass-panel p-5 flex flex-col justify-between min-h-[340px]">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Upload size={16} className="text-cyan-400" /> Image Source / Camera Scanner
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={isCameraActive ? stopCamera : startCamera}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1 transition-all ${
                    isCameraActive
                      ? 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                      : 'bg-cyan-500/10 text-cyan-300 border-cyan-400/30 hover:bg-cyan-500/20'
                  }`}
                >
                  {isCameraActive ? (
                    <>
                      <VideoOff size={12} /> Close Camera
                    </>
                  ) : (
                    <>
                      <Camera size={12} /> Scan with Camera
                    </>
                  )}
                </button>
              </div>
            </div>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
            />

            {/* Live Camera Scanner Viewport */}
            {isCameraActive ? (
              <div className="relative rounded-xl overflow-hidden border border-cyan-500/40 max-h-64 flex flex-col items-center justify-center bg-slate-950">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-56 object-cover" />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-32 border-2 border-dashed border-cyan-400 rounded-lg animate-pulse" />
                </div>
                <div className="absolute bottom-2 inset-x-0 flex justify-center z-10">
                  <button
                    type="button"
                    onClick={captureCameraFrame}
                    className="btn-primary text-xs px-4 py-1.5 shadow-lg flex items-center gap-1.5"
                  >
                    <Camera size={13} />
                    <span>Snap & Translate</span>
                  </button>
                </div>
              </div>
            ) : imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-white/10 max-h-64 flex items-center justify-center bg-slate-950">
                <img src={imagePreview} alt="Uploaded document" className="max-h-64 object-contain" />
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/15 hover:border-cyan-400/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-white/5 hover:bg-white/10"
              >
                <div className="h-12 w-12 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3">
                  <Camera size={24} />
                </div>
                <p className="text-sm font-medium text-slate-200">Click or Drag & Drop Image</p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports PNG, JPG, WEBP (Signboards, Documents, Menus, Notices)
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              Choose From Device
            </button>
            {isProcessing && (
              <span className="text-xs text-cyan-300 flex items-center gap-1.5 font-mono">
                <Loader2 size={13} className="animate-spin" /> Processing OCR & Translation...
              </span>
            )}
          </div>
        </div>

        {/* OCR Extracted & Translated Output */}
        <div className="glass-panel p-5 flex flex-col justify-between min-h-[340px] border border-cyan-500/20">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <FileText size={16} className="text-emerald-400" /> Extracted & Translated Result
              </h3>
              {ocrResult && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono rounded bg-cyan-500/20 text-cyan-300 px-2 py-0.5 border border-cyan-500/30">
                    {ocrResult.detectedLanguageName} → {ocrResult.targetLanguageName}
                  </span>
                </div>
              )}
            </div>

            {ocrResult ? (
              <div className="space-y-4">
                {/* Original Extracted Text */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400">
                      Original Extracted Text ({ocrResult.detectedLanguageName}):
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 font-indic font-medium leading-relaxed">
                    "{ocrResult.extractedText}"
                  </p>
                </div>

                {/* Translated Text into Target Language */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/50 via-slate-900/90 to-blue-950/50 border border-cyan-500/30 shadow-lg">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase tracking-wider font-mono text-cyan-300 font-bold flex items-center gap-1.5">
                      <Sparkles size={11} /> Translated into {ocrResult.targetLanguageName}:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleTargetLanguageChange(targetLanguage)}
                      title="Re-translate"
                      className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                    >
                      <RefreshCw size={10} className={isProcessing ? 'animate-spin' : ''} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  <p className="text-lg md:text-xl font-bold text-white font-indic leading-snug">
                    "{ocrResult.translatedText}"
                  </p>

                  {ocrResult.transliteration && (
                    <div className="mt-2.5 pt-2 border-t border-cyan-500/20 text-xs text-cyan-200/80 font-mono">
                      <span className="text-[10px] uppercase text-cyan-400 mr-1.5">Pronunciation:</span>
                      {ocrResult.transliteration}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-14 text-center text-slate-500">
                <FileText size={36} className="mx-auto mb-2 text-slate-600 opacity-50" />
                <p className="text-xs">
                  Upload an image, scan with camera, or click any sample signboard above.
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Text will be extracted and translated into{' '}
                  <span className="text-cyan-400 font-bold">{targetLanguageInfo.name}</span>.
                </p>
              </div>
            )}
          </div>

          {ocrResult && (
            <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSpeak}
                  className={`btn-primary text-xs px-3.5 py-1.5 inline-flex items-center gap-1.5 ${
                    isSpeaking ? 'bg-cyan-400 text-slate-950 font-bold animate-pulse' : ''
                  }`}
                >
                  {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  <span>{isSpeaking ? 'Stop Audio' : `Speak in ${ocrResult.targetLanguageName}`}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="btn-icon h-8 w-8"
                  title="Copy Translated Text"
                  aria-label="Copy Translated Text"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>

              <span className="text-[10px] font-mono text-slate-500">
                Provider: {ocrResult.provider || 'Gemini Vision AI'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
