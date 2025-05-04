import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import LandingPage from "./pages/LandingPage"
import PokedexPage from "./pages/PokedexPage"
import BrowsePokemonPage from "./pages/BrowsePokemonPage"
import PokeBattlePage from "./pages/PokeBattlePage"
import MyTeamPage from "./pages/MyTeamPage"
import BattleHistoryPage from "./pages/BattleHistoryPage"
import "./App.css"
import "./index.css"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/pokedex" element={<PokedexPage />} />
        <Route path="/pokedex/browse-pokemon" element={<BrowsePokemonPage />} />
        <Route path="/pokedex/poke-battle" element={<PokeBattlePage />} />
        <Route path="/pokedex/my-team" element={<MyTeamPage />} />
        <Route path="/pokedex/battle-history" element={<BattleHistoryPage />} />
      </Routes>
    </Router>
  )
}

export default App
