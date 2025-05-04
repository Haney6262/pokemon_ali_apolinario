import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import NavBar from "../components/NavBar"
import "./PokedexPage.css"

// Static array for the navigation sections in the Pokedex.
const SECTIONS = [
  {
    title: "Browse Pokemon",
    path: "/pokedex/browse-pokemon",
    description: "Explore the complete Pokedex and learn about different Pokemon",
    icon: "🔍",
  },
  {
    title: "Poke Battle",
    path: "/pokedex/poke-battle",
    description: "Challenge other trainers and test your Pokemon's strength",
    icon: "⚔️",
  },
  {
    title: "My Team",
    path: "/pokedex/my-team",
    description: "Build and manage your ultimate Pokemon team",
    icon: "👥",
  },
  {
    title: "Battle History",
    path: "/pokedex/battle-history",
    description: "View your past battles and track your progress",
    icon: "📜",
  },
]

function PokedexPage() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Add animation after component mounts
    setLoaded(true)
  }, [])

  return (
    <div className="pokedex-page">
      <NavBar />
      <main className="container">
        <div className="back-button">
          <Link to="/" className="btn btn-outline btn-sm">
            ← Back to Home
          </Link>
        </div>

        <div className="text-center">
          <h1 className="pokedex-title -6">Pokedex</h1>
          <p className="pokedex-description text-muted max-w-2xl mx-auto">
            Welcome to your Pokedex! Here you can browse Pokemon, create your team, battle other trainers, and view your
            battle history.
          </p>
        </div>

        <div className={`card-grid ${loaded ? "card-grid-loaded" : ""}`}>
          {SECTIONS.map(({ title, path, description, icon }, index) => (
            <div key={title} className="card" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="card-icon">{icon}</div>
              <h2 className="mb-2">{title}</h2>
              <p className="text-muted mb-4">{description}</p>
              <Link to={path} className="btn btn-primary">
                Go to {title}
              </Link>
            </div>
          ))}
        </div>

        {/* Decorative elements */}
        <div className="decorative-pokeball pokeball-1"></div>
        <div className="decorative-pokeball pokeball-2"></div>
        <div className="decorative-pokeball pokeball-3"></div>
      </main>
    </div>
  )
}

export default PokedexPage
