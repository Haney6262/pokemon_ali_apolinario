import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import NavBar from "../components/NavBar"
import Notification from "../components/Notification"
import "./PokeBattlePage.css"

function PokeBattlePage() {
  const [myTeam, setMyTeam] = useState([])
  const [opponentTeam, setOpponentTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [regeneratingOpponents, setRegeneratingOpponents] = useState(false)
  const [battleStarted, setBattleStarted] = useState(false)
  const [battleLog, setBattleLog] = useState([])
  const [battleResult, setBattleResult] = useState(null)
  const [notification, setNotification] = useState({ show: false, message: "", type: "" })
  const [isPageLoaded, setIsPageLoaded] = useState(false)
  const [battleAnimation, setBattleAnimation] = useState({
    isAnimating: false,
    attacker: null,
    defender: null,
    damage: 0,
    round: 0,
    finished: false,
  })
  const [playerActivePokemon, setPlayerActivePokemon] = useState(null)
  const [enemyActivePokemon, setEnemyActivePokemon] = useState(null)

  const logContainerRef = useRef(null)
  const battleSceneRef = useRef(null)

  // Fade in animation on page load
  useEffect(() => {
    setIsPageLoaded(true)
  }, [])

  useEffect(() => {
    fetchTeams()
  }, [])

  // Auto-scroll battle log to bottom when new entries are added
  useEffect(() => {
    if (logContainerRef.current && battleLog.length > 0) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [battleLog])

  const fetchTeams = async () => {
    setLoading(true)
    try {
      // Fetch user's team
      const teamResponse = await fetch("http://localhost:3001/team", {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })
      const teamData = await teamResponse.json()
      setMyTeam(teamData)

      // Generate random opponent team
      await generateOpponentTeam()
    } catch (error) {
      console.error("Error fetching teams:", error)
      setNotification({
        show: true,
        message: "Error loading teams",
        type: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateOpponentTeam = async () => {
    try {
      // Set regenerating state to true to show loading indicator
      setRegeneratingOpponents(true)

      // Clear the current opponent team first
      setOpponentTeam([])

      // Get random Pokemon IDs (between 1 and 898)
      const randomIds = Array.from({ length: 6 }, () => Math.floor(Math.random() * 898) + 1)

      const opponentPokemonPromises = randomIds.map(async (id) => {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
        const data = await response.json()

        return {
          id: data.id,
          name: data.name,
          image: data.sprites.other["official-artwork"].front_default || data.sprites.front_default,
          stats: data.stats.map((stat) => ({
            name: stat.stat.name,
            value: stat.base_stat,
          })),
          types: data.types.map((type) => type.type.name),
        }
      })

      // Wait for all Pokemon data to be fetched
      const newOpponentTeam = await Promise.all(opponentPokemonPromises)

      // Set the opponent team state with the new team
      setOpponentTeam(newOpponentTeam)

      return newOpponentTeam
    } catch (error) {
      console.error("Error generating opponent team:", error)
      setNotification({
        show: true,
        message: "Error generating opponent team",
        type: "error",
      })
      return []
    } finally {
      setRegeneratingOpponents(false)
    }
  }

  const handleRegenerateOpponents = async () => {
    try {
      await generateOpponentTeam()
      setNotification({
        show: true,
        message: "New opponent team generated!",
        type: "success",
      })
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" })
      }, 3000)
    } catch (error) {
      console.error("Error regenerating opponents:", error)
    }
  }

  const startBattle = () => {
    if (myTeam.length === 0) {
      setNotification({
        show: true,
        message: "You need at least one Pokemon to battle!",
        type: "error",
      })
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" })
      }, 3000)
      return
    }

    setBattleStarted(true)
    setBattleLog([{ text: "Battle started!", type: "info" }])

    // Set initial active Pokemon
    setPlayerActivePokemon(myTeam[0])
    setEnemyActivePokemon(opponentTeam[0])

    // Start the battle animation
    setBattleAnimation({
      isAnimating: true,
      attacker: null,
      defender: null,
      damage: 0,
      round: 1,
      finished: false,
    })

    // Start the battle simulation with animation
    simulateBattleWithAnimation()
  }

  const simulateBattleWithAnimation = () => {
    // Clone teams to avoid modifying the original state
    const playerTeam = JSON.parse(JSON.stringify(myTeam))
    const enemyTeam = JSON.parse(JSON.stringify(opponentTeam))

    let playerTeamIndex = 0
    let enemyTeamIndex = 0
    let roundCounter = 1

    // Create all battle logs first
    const battleLogs = [{ text: "Battle started!", type: "info" }]
    const animationSteps = []

    // Battle until one team has no Pokemon left
    while (playerTeamIndex < playerTeam.length && enemyTeamIndex < enemyTeam.length) {
      const currentPlayerPokemon = playerTeam[playerTeamIndex]
      const currentEnemyPokemon = enemyTeam[enemyTeamIndex]

      battleLogs.push({ text: `Round ${roundCounter}`, type: "round" })
      battleLogs.push({
        text: `${currentPlayerPokemon.name.toUpperCase()} vs ${currentEnemyPokemon.name.toUpperCase()}`,
        type: "matchup",
      })

      // Get stats
      const playerHP = getStatValue(currentPlayerPokemon, "hp")
      const playerAttack = getStatValue(currentPlayerPokemon, "attack")
      const playerSpeed = getStatValue(currentPlayerPokemon, "speed")

      const enemyHP = getStatValue(currentEnemyPokemon, "hp")
      const enemyAttack = getStatValue(currentEnemyPokemon, "attack")
      const enemySpeed = getStatValue(currentEnemyPokemon, "speed")

      // Initialize current HP if not set
      if (!currentPlayerPokemon.currentHP) currentPlayerPokemon.currentHP = playerHP
      if (!currentEnemyPokemon.currentHP) currentEnemyPokemon.currentHP = enemyHP

      // Determine who attacks first based on speed
      let firstAttacker, secondAttacker, firstAttackerName, secondAttackerName, firstAttackerAtk, secondAttackerAtk
      let isPlayerFirst = false

      if (playerSpeed > enemySpeed || (playerSpeed === enemySpeed && Math.random() < 0.5)) {
        firstAttacker = currentPlayerPokemon
        secondAttacker = currentEnemyPokemon
        firstAttackerName = currentPlayerPokemon.name
        secondAttackerName = currentEnemyPokemon.name
        firstAttackerAtk = playerAttack
        secondAttackerAtk = enemyAttack
        isPlayerFirst = true
      } else {
        firstAttacker = currentEnemyPokemon
        secondAttacker = currentPlayerPokemon
        firstAttackerName = currentEnemyPokemon.name
        secondAttackerName = currentPlayerPokemon.name
        firstAttackerAtk = enemyAttack
        secondAttackerAtk = playerAttack
        isPlayerFirst = false
      }

      // Battle loop for current matchup
      let duelRound = 1
      while (true) {
        battleLogs.push({ text: `Duel round ${duelRound}`, type: "duel-round" })

        // Add animation step for first attacker
        animationSteps.push({
          round: roundCounter,
          duelRound: duelRound,
          attacker: isPlayerFirst ? currentPlayerPokemon : currentEnemyPokemon,
          defender: isPlayerFirst ? currentEnemyPokemon : currentPlayerPokemon,
          damage: isPlayerFirst ? firstAttackerAtk : secondAttackerAtk,
          isPlayerAttacking: isPlayerFirst,
        })

        // First Pokemon attacks
        battleLogs.push({
          text: `${firstAttackerName.toUpperCase()} attacks for ${firstAttackerAtk} damage!`,
          type: firstAttacker === currentPlayerPokemon ? "player-attack" : "enemy-attack",
        })

        // Apply damage to second Pokemon
        if (secondAttacker === currentPlayerPokemon) {
          currentPlayerPokemon.currentHP = currentPlayerPokemon.currentHP - firstAttackerAtk
          if (currentPlayerPokemon.currentHP <= 0) {
            battleLogs.push({
              text: `${secondAttackerName.toUpperCase()} fainted!`,
              type: "player-faint",
            })

            // Move to next Pokemon in player team
            playerTeamIndex++
            if (playerTeamIndex < playerTeam.length) {
              const currentPlayerPokemon = playerTeam[playerTeamIndex]
              battleLogs.push({
                text: `Go, ${currentPlayerPokemon.name.toUpperCase()}!`,
                type: "player-switch",
              })

              // Add animation step for switch
              animationSteps.push({
                round: roundCounter,
                duelRound: duelRound,
                playerSwitch: currentPlayerPokemon,
                enemySwitch: null,
              })
            }
            break
          } else {
            battleLogs.push({
              text: `${secondAttackerName.toUpperCase()} has ${currentPlayerPokemon.currentHP} HP left.`,
              type: "player-hp",
            })
          }
        } else {
          currentEnemyPokemon.currentHP = currentEnemyPokemon.currentHP - secondAttackerAtk
          if (currentEnemyPokemon.currentHP <= 0) {
            battleLogs.push({
              text: `${secondAttackerName.toUpperCase()} fainted!`,
              type: "enemy-faint",
            })

            // Move to next Pokemon in enemy team
            enemyTeamIndex++
            if (enemyTeamIndex < enemyTeam.length) {
              const currentEnemyPokemon = enemyTeam[enemyTeamIndex]
              battleLogs.push({
                text: `Enemy sends out ${currentEnemyPokemon.name.toUpperCase()}!`,
                type: "enemy-switch",
              })

              // Add animation step for switch
              animationSteps.push({
                round: roundCounter,
                duelRound: duelRound,
                playerSwitch: null,
                enemySwitch: currentEnemyPokemon,
              })
            }
            break
          } else {
            battleLogs.push({
              text: `${secondAttackerName.toUpperCase()} has ${currentEnemyPokemon.currentHP} HP left.`,
              type: "enemy-hp",
            })
          }
        }

        // Add animation step for second attacker
        animationSteps.push({
          round: roundCounter,
          duelRound: duelRound,
          attacker: !isPlayerFirst ? currentPlayerPokemon : currentEnemyPokemon,
          defender: !isPlayerFirst ? currentEnemyPokemon : currentPlayerPokemon,
          damage: !isPlayerFirst ? firstAttackerAtk : secondAttackerAtk,
          isPlayerAttacking: !isPlayerFirst,
        })

        // Second Pokemon counterattacks if still alive
        battleLogs.push({
          text: `${secondAttackerName.toUpperCase()} attacks for ${secondAttackerAtk} damage!`,
          type: secondAttacker === currentPlayerPokemon ? "player-attack" : "enemy-attack",
        })

        // Apply damage to first Pokemon
        if (firstAttacker === currentPlayerPokemon) {
          currentPlayerPokemon.currentHP = currentPlayerPokemon.currentHP - secondAttackerAtk
          if (currentPlayerPokemon.currentHP <= 0) {
            battleLogs.push({
              text: `${firstAttackerName.toUpperCase()} fainted!`,
              type: "player-faint",
            })

            // Move to next Pokemon in player team
            playerTeamIndex++
            if (playerTeamIndex < playerTeam.length) {
              const currentPlayerPokemon = playerTeam[playerTeamIndex]
              battleLogs.push({
                text: `Go, ${currentPlayerPokemon.name.toUpperCase()}!`,
                type: "player-switch",
              })

              // Add animation step for switch
              animationSteps.push({
                round: roundCounter,
                duelRound: duelRound,
                playerSwitch: currentPlayerPokemon,
                enemySwitch: null,
              })
            }
            break
          } else {
            battleLogs.push({
              text: `${firstAttackerName.toUpperCase()} has ${currentPlayerPokemon.currentHP} HP left.`,
              type: "player-hp",
            })
          }
        } else {
          currentEnemyPokemon.currentHP = currentEnemyPokemon.currentHP - firstAttackerAtk
          if (currentEnemyPokemon.currentHP <= 0) {
            battleLogs.push({
              text: `${firstAttackerName.toUpperCase()} fainted!`,
              type: "enemy-faint",
            })

            // Move to next Pokemon in enemy team
            enemyTeamIndex++
            if (enemyTeamIndex < enemyTeam.length) {
              const currentEnemyPokemon = enemyTeam[enemyTeamIndex]
              battleLogs.push({
                text: `Enemy sends out ${currentEnemyPokemon.name.toUpperCase()}!`,
                type: "enemy-switch",
              })

              // Add animation step for switch
              animationSteps.push({
                round: roundCounter,
                duelRound: duelRound,
                playerSwitch: null,
                enemySwitch: currentEnemyPokemon,
              })
            }
            break
          } else {
            battleLogs.push({
              text: `${firstAttackerName.toUpperCase()} has ${currentEnemyPokemon.currentHP} HP left.`,
              type: "enemy-hp",
            })
          }
        }

        duelRound++
      }

      roundCounter++
    }

    // Determine the winner
    let winner
    if (playerTeamIndex >= playerTeam.length) {
      winner = "opponent"
      battleLogs.push({ text: "You lost the battle!", type: "result" })
    } else {
      winner = "player"
      battleLogs.push({ text: "You won the battle!", type: "result" })
    }

    // Save battle result
    const battleResult = {
      date: new Date().toISOString(),
      playerTeam: myTeam,
      opponentTeam: opponentTeam,
      winner: winner,
      log: battleLogs,
    }

    // Save to battle history
    saveBattleToHistory(battleResult)

    // Start animation sequence
    runBattleAnimation(animationSteps, battleLogs, winner)
  }

  const runBattleAnimation = (animationSteps, allBattleLogs, finalWinner) => {
    let currentStep = 0
    const currentLogs = [{ text: "Battle started!", type: "info" }]

    // Function to process the next animation step
    const processNextStep = () => {
      if (currentStep < animationSteps.length) {
        const step = animationSteps[currentStep]

        // Update active Pokemon if there's a switch
        if (step.playerSwitch) {
          setPlayerActivePokemon(step.playerSwitch)
        }
        if (step.enemySwitch) {
          setEnemyActivePokemon(step.enemySwitch)
        }

        // Set animation state for attack
        if (step.attacker && step.defender) {
          setBattleAnimation({
            isAnimating: true,
            attacker: step.attacker,
            defender: step.defender,
            damage: step.damage,
            isPlayerAttacking: step.isPlayerAttacking,
            round: step.round,
            finished: false,
          })

          // Add relevant logs for this step
          const stepIndex = currentStep * 2
          if (allBattleLogs[stepIndex + 1]) {
            currentLogs.push(allBattleLogs[stepIndex + 1])
          }
          if (allBattleLogs[stepIndex + 2]) {
            currentLogs.push(allBattleLogs[stepIndex + 2])
          }

          setBattleLog([...currentLogs])

          // Wait for animation to complete
          setTimeout(() => {
            currentStep++
            processNextStep()
          }, 2000) // 2 seconds per animation step
        } else {
          // Just a switch, no animation needed
          currentStep++
          processNextStep()
        }
      } else {
        // Animation complete, show final result
        setBattleAnimation({
          isAnimating: false,
          attacker: null,
          defender: null,
          damage: 0,
          round: 0,
          finished: true,
        })

        setBattleLog(allBattleLogs)
        setBattleResult(finalWinner)
      }
    }

    // Start the animation sequence
    processNextStep()
  }

  const getStatValue = (pokemon, statName) => {
    const stat = pokemon.stats.find((s) => s.name === statName)
    return stat ? stat.value : 0
  }

  const saveBattleToHistory = async (battleResult) => {
    try {
      await fetch("http://localhost:3001/battles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(battleResult),
      })
    } catch (error) {
      console.error("Error saving battle history:", error)
    }
  }

  const resetBattle = () => {
    setBattleStarted(false)
    setBattleLog([])
    setBattleResult(null)
    setBattleAnimation({
      isAnimating: false,
      attacker: null,
      defender: null,
      damage: 0,
      round: 0,
      finished: false,
    })
    setPlayerActivePokemon(null)
    setEnemyActivePokemon(null)
    generateOpponentTeam()
  }

  return (
    <div className={`sub-page battle-page ${isPageLoaded ? "page-loaded" : ""}`}>
      <NavBar />
      <main className="container">
        <div className="back-button">
          <Link to="/pokedex" className="btn btn-outline btn-sm">
            ← Back to Pokedex
          </Link>
        </div>

        <div className="text-center">
          <h1 className="battle-title -6">Poke Battle</h1>
          <p className="battle-description">
            Challenge other trainers and test your Pokemon's strength.
          </p>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Preparing for battle...</p>
          </div>
        ) : myTeam.length === 0 ? (
          <div className="empty-team">
            <div className="empty-team-icon">!</div>
            <p>Your team is empty! Go to My Team to add Pokemon before battling.</p>
            <Link to="/pokedex/my-team" className="btn btn-primary">
              My Team
            </Link>
          </div>
        ) : (
          <div className="battle-container">
            {!battleStarted ? (
              <>
                <div className="teams-container">
                  <div className="team-preview player-team">
                    <h2>Your Team</h2>
                    <div className="team-pokemon-grid">
                      {myTeam.map((pokemon) => (
                        <div key={pokemon.id} className="team-pokemon">
                          <div className="team-pokemon-image-container">
                            <img src={pokemon.image || "/placeholder.svg"} alt={pokemon.name} />
                          </div>
                          <span>{pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</span>
                          <div className="pokemon-types">
                            {pokemon.types.map((type) => (
                              <span key={type} className={`type-badge ${type}`}>
                                {type}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* Empty slots */}
                      {Array.from({ length: Math.max(0, 6 - myTeam.length) }).map((_, index) => (
                        <div key={`empty-${index}`} className="team-pokemon empty">
                          <div className="empty-slot">?</div>
                          <span>Empty</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="battle-controls">
                    <div className="versus-badge">VS</div>
                    <button className="btn btn-primary btn-lg battle-btn" onClick={startBattle}>
                      Start Battle
                    </button>
                  </div>

                  <div className="team-preview opponent-team">
                    <div className="team-preview-header">
                      <h2>Opponent Team</h2>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={handleRegenerateOpponents}
                        disabled={regeneratingOpponents}
                      >
                        {regeneratingOpponents ? "Generating..." : "Regenerate Opponents"}
                      </button>
                    </div>

                    {regeneratingOpponents ? (
                      <div className="loading-opponents">
                        <div className="loading-spinner small"></div>
                        <p>Generating new opponents...</p>
                      </div>
                    ) : (
                      <div className="team-pokemon-grid">
                        {opponentTeam.map((pokemon) => (
                          <div key={`opponent-${pokemon.id}`} className="team-pokemon">
                            <div className="team-pokemon-image-container">
                              <img src={pokemon.image || "/placeholder.svg"} alt={pokemon.name} />
                            </div>
                            <span>{pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</span>
                            <div className="pokemon-types">
                              {pokemon.types.map((type) => (
                                <span key={type} className={`type-badge ${type}`}>
                                  {type}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="battle-results">
                {/* Battle animation scene */}
                {battleAnimation.isAnimating && !battleAnimation.finished && (
                  <div className="battle-scene" ref={battleSceneRef}>
                    <div className="battle-arena">
                      <div className="battle-ground"></div>

                      {playerActivePokemon && (
                        <div
                          className={`player-pokemon ${battleAnimation.isPlayerAttacking ? "attacking" : battleAnimation.attacker && !battleAnimation.isPlayerAttacking ? "hit" : ""}`}
                        >
                          <img src={playerActivePokemon.image || "/placeholder.svg"} alt={playerActivePokemon.name} />
                          {battleAnimation.attacker && !battleAnimation.isPlayerAttacking && (
                            <div className="damage-indicator">-{battleAnimation.damage}</div>
                          )}
                          <div className="health-bar">
                            <div
                              className="health-bar-fill"
                              style={{
                                width: `${Math.max(0, ((playerActivePokemon.currentHP || getStatValue(playerActivePokemon, "hp")) / getStatValue(playerActivePokemon, "hp")) * 100)}%`,
                              }}
                            ></div>
                          </div>
                          <div className="pokemon-name">{playerActivePokemon.name}</div>
                        </div>
                      )}

                      {enemyActivePokemon && (
                        <div
                          className={`enemy-pokemon ${!battleAnimation.isPlayerAttacking ? "attacking" : battleAnimation.attacker && battleAnimation.isPlayerAttacking ? "hit" : ""}`}
                        >
                          <img src={enemyActivePokemon.image || "/placeholder.svg"} alt={enemyActivePokemon.name} />
                          {battleAnimation.attacker && battleAnimation.isPlayerAttacking && (
                            <div className="damage-indicator">-{battleAnimation.damage}</div>
                          )}
                          <div className="health-bar">
                            <div
                              className="health-bar-fill"
                              style={{
                                width: `${Math.max(0, ((enemyActivePokemon.currentHP || getStatValue(enemyActivePokemon, "hp")) / getStatValue(enemyActivePokemon, "hp")) * 100)}%`,
                              }}
                            ></div>
                          </div>
                          <div className="pokemon-name">{enemyActivePokemon.name}</div>
                        </div>
                      )}

                      {battleAnimation.attacker && <div className="attack-effect"></div>}
                    </div>

                    <div className="battle-info-panel">
                      <h3>Battle in Progress - Round {battleAnimation.round}</h3>
                      <div className="battle-mini-log">
                        {battleLog.slice(-3).map((entry, index) => (
                          <div key={index} className={`log-entry ${entry.type}`}>
                            {entry.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Battle log and results (shown after animation finishes) */}
                {battleAnimation.finished && (
                  <>
                    <div className="battle-log">
                      <h2>Battle Log</h2>
                      <div className="log-entries" ref={logContainerRef}>
                        {battleLog.map((entry, index) => (
                          <div key={index} className={`log-entry ${entry.type}`}>
                            {entry.text}
                          </div>
                        ))}
                      </div>
                    </div>

                    {battleResult && (
                      <div className={`battle-outcome ${battleResult === "player" ? "victory" : "defeat"}`}>
                        <h2>{battleResult === "player" ? "Victory!" : "Defeat!"}</h2>
                        <div className="outcome-badge">{battleResult === "player" ? "🏆" : "😢"}</div>
                        <p>
                          {battleResult === "player"
                            ? "Congratulations! You won the battle!"
                            : "You lost the battle. Better luck next time!"}
                        </p>
                        <div className="battle-actions">
                          <button className="btn btn-primary" onClick={resetBattle}>
                            Battle Again
                          </button>
                          <Link to="/pokedex/battle-history" className="btn btn-outline">
                            View Battle History
                          </Link>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
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

export default PokeBattlePage
