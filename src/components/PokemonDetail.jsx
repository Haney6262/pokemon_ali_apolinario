import "./PokemonDetail.css"

function PokemonDetail({ pokemon, onClose, onAddToTeam }) {
  return (
    <div className="pokemon-detail-overlay">
      <div className="pokemon-detail-container">
        <button className="close-button" onClick={onClose}>
          ×
        </button>

        <div className="pokemon-detail-header">
          <h2>
            #{pokemon.id} {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
          </h2>
          <div className="pokemon-types">
            {pokemon.types.map((type) => (
              <span key={type.type.name} className={`type-badge ${type.type.name}`}>
                {type.type.name}
              </span>
            ))}
          </div>
        </div>

        <div className="pokemon-detail-content">
          <div className="pokemon-detail-image">
            <img
              src={pokemon.sprites.other["official-artwork"].front_default || pokemon.sprites.front_default}
              alt={pokemon.name}
            />
          </div>

          <div className="pokemon-detail-info">
            <div className="pokemon-stats">
              <h3>Base Stats</h3>
              {pokemon.stats.map((stat) => (
                <div key={stat.stat.name} className="stat-row">
                  <span className="stat-name">{formatStatName(stat.stat.name)}</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar"
                      style={{ width: `${Math.min(100, (stat.base_stat / 255) * 100)}%` }}
                    ></div>
                  </div>
                  <span className="stat-value">{stat.base_stat}</span>
                </div>
              ))}
            </div>

            <div className="pokemon-abilities">
              <h3>Abilities</h3>
              <ul>
                {pokemon.abilities.map((ability) => (
                  <li key={ability.ability.name}>
                    {ability.ability.name
                      .split("-")
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" ")}
                    {ability.is_hidden && <span className="hidden-ability"> (Hidden)</span>}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pokemon-details">
              <div>
                <h3>Height</h3>
                <p>{(pokemon.height / 10).toFixed(1)} m</p>
              </div>
              <div>
                <h3>Weight</h3>
                <p>{(pokemon.weight / 10).toFixed(1)} kg</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pokemon-detail-actions">
          <button className="btn btn-primary" onClick={onAddToTeam}>
            Add to Team
          </button>
        </div>
      </div>
    </div>
  )
}

function formatStatName(statName) {
  switch (statName) {
    case "hp":
      return "HP"
    case "attack":
      return "Attack"
    case "defense":
      return "Defense"
    case "special-attack":
      return "Sp. Attack"
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

export default PokemonDetail
