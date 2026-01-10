/**
 * Composable for API calls to backend
 * Uses runtime config for API base URL
 */
export function useApi() {
    const config = useRuntimeConfig()
    const apiBase = config.public.apiBase

    const apiFetch = async <T = any>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> => {
        const url = `${apiBase}${endpoint}`

        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        })

        return response.json()
    }

    return { apiFetch, apiBase }
}
