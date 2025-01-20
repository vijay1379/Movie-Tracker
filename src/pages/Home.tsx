import React, { useState, useEffect } from 'react';
import { Menu, Film, Tv, BookOpen, Plus, Library, Eye, EyeOff, X, Search, Trash2, LogOut } from 'lucide-react';
import { searchMedia } from '../lib/tmdb';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

type MediaType = 'all' | 'movie' | 'tv' | 'anime';
type WatchStatus = 'to_watch' | 'watched';

interface SearchResult {
  id: number;
  title?: string;
  name?: string;
  media_type: string;
  poster_path: string;
}

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [activeType, setActiveType] = useState<MediaType>('all');
  const [activeStatus, setActiveStatus] = useState<WatchStatus>('to_watch');
  const [movieTitle, setMovieTitle] = useState('');
  const [userMovies, setUserMovies] = useState([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserMovies();
  }, [user, activeStatus, activeType]);

  useEffect(() => {
    const searchMovies = async () => {
      if (movieTitle.trim().length > 2) {
        try {
          const results = await searchMedia(movieTitle);
          setSearchResults(results.results?.slice(0, 5) || []);
        } catch (error) {
          console.error('Failed to search movies:', error);
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    };

    const debounce = setTimeout(searchMovies, 300);
    return () => clearTimeout(debounce);
  }, [movieTitle]);

  const fetchUserMovies = async () => {
    if (!user) return;

    let query = supabase
      .from('movies')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', activeStatus);

    if (activeType !== 'all') {
      query = query.eq('media_type', activeType);
    }

    const { data } = await query;
    setUserMovies(data || []);
  };

  const addMovie = async (media?: SearchResult) => {
    if (!user || (!media && !movieTitle.trim())) return;

    try {
      const results = media ? [media] : (await searchMedia(movieTitle)).results;
      if (results && results.length > 0) {
        const selectedMedia = results[0];
        await supabase.from('movies').insert({
          tmdb_id: selectedMedia.id,
          title: selectedMedia.title || selectedMedia.name,
          poster_path: selectedMedia.poster_path,
          media_type: selectedMedia.media_type,
          status: activeStatus,
          user_id: user.id
        });

        fetchUserMovies();
        setMovieTitle('');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Failed to add movie:', error);
    }
  };

  const toggleWatchStatus = async (movieId: string) => {
    const newStatus = activeStatus === 'to_watch' ? 'watched' : 'to_watch';
    await supabase
      .from('movies')
      .update({ status: newStatus })
      .eq('id', movieId);
    
    fetchUserMovies();
  };

  const deleteMovie = async (movieId: string) => {
    try {
      await supabase
        .from('movies')
        .delete()
        .eq('id', movieId);
      
      fetchUserMovies();
    } catch (error) {
      console.error('Failed to delete movie:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const MovieCard = ({ media }) => (
    <div className="movie-card group">
      <img
        src={`https://image.tmdb.org/t/p/w500${media.poster_path}`}
        alt={media.title || media.name}
      />
      <div className="movie-card-content opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute top-3 right-3 flex space-x-2">
          <button
            onClick={() => toggleWatchStatus(media.id)}
            className="p-2 bg-indigo-600 rounded-full text-white shadow-lg hover:bg-indigo-700 transition-colors"
          >
            {activeStatus === 'to_watch' ? (
              <Eye className="w-5 h-5" />
            ) : (
              <EyeOff className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => deleteMovie(media.id)}
            className="p-2 bg-red-600 rounded-full text-white shadow-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
        <h3 className="text-lg font-bold text-white mb-1">{media.title || media.name}</h3>
        <span className="text-sm text-gray-300 capitalize">{media.media_type}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 bg-gray-800 border-r border-gray-700 transition-all duration-300 ${
          isMenuOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="flex flex-col h-full py-6">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center space-x-4 px-6 py-2 text-gray-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
            {isMenuOpen && <span className="text-sm font-medium">Categories</span>}
          </button>

          <div className="mt-8 flex flex-col space-y-2">
            <button
              onClick={() => setActiveType('all')}
              className={`flex items-center space-x-4 px-6 py-3 ${
                activeType === 'all'
                  ? 'text-white bg-indigo-600'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Library className="w-6 h-6" />
              {isMenuOpen && <span className="text-sm">All Movies</span>}
            </button>
            <button
              onClick={() => setActiveType('movie')}
              className={`flex items-center space-x-4 px-6 py-3 ${
                activeType === 'movie'
                  ? 'text-white bg-indigo-600'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Film className="w-6 h-6" />
              {isMenuOpen && <span className="text-sm">Movies</span>}
            </button>
            <button
              onClick={() => setActiveType('tv')}
              className={`flex items-center space-x-4 px-6 py-3 ${
                activeType === 'tv'
                  ? 'text-white bg-indigo-600'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Tv className="w-6 h-6" />
              {isMenuOpen && <span className="text-sm">TV Shows</span>}
            </button>
            <button
              onClick={() => setActiveType('anime')}
              className={`flex items-center space-x-4 px-6 py-3 ${
                activeType === 'anime'
                  ? 'text-white bg-indigo-600'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <BookOpen className="w-6 h-6" />
              {isMenuOpen && <span className="text-sm">Anime</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 ${isMenuOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              MovieTracker
            </h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setActiveStatus('watched')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeStatus === 'watched'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Library className="w-5 h-5" />
                <span>Watched</span>
              </button>
              <button
                onClick={() => setActiveStatus('to_watch')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeStatus === 'to_watch'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Plus className="w-5 h-5" />
                <span>To Watch</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 rounded-md text-gray-300 hover:bg-gray-700 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-white">
              {activeStatus === 'watched' ? 'Watched Movies' : 'Movies To Watch'}
            </h2>
            
            {activeStatus === 'to_watch' && (
              <div className="relative mb-8">
                <div className="flex space-x-4">
                  <div className="flex-1 relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search for movies, TV shows, or anime..."
                        value={movieTitle}
                        onChange={(e) => setMovieTitle(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 rounded-lg search-input"
                      />
                      {movieTitle && (
                        <button
                          onClick={() => setMovieTitle('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => addMovie()}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Movie</span>
                  </button>
                </div>
                
                {/* Search Suggestions */}
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => addMovie(result)}
                        className="flex items-center w-full px-4 py-3 text-left hover:bg-gray-700 border-b border-gray-700 last:border-0"
                      >
                        {result.poster_path && (
                          <img
                            src={`https://image.tmdb.org/t/p/w92${result.poster_path}`}
                            alt=""
                            className="w-12 h-16 object-cover rounded-md mr-4"
                          />
                        )}
                        <div>
                          <div className="font-medium text-white">
                            {result.title || result.name}
                          </div>
                          <div className="text-sm text-gray-400 capitalize">
                            {result.media_type}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* User's Movies */}
            <div className="movie-grid">
              {userMovies.map((media: any) => (
                <MovieCard key={media.id} media={media} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}