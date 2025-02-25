// Cache resources
// http://localhost:3000/isolated/exercise/04.js

import * as React from 'react'
import {
  fetchPokemon,
  PokemonInfoFallback,
  PokemonForm,
  PokemonDataView,
  PokemonErrorBoundary,
  // usePokemonResource,
} from '../pokemon'
import {createResource} from '../utils'

function PokemonInfo({pokemonResource}) {
  const pokemon = pokemonResource.read()
  return (
    <div>
      <div className="pokemon-info__img-wrapper">
        <img src={pokemon.image} alt={pokemon.name} />
      </div>
      <PokemonDataView pokemon={pokemon} />
    </div>
  )
}

const SUSPENSE_CONFIG = {
  timeoutMs: 4000,
  busyDelayMs: 300,
  busyMinDurationMs: 700,
}

// 🐨 create a pokemonResourceCache object

// 🐨 create a getPokemonResource function which accepts a name checks the cache
// for an existing resource. If there is none, then it creates a resource
// and inserts it into the cache. Finally the function should return the
// resource.

// const pokemonResourceCache = {}

// function getPokemonResource(name) {
//   let resource = pokemonResourceCache[name]
//   if (!resource) {
//     resource = createPokemonResource(name)
//     pokemonResourceCache[name] = resource
//   }
//   return resource
// }
const PokemonCacheContext = React.createContext()

function PokemonCacheProvider({children}) {
  const cache = React.useRef({})
  const getPokemonResource = React.useCallback(name => {
    const lowerName = name.toLowerCase()
    let resource = cache.current[lowerName]
    if (!resource) {
      resource = createPokemonResource(lowerName)
      cache.current[lowerName] = resource
    }
    return resource
  }, [])

  return (
    <PokemonCacheContext.Provider value={getPokemonResource}>
      {children}
    </PokemonCacheContext.Provider>
  )
}

function usePokemonResourceCache() {
  return React.useContext(PokemonCacheContext)
}

function createPokemonResource(pokemonName) {
  return createResource(fetchPokemon(pokemonName))
}

function App() {
  const [pokemonName, setPokemonName] = React.useState('')
  const [startTransition, isPending] = React.useTransition(SUSPENSE_CONFIG)
  const [pokemonResource, setPokemonResource] = React.useState(null)
  const getPokemonResource = usePokemonResourceCache()

  React.useEffect(() => {
    //console.log(pokemonResourceCache)
    if (!pokemonName) {
      setPokemonResource(null)
      return
    }
    startTransition(() => {
      // 🐨 change this to getPokemonResource instead
      setPokemonResource(getPokemonResource(pokemonName))
    })
  }, [pokemonName, startTransition, getPokemonResource])

  function handleSubmit(newPokemonName) {
    setPokemonName(newPokemonName)
  }

  function handleReset() {
    setPokemonName('')
  }

  return (
    <div className="pokemon-info-app">
      <PokemonForm pokemonName={pokemonName} onSubmit={handleSubmit} />
      <hr />
      <div className={`pokemon-info ${isPending ? 'pokemon-loading' : ''}`}>
        {pokemonResource ? (
          <PokemonErrorBoundary
            onReset={handleReset}
            resetKeys={[pokemonResource]}
          >
            <React.Suspense
              fallback={<PokemonInfoFallback name={pokemonName} />}
            >
              <PokemonInfo pokemonResource={pokemonResource} />
            </React.Suspense>
          </PokemonErrorBoundary>
        ) : (
          'Submit a pokemon'
        )}
      </div>
    </div>
  )
}
function AppWithProvider() {
  return (
    <PokemonCacheProvider>
      <App />
    </PokemonCacheProvider>
  )
}

export default AppWithProvider
