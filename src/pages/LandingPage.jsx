import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import "./LandingPage.css"

function LandingPage() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Add animation after component mounts
    setLoaded(true)
  }, [])

  return (
    <div className="landing-page">
      {/* Background Image */}
      <div className="background-image">
        <div className="overlay"></div>
      </div>

      {/* Animated Pokéball */}
      <div className="pokeball-container">
        <div className="pokeball"></div>
      </div>

      {/* Content */}
      <div className={`content ${loaded ? "content-loaded" : ""}`}>
        <h1 className="title">Pokedex</h1>
        <h2 className="subtitle">AA World</h2>
        <p className="description">Explore the world of Pokémon, build your team, and battle with trainers!</p>
        <Link to="/pokedex" className="btn btn-primary btn-lg enter-button">
          Enter Pokedex
        </Link>
      </div>
    </div>
  )
}

export default LandingPage
