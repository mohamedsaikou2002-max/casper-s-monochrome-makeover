import { useState, useRef } from 'react';
import { api } from '@/lib/api';

export default function FileScan() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setLoading(true);
    setResult(null);
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const data = await api.scanFile(fd);
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const Verdict = ({ v }: { v: string }) => {
    const cls = v === 'MALICIOUS' ? 'border-primary-hi text-primary-hi shadow-[0_0_10px_rgba(255,0,0,0.4)] animate-pulse' : 
                v === 'SUSPICIOUS' ? 'border-orange-600 text-orange-600' : 
                v === 'CLEAN' ? 'border-grey-dim text-grey' : 'border-black/50 text-grey-dim';
    return (
      <div className={`inline-block px-4 py-1.5 border mb-4 text-[11px] tracking-[3px] font-bold uppercase ${cls}`}>
        {v}
      </div>
    );
  };

  return (
    <div className="panel animate-in fade-in duration-300">
      <div className="panel-header">
        <span className="panel-title uppercase tracking-[3px]">File Integrity Scan</span>
        <span className="panel-badge uppercase tracking-wider">VirusTotal Engine</span>
      </div>
      <div className="panel-body">
        <div 
          className={`border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
            dragging ? 'border-primary-hi bg-primary-hi/5 text-primary-hi' : 'border-border-hi bg-black/5 text-grey-dim hover:border-primary-hi hover:text-grey'
          }`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-3xl mb-3 opacity-40">⬡</div>
          <div className="text-[11px] tracking-widest uppercase">
            Drop file to scan or click to browse
          </div>
        </div>
        <input type="file" className="hidden" ref={fileInputRef} onChange={onFileChange} />

        {loading && (
          <div className="text-grey-dim text-[11px] tracking-widest mt-6 flex items-center">
            <span className="spin mr-2">◈</span> Hashing & Querying VirusTotal...
          </div>
        )}

        {error && <div className="text-primary-hi text-[11px] mt-6">⚠ {error}</div>}

        {result && (
          <div className="mt-8 animate-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-border pb-4">
              <div>
                <div className="text-[10px] text-grey-dim tracking-[2px] mb-1">FILENAME</div>
                <div className="text-white text-sm font-bold truncate max-w-sm">{result.filename}</div>
              </div>
              <div className="md:text-right">
                <div className="text-[10px] text-grey-dim tracking-[2px] mb-1">SHA-256</div>
                <div className="text-grey text-[10px] font-mono break-all max-w-[300px]">{result.sha256}</div>
              </div>
            </div>

            {result.vt ? (
              <div className="mt-6">
                <div className="text-[10px] text-grey-dim tracking-[2px] mb-2 uppercase">Analysis Result</div>
                <Verdict v={result.vt.verdict} />
                
                {result.vt.verdict !== 'UNKNOWN' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="panel mb-0 p-3 text-center border-red-900/30">
                      <div className="text-[9px] text-primary-hi mb-1">MALICIOUS</div>
                      <div className="text-xl font-bold text-primary-hi">{result.vt.malicious}</div>
                    </div>
                    <div className="panel mb-0 p-3 text-center border-orange-900/30">
                      <div className="text-[9px] text-orange-600 mb-1">SUSPICIOUS</div>
                      <div className="text-xl font-bold text-orange-600">{result.vt.suspicious}</div>
                    </div>
                    <div className="panel mb-0 p-3 text-center">
                      <div className="text-[9px] text-grey mb-1">CLEAN</div>
                      <div className="text-xl font-bold text-white">{result.vt.clean}</div>
                    </div>
                    <div className="panel mb-0 p-3 text-center">
                      <div className="text-[9px] text-grey-dim mb-1">TOTAL ENGINES</div>
                      <div className="text-xl font-bold text-grey">{result.vt.total}</div>
                    </div>
                  </div>
                )}
                {result.vt.note && <div className="text-[11px] text-grey-dim italic mt-3">Note: {result.vt.note}</div>}
              </div>
            ) : (
              <div className="text-grey-dim text-[11px] bg-white/5 p-4 uppercase tracking-[2px]">VirusTotal API connection failed or key missing</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
