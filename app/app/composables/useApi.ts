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
        // AXIOS ADAPTER: Handle fetch-style 'body' for backward compatibility
        if (options.body && !options.data) {
            try {
                // If body is string (JSON), parse it for axios 'data'
                if (typeof options.body === 'string') {
                    options.data = JSON.parse(options.body)
                } else {
                    options.data = options.body
                }
                delete options.body
            } catch (e) {
                // If parse fails or strictly not JSON, pass as is (rare case)
                options.data = options.body
            }
        }

        const response = await client.request<T>({
            url: endpoint,
            ...options
        })
        return response.data
    }

    return { apiFetch, apiBase }
}
