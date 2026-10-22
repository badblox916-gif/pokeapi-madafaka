import { useEffect, useRef, useState } from 'react';

import { fetchPokemonPage, POKEMON_LIMIT, type Pokemon } from '@/services/pokemon';

export function usePokemons() {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const offset = useRef(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        while (offset.current < POKEMON_LIMIT) {
          const page = await fetchPokemonPage(offset.current, controller.signal);
          if (controller.signal.aborted) return;
          if (page.length === 0) throw new Error('La API no devolvió los Pokémon restantes.');

          offset.current += page.length;
          setPokemons((previous) => [...previous, ...page]);
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los Pokémon.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [attempt]);

  const retry = () => {
    if (loading) return;
    setError(null);
    setLoading(true);
    setAttempt((previous) => previous + 1);
  };

  return { pokemons, loading, error, retry };
}
