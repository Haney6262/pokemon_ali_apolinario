import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/NavBar";
import PokemonCard from "../components/PokemonCard";
import PokemonDetail from "../components/PokemonDetail";
import Notification from "../components/Notification";
import "./BrowsePokemonPage.css";

function BrowsePokemonPage() {
  const [pokemons, setPokemons] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPokemon, setSelectedPokemon] = useState(null)
  const [notification, setNotification] = useState({ show: false, message: "", type: "" })
  const [error, setError] = useState(null)
  const [isPageLoaded, setIsPageLoaded] = useState(false)
  const limit = 10

  // Fade in animation on page load
  useEffect(() => {
    setIsPageLoaded(true)
  }, [])

  // Fetch the list of pokemons whenever currentPage changes or search term is cleared.
  useEffect(() => {
    // Only fetch paginated results if there is no search term.
    if (!searchTerm.trim()) {
      fetchPokemons();
    }
  }, [currentPage, searchTerm]);

  // Fetch paginated list of pokemons from PokeAPI.
  const fetchPokemons = async () => {
    setLoading(true);
    setError(null);
    try {
      const offset = (currentPage - 1) * limit;
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
      if (!response.ok) throw new Error("Failed to fetch Pokemon list");

      const data = await response.json();
      setTotalPages(Math.ceil(data.count / limit));

      // Fetch details for each Pokemon concurrently.
      const pokemonDetails = await Promise.all(
        data.results.map(async (pokemon) => {
          const res = await fetch(pokemon.url);
          return await res.json();
        })
      );
      setPokemons(pokemonDetails);
    } catch (err) {
      console.error("Error fetching Pokemons:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle search for a Pokemon by name or ID.
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      // Reset pagination when clearing a search term.
      setCurrentPage(1);
      fetchPokemons();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${searchTerm.toLowerCase()}`);
      if (response.ok) {
        const data = await response.json();
        setPokemons([data]);
        setTotalPages(1);
      } else {
        setPokemons([]);
        setTotalPages(0);
        setNotification({
          show: true,
          message: "No Pokemon found for that search term.",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Error searching Pokemon:", err);
      setError("Error searching Pokemon. Please try again later.");
      setPokemons([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  // Handle when a Pokemon card is clicked.
  const handlePokemonClick = (pokemon) => {
    setSelectedPokemon(pokemon);
  };

  // Close the Pokemon detail modal.
  const handleCloseDetail = () => {
    setSelectedPokemon(null);
  };

  // Add the selected Pokemon to the team.
  const handleAddToTeam = async (pokemon) => {
    try {
      // Fetch the current team with caching disabled.
      const teamResponse = await fetch("http://localhost:3001/team", {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
      const team = await teamResponse.json();

      // Check if the team is full.
      if (team.length >= 6) {
        setNotification({
          show: true,
          message: "Team is full! Remove a Pokemon first.",
          type: "error",
        });
        return;
      }

      // Check if the Pokemon is already in the team.
      const isPokemonInTeam = team.some((p) => p.id === pokemon.id);
      if (isPokemonInTeam) {
        setNotification({
          show: true,
          message: "This Pokemon is already in your team!",
          type: "error",
        });
        return;
      }

      // Prepare Pokemon data to store in our team.
      const pokemonData = {
        id: pokemon.id,
        name: pokemon.name,
        image:
          pokemon.sprites.other["official-artwork"].front_default || pokemon.sprites.front_default,
        stats: pokemon.stats.map((stat) => ({
          name: stat.stat.name,
          value: stat.base_stat,
        })),
        types: pokemon.types.map((type) => type.type.name),
      };

      await fetch("http://localhost:3001/team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pokemonData),
      });

      setNotification({
        show: true,
        message: `${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)} added to team!`,
        type: "success",
      });
    } catch (error) {
      console.error("Error adding Pokemon to team:", error);
      setNotification({
        show: true,
        message: "Failed to add Pokemon to team",
        type: "error",
      });
    } finally {
      // Hide notification after 3 seconds.
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" });
      }, 3000);
    }
  };

  // Handle page changes for paginated results.
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  };

  // Format date for display (if needed for any future addition).
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <div className={`sub-page browse-pokemon-page ${isPageLoaded ? "page-loaded" : ""}`}>
      <NavBar />
      <main className="container">
        <div className="back-button">
          <Link to="/pokedex" className="btn btn-outline btn-sm">
            ← Back to Pokedex
          </Link>
        </div>

        <div className="text-center">
          <h1 className="browse-title -6">Browse Pokemon</h1>
          <p className="browse-description">
            Explore different Pokemon, learn about their stats, and add them to your team.</p>
        </div>

        <div className="search-container">
          <div className="search-decorative-element search-icon">🔍</div>
          <input
            type="text"
            placeholder="Search Pokemon by name or ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch()
            }}
          />
          <div className="search-buttons">
            <button onClick={handleSearch} className="btn btn-primary">
              Search
            </button>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("")
                  setCurrentPage(1) // reset to page 1 when search is cleared
                }}
                className="btn btn-outline"
              >
                Clear
              </button>
            )}
          </div>
          <div className="search-decorative-element pokeball-icon"></div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Catching Pokemon...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>Error: {error}</p>
            <button className="btn btn-primary" onClick={fetchPokemons}>
              Retry
            </button>
          </div>
        ) : pokemons.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">?</div>
            <p>No Pokemon found!</p>
            <p className="no-results-tip">Try searching for a different name or ID.</p>
          </div>
        ) : (
          <>
            <div className="pokemon-grid">
              {pokemons.map((pokemon, index) => (
                <div key={pokemon.id} className="pokemon-card-wrapper" style={{ animationDelay: `${index * 0.05}s` }}>
                  <PokemonCard pokemon={pokemon} onClick={() => handlePokemonClick(pokemon)} />
                </div>
              ))}
            </div>

            {!searchTerm && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn btn-outline btn-sm pagination-btn"
                >
                  Previous
                </button>
                <div className="page-numbers">
                  {currentPage > 2 && (
                    <button onClick={() => handlePageChange(1)} className="page-number">
                      1
                    </button>
                  )}
                  {currentPage > 3 && <span className="page-ellipsis">...</span>}

                  {currentPage > 1 && (
                    <button onClick={() => handlePageChange(currentPage - 1)} className="page-number">
                      {currentPage - 1}
                    </button>
                  )}

                  <button className="page-number active">{currentPage}</button>

                  {currentPage < totalPages && (
                    <button onClick={() => handlePageChange(currentPage + 1)} className="page-number">
                      {currentPage + 1}
                    </button>
                  )}

                  {currentPage < totalPages - 2 && <span className="page-ellipsis">...</span>}
                  {currentPage < totalPages - 1 && (
                    <button onClick={() => handlePageChange(totalPages)} className="page-number">
                      {totalPages}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="btn btn-outline btn-sm pagination-btn"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {selectedPokemon && (
          <PokemonDetail
            pokemon={selectedPokemon}
            onClose={handleCloseDetail}
            onAddToTeam={() => handleAddToTeam(selectedPokemon)}
          />
        )}

        {notification.show && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification({ show: false, message: "", type: "" })}
          />
        )}
      </main>
    </div>
  );
}

export default BrowsePokemonPage;
