import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Variáveis de ambiente (podem estar ausentes em alguns ambientes de dev)
const SUPABASE_URL = typeof process.env.NEXT_PUBLIC_SUPABASE_URL === 'string' ? process.env.NEXT_PUBLIC_SUPABASE_URL.trim() : process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'string' ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim() : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Criação preguiçosa do cliente: não chamamos createClient na importação do módulo
// para evitar erros durante o build quando as variáveis não estiverem configuradas.
let _client: SupabaseClient | null = null;

function createSupabaseClientIfPossible(): SupabaseClient | null {
	if (_client) return _client;
	if (SUPABASE_URL && SUPABASE_ANON_KEY) {
		// Validação simples do formato da URL para evitar 'Provided URL is malformed.'
		const urlPattern = /^https:\/\/[-a-zA-Z0-9_.]+\.supabase\.co\/?$/;
		if (!urlPattern.test(SUPABASE_URL)) {
			if (typeof window !== 'undefined') console.error('[supabaseClient] NEXT_PUBLIC_SUPABASE_URL appears malformed:', SUPABASE_URL);
			else console.error('[supabaseClient] NEXT_PUBLIC_SUPABASE_URL appears malformed (server):', SUPABASE_URL);
			return null;
		}

		_client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
		return _client;
	}
	return null;
}

// Proxy que cria o client quando usado pela primeira vez, ou lança um erro claro
// informando quais variáveis estão faltando.
const makeLazySupabaseProxy = (): SupabaseClient => {
	const missingMsg = 'Supabase client not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment (e.g. .env.local)';

	const handler: ProxyHandler<Record<string, unknown>> = {
		get(_target, prop) {
			const client = createSupabaseClientIfPossible();
			if (!client) {
				// Throw immediately when attempting to access any property
				throw new Error(missingMsg);
			}
			// @ts-expect-error forward to real client
			const value = (client as unknown as Record<string, unknown>)[prop];
			if (typeof value === 'function') return value.bind(client);
			return value;
		},
		// For operations like setting properties
		set(_target, prop, value) {
			const client = createSupabaseClientIfPossible();
			if (!client) throw new Error(missingMsg);
			// @ts-expect-error setting dynamic prop on client
			(client as unknown as Record<string, unknown>)[prop] = value;
			return true;
		},
	};

	return new Proxy({}, handler) as unknown as SupabaseClient;
};

export const supabase: SupabaseClient = makeLazySupabaseProxy();

// Helper para casos onde queremos obter o cliente atual ou null (por exemplo em scripts)
export function getSupabaseClient(): SupabaseClient | null {
	return createSupabaseClientIfPossible();
}
