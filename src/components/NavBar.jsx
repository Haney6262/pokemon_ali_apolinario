import { NavLink } from "react-router-dom"
import { useState } from "react"
import ourLogo from "/src/assets/PAAW-logo.svg";
import "./NavBar.css"

function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="navbar">
      <div className="container navbar-container">
        <div className="navbar-logo">
          <NavLink to="/pokedex">
            <img className="logoImage" src={ourLogo} alt="Logo" />
          </NavLink>
        </div>


        <nav className={`navbar-links ${menuOpen ? "active" : ""}`}>
          <NavLink to="/pokedex/browse-pokemon"
            className={({ isActive }) => (isActive ? "active-link" : "")}
            onClick={() => setMenuOpen(false)}>
            Browse Pokemon
          </NavLink>

          <NavLink to="/pokedex/poke-battle"
            className={({ isActive }) => (isActive ? "active-link" : "")}
            onClick={() => setMenuOpen(false)}>
            Poke Battle
          </NavLink>

          <NavLink to="/pokedex/my-team"
            className={({ isActive }) => (isActive ? "active-link" : "")}
            onClick={() => setMenuOpen(false)}>
            My Team
          </NavLink>

          <NavLink to="/pokedex/battle-history"
            className={({ isActive }) => (isActive ? "active-link" : "")}
            onClick={() => setMenuOpen(false)}>
            Battle History
          </NavLink>
        </nav>

        {/* Mobile menu button */}
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          Menu
        </button>
      </div>
    </header>
  )
}

export default NavBar
