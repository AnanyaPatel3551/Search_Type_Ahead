import { useState, useEffect, useRef } from 'react';

interface Suggestion {
  query: string;
  count: number;
}

function App() {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);
  
  // Service states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<any | null>(null);
  const [trending, setTrending] = useState<Suggestion[]>([]);
  const [latency, setLatency] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Debounce prefix input to fetch suggestions
  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setSuggestions([]);
      setFocusedIndex(-1);
      setLatency(null);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await fetch(`http://localhost:5000/autocomplete?prefix=${encodeURIComponent(trimmed)}`);
        if (!response.ok) throw new Error('Autocomplete failed');
        const data = await response.json();
        setSuggestions(data.results);
        setLatency(data.latencyMs);
        setFocusedIndex(-1);
      } catch (err) {
        console.error(err);
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // 2. Fetch trending queries
  const fetchTrending = async () => {
    try {
      const response = await fetch('http://localhost:5000/trending');
      if (response.ok) {
        const data = await response.json();
        setTrending(data.results);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTrending();
    const trendingInterval = setInterval(fetchTrending, 5000);
    return () => clearInterval(trendingInterval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsInputFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 3. Post search query to backend
  const handleSearchSubmit = async (queryToSubmit: string) => {
    const trimmed = queryToSubmit.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setSearchError(null);
    setLastResponse(null);
    setIsInputFocused(false);

    try {
      const response = await fetch('http://localhost:5000/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: trimmed }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Search failed');
      }

      setLastResponse(data);
      setSearchTerm('');
      setSuggestions([]);
      setFocusedIndex(-1);
      
      // Update trending list
      setTimeout(fetchTrending, 600);
    } catch (err: any) {
      console.error(err);
      setSearchError(err.message || 'Failed to submit search.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Keyboard controls
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsInputFocused(true);
      setFocusedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsInputFocused(true);
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
        const selectedQuery = suggestions[focusedIndex].query;
        setSearchTerm(selectedQuery);
        setSuggestions([]);
        setFocusedIndex(-1);
        handleSearchSubmit(selectedQuery);
      } else {
        handleSearchSubmit(searchTerm);
      }
    } else if (e.key === 'Escape') {
      setIsInputFocused(false);
      setFocusedIndex(-1);
    }
  };

  // 5. Highlighting matched prefix vs suffix (Google style)
  const renderHighlightedText = (text: string, prefix: string) => {
    if (!prefix) return <span>{text}</span>;
    const lowerText = text.toLowerCase();
    const lowerPrefix = prefix.trim().toLowerCase();
    const matchIdx = lowerText.indexOf(lowerPrefix);

    if (matchIdx !== 0) {
      return <span>{text}</span>;
    }

    const prefixPart = text.substring(0, prefix.length);
    const suffixPart = text.substring(prefix.length);

    return (
      <span>
        {prefixPart}<strong>{suffixPart}</strong>
      </span>
    );
  };

  const showDropdown = isInputFocused && (suggestions.length > 0 || (searchTerm.trim() === '' && trending.length > 0));

  return (
    <div className="google-layout-wrapper">
      
      <div className="google-main-content">
        
        {/* Multicolored Google Style Logo */}
        <div className="google-logo">
          <span className="logo-blue">T</span>
          <span className="logo-red">y</span>
          <span className="logo-yellow">p</span>
          <span className="logo-blue">e</span>
          <span className="logo-green">a</span>
          <span className="logo-red">h</span>
          <span className="logo-yellow">e</span>
          <span className="logo-blue">a</span>
          <span className="logo-green">d</span>
        </div>

        {/* Unified Search Input & Suggestions Block */}
        <div 
          className={`google-search-box-container ${showDropdown ? 'dropdown-open' : ''}`}
          ref={containerRef}
        >
          <div className="google-search-bar">
            {/* Magnifying Glass Icon Left */}
            <span className="search-icon-left">
              <svg focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path>
              </svg>
            </span>

            <input
              type="text"
              className="google-search-input"
              placeholder="Search or type URL"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsInputFocused(true)}
              disabled={isLoading}
              autoComplete="off"
            />

            {/* Clear Button Right */}
            {searchTerm && (
              <span className="search-icon-clear" onClick={() => { setSearchTerm(''); setSuggestions([]); }}>
                <svg focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
                </svg>
              </span>
            )}

            {/* Microphone Icon Mockup Right */}
            <span className="search-icon-mic">
              <svg focusable="false" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" fill="#4285f4"></path>
              </svg>
            </span>
          </div>

          {/* Autocomplete Dropdown List */}
          {showDropdown && (
            <div className="google-suggestions-dropdown">
              <div className="dropdown-divider"></div>
              
              {/* Dynamic query suggestions */}
              {suggestions.length > 0 ? (
                suggestions.map((item, idx) => (
                  <div
                    key={idx}
                    className={`google-suggestion-row ${focusedIndex === idx ? 'focused' : ''}`}
                    onClick={() => {
                      setSearchTerm(item.query);
                      handleSearchSubmit(item.query);
                    }}
                    onMouseEnter={() => setFocusedIndex(idx)}
                  >
                    <span className="suggestion-icon">
                      <svg focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path>
                      </svg>
                    </span>
                    <span className="suggestion-text-content">
                      {renderHighlightedText(item.query, searchTerm)}
                    </span>
                    <span className="suggestion-count-tag">{item.count}</span>
                  </div>
                ))
              ) : (
                /* Empty state / Trending searches list shown on focus */
                trending.slice(0, 5).map((item, idx) => (
                  <div
                    key={idx}
                    className="google-suggestion-row trending-row"
                    onClick={() => {
                      setSearchTerm(item.query);
                      handleSearchSubmit(item.query);
                    }}
                  >
                    <span className="suggestion-icon trending-icon">
                      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"></path>
                      </svg>
                    </span>
                    <span className="suggestion-text-content">
                      {item.query} <span className="trending-badge">Trending</span>
                    </span>
                  </div>
                ))
              )}
              {latency !== null && (
                <div className="google-suggestions-latency">
                  Trie lookup: <strong>{latency}ms</strong>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Buttons Center Layout */}
        <div className="google-buttons-row">
          <button 
            className="google-btn" 
            onClick={() => handleSearchSubmit(searchTerm)}
            disabled={isLoading || !searchTerm.trim()}
          >
            Google Search
          </button>
          <button 
            className="google-btn"
            onClick={() => {
              if (trending.length > 0) {
                const randomIdx = Math.floor(Math.random() * trending.length);
                handleSearchSubmit(trending[randomIdx].query);
              } else {
                handleSearchSubmit('iphone');
              }
            }}
          >
            I'm Feeling Lucky
          </button>
        </div>

        {/* Loading and Error states */}
        {isLoading && <div className="google-info-msg">Searching database...</div>}
        {searchError && <div className="google-error-msg">{searchError}</div>}

        {/* Search response debug output */}
        {lastResponse && (
          <div className="google-response-box">
            <span className="response-title">Search Server Response:</span>
            <pre className="response-content">{JSON.stringify(lastResponse, null, 2)}</pre>
          </div>
        )}

      </div>

      {/* Google Style Footer */}
      <footer className="google-footer">
        <div className="footer-location-row">
          <span>United States</span>
        </div>
        <div className="footer-links-row">
          <div className="footer-links-left">
            <a href="#about">About</a>
            <a href="#advertising">Advertising</a>
            <a href="#business">Business</a>
            <a href="#how">How Search works</a>
          </div>
          <div className="footer-links-right">
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="#settings">Settings</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
