import { use, useEffect, useState } from 'react'
//useState → remembers information (like search text or movie lists)
//useEffect → runs code automatically when something changes

import Search from './components/Search'
import MovieCard from './components/MovieCard'
//pre built search box and movie card components

import { useDebounce } from 'react-use'
import { getTrendingMovies,updateSearchCount } from './appwrite'
//database functions to get trending movies and update search counts

const API_BASE_URL = 'https://api.themoviedb.org/3'

const API_KEY = import.meta.env.VITE_TMDB_API_KEY

//main app component
const App = () => {
  const [searchTerm, setSearchTerm] = useState('')
  //stores what user types in search box
  const [errorMessage, setErrorMessage] = useState(null)
  //stores any error messages from API calls
  const [movieLst, setMovieList] = useState([]);
  //stores list of movies fetched from API
  const [isLoading, setIsLoading] = useState(false);
  //indicates if data is being loaded
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  //stores the delayed search term for debouncing
  const [trendingMovies, setTrendingMovies] = useState([]);
  //stores list of trending movies
//debouncin search term to prevent excessive API calls
//debounce set to 500 ms
  useDebounce(() => setDebouncedSearchTerm(searchTerm),500,[searchTerm]);

  //downloads movies from TMDB API and stores
  const fetchMovies = async (query = '') => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const endpoint = query 
      ? `${API_BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
      :`${API_BASE_URL}/movie/popular?api_key=${API_KEY}`

      const response = await fetch(endpoint)

      if (!response.ok) {
        throw new Error('Failed to fetch movies')
      }

      const data = await response.json()
      if(data.Response === "False") {
        setErrorMessage(data.Error || 'Error fetching movies');
        setMovieList([]);
        return;
      }
      setMovieList(data.results || []);
      
      if(query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }
    } catch (error) {
      console.error('Error fetching movies:', error)
      setErrorMessage(error.message)
    } finally {
       setIsLoading(false);
    }
  }

  const loadTrendingMovies = async () => {
    try{
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
    } catch (error) {
      console.error('Error loading trending movies:', error);
      
    }
  }

  useEffect(() => {
    fetchMovies(debouncedSearchTerm)
  }, [debouncedSearchTerm])

  useEffect(() => {
    loadTrendingMovies();
  }, []);

  return (
    <main>
      <div className="pattern" />

      <div className="wrapper">
        <header>
          <img src="./hero-img.png" alt="Hero Banner" />
          <h1>
            Find <span className="text-gradient">Movies</span> You'll Enjoy Without
            the Hassle
          </h1>

          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {trendingMovies.length > 0 && (
  <section className="trending-movies mt-10">
    <h2 className="mb-4 text-xl font-semibold">Trending Searches</h2>

    <ul className="grid grid-cols-10 gap-4">
      {trendingMovies.slice(0, 10).map((movie, index) => (
        <li
          key={movie.$id}
          className="flex flex-col items-center"
        >
          <p className="mb-2 text-sm font-semibold">
            {index + 1}
          </p>

          <img
            src={movie.poster_url}
            alt={movie.searchTerm}
            className="w-full aspect-[2/3] object-cover rounded-lg shadow"
          />
        </li>
      ))}
    </ul>
  </section>
)}



        <section className="all-movies">
          <h2>All Movies</h2>

          {isLoading ? (
            <p>Loading movies...</p>
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ): (
            <ul>
              {movieLst.map((movie) => (
                <MovieCard key={movie.id} movie={movie}/>
              ))}
              </ul>
          )}
        </section>
      </div>
    </main>
  )
}

export default App
