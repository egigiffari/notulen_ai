import axios from 'axios'

export function useApi() {
    const config = useRuntimeConfig()
    const apiBase = config.public.apiBase

    // Create axios instance
    const client = axios.create({
        baseURL: apiBase,
        headers: {
            'Content-Type': 'application/json'
        },
        // Mimic fetch behavior: don't throw on error status codes
        validateStatus: () => true
    })

    const apiFetch = async <T = any>(
        endpoint: string,
        options: any = {}
    ): Promise<T> => {
        const response = await client.request<T>({
            url: endpoint,
            ...options
        })
        return response.data
    }

    return { apiFetch, apiBase }
}
