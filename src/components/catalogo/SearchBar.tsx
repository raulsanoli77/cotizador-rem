'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
}

export default function SearchBar({ onSearch, placeholder = 'Buscar por número de parte, marca, descripción...', initialValue = '' }: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query.trim());
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); if (!e.target.value) onSearch(''); }}
        placeholder={placeholder}
        className="w-full pl-11 pr-11 py-3 rounded-xl border-2 border-slate-300 hover:border-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 bg-white text-slate-900 font-medium text-sm focus:outline-none shadow-sm transition-all"
      />
      {query && (
        <button type="button" onClick={handleClear} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
