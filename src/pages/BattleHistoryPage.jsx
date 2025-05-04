import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import NavBar from "../components/NavBar"
import "./BattleHistoryPage.css"

function BattleHistoryPage() {
  const [battles, setBattles] = useState([])
  const [filteredBattles, setFilteredBattles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBattle, setSelectedBattle] = useState(null)
  const [error, setError] = useState(null)
  const [isPageLoaded, setIsPageLoaded] = useState(false)
  const [stats, setStats] = useState({ wins: 0, losses: 0, winRate: 0 })
  const [activeFilter, setActiveFilter] = useState("all")
  const [showDetails, setShowDetails] = useState(false)

  // Fade in animation on page load
  useEffect(() => {
    setIsPageLoaded(true)
  }, [])

  useEffect(() => {
    fetchBattleHistory()
  }, [])

  // Calculate stats when battles change
  useEffect(() => {
    if (battles.length > 0) {
      const wins = battles.filter((battle) => battle.winner === "player").length
      const losses = battles.length - wins
      const winRate = Math.round((wins / battles.length) * 100)

      setStats({
        wins,
        losses,
        winRate,
      })

      // Initialize filtered battles with all battles
      setFilteredBattles(battles)
    }
  }, [battles])

  // Filter battles when activeFilter changes
  useEffect(() => {
    if (battles.length > 0) {
      if (activeFilter === "all") {
        setFilteredBattles(battles)
      } else if (activeFilter === "victories") {
        setFilteredBattles(battles.filter((battle) => battle.winner === "player"))
      } else if (activeFilter === "defeats") {
        setFilteredBattles(battles.filter((battle) => battle.winner === "opponent"))
      }
    }
  }, [activeFilter, battles])

  const fetchBattleHistory = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("http://localhost:3001/battles")
      if (!response.ok) {
        throw new Error("Failed to fetch battle history")
      }
      const data = await response.json()
      // Sort by date (newest first)
      const sortedBattles = data.sort((a, b) => new Date(b.date) - new Date(a.date))
      setBattles(sortedBattles)
      if (sortedBattles.length > 0) {
        setSelectedBattle(sortedBattles[0])
      }
    } catch (err) {
      console.error("Error fetching battle history:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
  }

  const handleBattleClick = (battle) => {
    setSelectedBattle(battle)
    setShowDetails(true)
  }

  const handleBackToList = () => {
    setShowDetails(false)
  }

  return (
    <div className={`sub-page battle-history-page ${isPageLoaded ? "page-loaded" : ""}`}>
      <NavBar />
      <main className="container">
        <div className="back-button">
          <Link to="/pokedex" className="btn btn-outline btn-sm">
            ← Back to Pokedex
          </Link>
        </div>

        <div className="text-center">
          <h1 className="history-title -6">Battle History</h1>
          <p className="history-description">
            View your past battles and track your progress as a Pokemon trainer.
          </p>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading battle history...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>Error: {error}</p>
            <button className="btn btn-primary" onClick={fetchBattleHistory}>
              Retry
            </button>
          </div>
        ) : battles.length === 0 ? (
          <div className="empty-history">
            <div className="empty-history-icon">📜</div>
            <p>You haven't had any battles yet. Go to Poke Battle to start battling!</p>
            <Link to="/pokedex/poke-battle" className="btn btn-primary">
              Go to Battle
            </Link>
          </div>
        ) : (
          <>
            <div className="stats-summary">
              <div className="stat-card">
                <div className="stats-value">{battles.length}</div>
                <div className="stat-label">Total Battles</div>
              </div>
              <div className="stat-card win">
                <div className="stats-value">{stats.wins}</div>
                <div className="stat-label">Victories</div>
              </div>
              <div className="stat-card loss">
                <div className="stats-value">{stats.losses}</div>
                <div className="stat-label">Defeats</div>
              </div>
              <div className="stat-card">
                <div className="stats-value">{stats.winRate}%</div>
                <div className="stat-label">Win Rate</div>
              </div>
            </div>

            {/* Mobile-friendly layout that shows either the list or details */}
            <div className="history-container">
              {!showDetails ? (
                <div className="battle-list-container">
                  <div className="filter-buttons">
                    <button
                      className={`filter-btn ${activeFilter === "all" ? "active" : ""}`}
                      onClick={() => setActiveFilter("all")}
                    >
                      All Battles
                    </button>
                    <button
                      className={`filter-btn win ${activeFilter === "victories" ? "active" : ""}`}
                      onClick={() => setActiveFilter("victories")}
                    >
                      Victories
                    </button>
                    <button
                      className={`filter-btn loss ${activeFilter === "defeats" ? "active" : ""}`}
                      onClick={() => setActiveFilter("defeats")}
                    >
                      Defeats
                    </button>
                  </div>

                  <div className="battle-list">
                    <h2>
                      {activeFilter === "all"
                        ? "All Battles"
                        : activeFilter === "victories"
                          ? "Victory Battles"
                          : "Defeat Battles"}
                    </h2>
                    <div className="battle-items">
                      {filteredBattles.length === 0 ? (
                        <div className="no-battles-message">
                          No {activeFilter === "victories" ? "victory" : "defeat"} battles found
                        </div>
                      ) : (
                        filteredBattles.map((battle, index) => (
                          <div
                            key={battle.id || index}
                            className={`battle-item`}
                            onClick={() => handleBattleClick(battle)}
                          >
                            <div className="battle-item-header">
                              <span className="battle-date">{formatDate(battle.date)}</span>
                              <span className={`battle-result ${battle.winner === "player" ? "win" : "loss"}`}>
                                {battle.winner === "player" ? "Victory" : "Defeat"}
                              </span>
                            </div>
                            <div className="battle-teams">
                              <div className="battle-team-preview">
                                {battle.playerTeam.slice(0, 6).map((pokemon) => (
                                  <div key={pokemon.id} className="team-preview-img-container">
                                    <img
                                      src={pokemon.image || "/placeholder.svg"}
                                      alt={pokemon.name}
                                      className="team-preview-img"
                                    />
                                  </div>
                                ))}
                                {/* {battle.playerTeam.length > 3 && (
                                  <span className="more-pokemon">+{battle.playerTeam.length - 3}</span>
                                )} */}
                              </div>
                              <div className="vs-badge">VS</div>
                              <div className="battle-team-preview">
                                {battle.opponentTeam.slice(0, 6).map((pokemon) => (
                                  <div key={pokemon.id} className="team-preview-img-container">
                                    <img
                                      src={pokemon.image || "/placeholder.svg"}
                                      alt={pokemon.name}
                                      className="team-preview-img"
                                    />
                                  </div>
                                ))}
                                {/* {battle.opponentTeam.length > 3 && (
                                  <span className="more-pokemon">+{battle.opponentTeam.length - 3}</span>
                                )} */}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                selectedBattle && (
                  <div className="battle-details-container">
                    <button className="back-to-list-btn" onClick={handleBackToList}>
                      ← Back to Battle List
                    </button>

                    <div className="battle-details">
                      <h2>Battle Details</h2>
                      <div className="battle-info">
                        <div className="battle-info-header">
                          <div>
                            <span className="info-label">Date:</span>
                            <span>{formatDate(selectedBattle.date)}</span>
                          </div>
                          <div>
                            <span className="info-label">Result:</span>
                            <span className={`battle-result ${selectedBattle.winner === "player" ? "win" : "loss"}`}>
                              {selectedBattle.winner === "player" ? "Victory" : "Defeat"}
                            </span>
                          </div>
                        </div>

                        <div className="teams-comparison">
                          <div className="team-column">
                            <h3>Your Team</h3>
                            <div className="team-pokemon-list">
                              {selectedBattle.playerTeam.map((pokemon) => (
                                <div key={pokemon.id} className="team-pokemon-row">
                                  <div className="team-pokemon-img-container">
                                    <img src={pokemon.image || "/placeholder.svg"} alt={pokemon.name} />
                                  </div>
                                  <span>{pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</span>
                                  <div className="pokemon-types small">
                                    {pokemon.types.map((type) => (
                                      <span key={type} className={`type-badge ${type}`}>
                                        {type}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="team-column">
                            <h3>Opponent Team</h3>
                            <div className="team-pokemon-list">
                              {selectedBattle.opponentTeam.map((pokemon) => (
                                <div key={pokemon.id} className="team-pokemon-row">
                                  <div className="team-pokemon-img-container">
                                    <img src={pokemon.image || "/placeholder.svg"} alt={pokemon.name} />
                                  </div>
                                  <span>{pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</span>
                                  <div className="pokemon-types small">
                                    {pokemon.types.map((type) => (
                                      <span key={type} className={`type-badge ${type}`}>
                                        {type}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="battle-log-summary">
                          <h3>Battle Summary</h3>
                          <div className="log-entries">
                            {selectedBattle.log
                              ?.filter((entry) => ["info", "matchup", "result"].includes(entry.type))
                              .map((entry, index) => (
                                <div key={index} className={`log-entry ${entry.type}`}>
                                  {entry.text}
                                </div>
                              ))}
                          </div>
                        </div>

                        <div className="battle-actions">
                          <Link to="/pokedex/poke-battle" className="btn btn-primary">
                            New Battle
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default BattleHistoryPage
