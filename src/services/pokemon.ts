export const POKEMON_LIMIT = 100;
const PAGE_SIZE = 20;
const CONCURRENT_REQUESTS = 5;
const API_URL = 'https://pokeapi.co/api/v2/pokemon';

export type Pokemon = {
  id: number;
  name: string;
  image: string | null;
  cry: string | null;
  types: string[];
  height: number;
  weight: number;
  abilities: string[];
};

type PokemonResponse = {
  id: number;
  name: string;
  sprites: { front_default: string | null };
  cries?: { latest?: string | null; legacy?: string | null };
  types: { slot: number; type: { name: string } }[];
  height: number;
  weight: number;
  abilities: { ability: { name: string } }[];
};

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`PokéAPI respondió con HTTP ${response.status}`);
  return response.json();
}

export async function fetchPokemonPage(offset: number, signal: AbortSignal): Promise<Pokemon[]> {
  if (!Number.isInteger(offset) || offset < 0) {
    throw new Error('El desplazamiento debe ser un entero positivo o cero.');
  }
  const limit = Math.min(PAGE_SIZE, POKEMON_LIMIT - offset);
  if (limit <= 0) return [];

  const page = await fetchJson<{ results: { url: string }[] }>(
    `${API_URL}?limit=${limit}&offset=${offset}`,
    signal,
  );

  // Fetch details in small groups rather than starting 100 requests together.
  const results = page.results.slice(0, limit);
  const pokemons: Pokemon[] = [];
  for (let start = 0; start < results.length; start += CONCURRENT_REQUESTS) {
    const batch = await Promise.all(
      results.slice(start, start + CONCURRENT_REQUESTS).map(async ({ url }) => {
        const pokemon = await fetchJson<PokemonResponse>(url, signal);
        return {
          id: pokemon.id,
          name: pokemon.name,
          image: pokemon.sprites.front_default,
          cry: pokemon.cries?.latest || pokemon.cries?.legacy || null,
          types: pokemon.types.sort((a, b) => a.slot - b.slot).map(({ type }) => type.name),
          height: pokemon.height / 10, // decimetres to metres
          weight: pokemon.weight / 10, // hectograms to kilograms
          abilities: pokemon.abilities.map(({ ability }) => ability.name),
        };
      }),
    );
    pokemons.push(...batch);
  }
  return pokemons;
}
