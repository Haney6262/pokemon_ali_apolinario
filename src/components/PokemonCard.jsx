import "./PokemonCard.css"

function PokemonCard({ pokemon, onClick }) {
  return (
    <div className="pokemon-card" onClick={onClick}>
      <div className="pokemon-image">
        <img
          src={pokemon.sprites.other["official-artwork"].front_default || pokemon.sprites.front_default}
          alt={pokemon.name}
        />
      </div>
      <div className="pokemon-info">
        <h3>
          #{pokemon.id} {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
        </h3>
        <div className="pokemon-types">
          {pokemon.types.map((type) => (
            <span key={type.type.name} className={`type-badge ${type.type.name}`}>
              {type.type.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PokemonCard
