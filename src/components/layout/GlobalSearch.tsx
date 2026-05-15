'use client';

import { useState, useEffect } from 'react';
import { Search, File, Folder, Calendar, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item: any) => {
    setQuery('');
    setIsOpen(false);
    if (item.type === 'file' || item.type === 'folder') {
      router.push(`/archivos/${item.folderId || item.id}`);
    } else if (item.type === 'payment') {
      router.push('/pagos');
    }
  };

  return (
    <div className="relative w-full max-w-[400px]">
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-amber-500 transition-colors" size={18} />
        <Input
          placeholder="Buscar archivos, pagos..."
          className="pl-10 h-10 bg-muted/50 border-transparent focus:bg-background transition-all"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {query && (
          <button 
            onClick={() => { setQuery(''); setResults([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && (query.length >= 2 || loading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">Buscando...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="max-h-[400px] overflow-y-auto p-2">
              {results.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors text-left group"
                >
                  <div className={cn(
                    "p-2 rounded-lg",
                    item.type === 'file' ? "bg-blue-500/10 text-blue-600" :
                    item.type === 'folder' ? "bg-amber-500/10 text-amber-600" :
                    "bg-emerald-500/10 text-emerald-600"
                  )}>
                    {item.type === 'file' && <File size={16} />}
                    {item.type === 'folder' && <Folder size={16} />}
                    {item.type === 'payment' && <Calendar size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-amber-600 transition-colors">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.type === 'payment' ? 'Pago' : item.type}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm">No se encontraron resultados</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
