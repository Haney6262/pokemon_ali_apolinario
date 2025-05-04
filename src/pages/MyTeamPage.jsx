import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import NavBar from "../components/NavBar"
import Notification from "../components/Notification"
import "./MyTeamPage.css"

function MyTeamPage() {
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPokemon, setSelectedPokemon] = useState(null)
  const [notification, setNotification] = useState({ show: false, message: "", type: "" })
  const [isPageLoaded, setIsPageLoaded] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [retryCount, setRetryCount] = useState(0) // Add retry counter
  const navigate = useNavigate()

  // Fade in animation on page load
  useEffect(() => {
    setIsPageLoaded(true)
  }, [])

  // Fetch team on component mount or when retryCount changes
  useEffect(() => {
    fetchTeam()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCount])

  // Fetch team data from the fake API without cache headers
  const fetchTeam = async () => {
    setLoading(true)
    try {
      const response = await fetch("http://localhost:3001/team", {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })
      if (!response.ok) {
        throw new Error("Failed to fetch team")
      }
      const data = await response.json()
      // Initialize with empty team if this is first load
      if (data.length === 0) {
        console.log("Team is empty on first load")
      }
      setTeam(data)

      // Set the first Pokemon as selected if there is one
      if (data.length > 0) {
        if (!selectedPokemon || !data.find((p) => p.id === selectedPokemon.id)) {
          setSelectedPokemon(data[0])
        }
      } else {
        setSelectedPokemon(null)
      }
    } catch (error) {
      console.error("Error fetching team:", error)
      setNotification({ show: true, message: error.message, type: "error" })
      autoClearNotification()
    } finally {
      setLoading(false)
    }
  }

  // Remove a Pokemon from the team after sending DELETE, then refresh state
  const handleRemovePokemon = async (id) => {
    try {
      setIsRemoving(true)
      console.log("Attempting to delete Pokemon with id:", id) // Debugging log

      // First, make a copy of the current team and remove the Pokemon locally
      const updatedTeam = team.filter((pokemon) => pokemon.id !== id)
      setTeam(updatedTeam)

      // If there are remaining Pokemon, select the first one
      if (updatedTeam.length > 0) {
        setSelectedPokemon(updatedTeam[0])
      } else {
        setSelectedPokemon(null)
      }

      // Then send the DELETE request to the server
      const response = await fetch(`http://localhost:3001/team/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to delete: ${response.status}`)
      }

      // After successful deletion, trigger a re-fetch with a delay
      setTimeout(() => {
        setRetryCount((prev) => prev + 1) // Increment retry counter to trigger re-fetch
      }, 500)

      setNotification({
        show: true,
        message: "Pokemon removed from team",
        type: "success",
      })
    } catch (error) {
      console.error("Error removing Pokemon:", error)
      setNotification({
        show: true,
        message: "Failed to remove Pokemon: " + error.message,
        type: "error",
      })
      // Re-fetch to force state sync in error cases as well
      setTimeout(() => {
        setRetryCount((prev) => prev + 1) // Increment retry counter to trigger re-fetch
      }, 500)
    } finally {
      setIsRemoving(false)
      autoClearNotification()
    }
  }

  // Check if team has at least one Pokemon before battling
  const handleReadyForBattle = () => {
    if (team.length === 0) {
      setNotification({
        show: true,
        message: "You need at least one Pokemon to battle!",
        type: "error",
      })
      autoClearNotification()
      return
    }
    navigate("/pokedex/poke-battle")
  }

  // Automatically clear notifications after 3 seconds
  const autoClearNotification = () => {
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" })
    }, 3000)
  }

  return (
    <div className={`sub-page my-team-page ${isPageLoaded ? "page-loaded" : ""}`}>
      <NavBar />
      <main className="container">
        <div className="back-button">
          <Link to="/pokedex" className="btn btn-outline btn-sm">
            ← Back to Pokedex
          </Link>
        </div>

        <div className="team-header">
          <h1 className="team-title">My Team</h1>
          <button className="btn btn-primary battle-ready-btn" onClick={handleReadyForBattle}>
            Ready for Battle
          </button>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading your team...</p>
          </div>
        ) : team.length === 0 ? (
          <div className="empty-team">
            <div className="empty-team-icon">!</div>
            <p>Your team is empty! Go to Browse Pokemon to add Pokemon to your team.</p>
            <Link to="/pokedex/browse-pokemon" className="btn btn-primary">
              Browse Pokemon
            </Link>
          </div>
        ) : (
          <div className="team-container">
            <div className="team-sidebar">
              <h3>My Pokemon ({team.length}/6)</h3>
              <div className="team-pokemon-list">
                {team.map((pokemon) => (
                  <div
                    key={pokemon.id}
                    className={`team-pokemon-item ${selectedPokemon && selectedPokemon.id === pokemon.id ? "active" : ""
                      }`}
                    onClick={() => setSelectedPokemon(pokemon)}
                  >
                    <div className="team-pokemon-item-image">
                      <img src={pokemon.image || "/placeholder.svg"} alt={pokemon.name} />
                    </div>
                    <span>{pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</span>
                  </div>
                ))}
                {/* Empty slots */}
                {Array.from({ length: Math.max(0, 6 - team.length) }).map((_, index) => (
                  <div key={`empty-${index}`} className="team-pokemon-item empty">
                    <div className="empty-slot">?</div>
                    <span>Empty Slot</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="team-details">
              {selectedPokemon ? (
                <>
                  <div className="team-pokemon-header">
                    <h2>{selectedPokemon.name.charAt(0).toUpperCase() + selectedPokemon.name.slice(1)}</h2>
                    <button
                      className={`btn btn-outline btn-sm remove-btn ${isRemoving ? "removing" : ""}`}
                      onClick={() => handleRemovePokemon(selectedPokemon.id)}
                      disabled={isRemoving}
                    >
                      {isRemoving ? "Removing..." : "Remove from Team"}
                    </button>
                  </div>

                  <div className="team-pokemon-info">
                    <div className="team-pokemon-image">
                      <img src={selectedPokemon.image || "/placeholder.svg"} alt={selectedPokemon.name} />
                      <div className="pokemon-types">
                        {selectedPokemon.types.map((type) => (
                          <span key={type} className={`type-badge ${type}`}>
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="team-pokemon-stats">
                      <h3>Stats</h3>
                      {selectedPokemon.stats.map((stat) => (
                        <div key={stat.name} className="stat-row">
                          <span className="stat-name">{formatStatName(stat.name)}</span>
                          <div className="stat-bar-container">
                            <div
                              className="stat-bar animate"
                              style={{
                                width: `${Math.min(100, (stat.value / 255) * 100)}%`,
                                backgroundColor: getStatColor(stat.name),
                              }}
                            ></div>
                          </div>
                          <span className="stat-value">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="no-pokemon-selected">
                  <div className="no-selection-icon">👈</div>
                  <p>Select a Pokemon from your team to view details</p>
                </div>
              )}
            </div>
          </div>
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
  )
}

// Helper function to format stat names prettily
function formatStatName(statName) {
  switch (statName) {
    case "hp":
      return "HP"
    case "attack":
      return "Attack"
    case "defense":
      return "Defense"
    case "special-attack":
      return "Sp. Atk"
    case "special-defense":
      return "Sp. Def"
    case "speed":
      return "Speed"
    default:
      return statName
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
  }
}

// Helper function to get stat value
function getStatValue(pokemon, statName) {
  const stat = pokemon.stats.find((s) => s.name === statName)
  return stat ? stat.value : 0
}

// Helper function to get color for stat bars
function getStatColor(statName) {
  switch (statName) {
    case "hp":
      return "#FF5959"
    case "attack":
      return "#F5AC78"
    case "defense":
      return "#FAE078"
    case "special-attack":
      return "#9DB7F5"
    case "special-defense":
      return "#A7DB8D"
    case "speed":
      return "#FA92B2"
    default:
      return "#75A4F9"
  }
}

export default MyTeamPage
