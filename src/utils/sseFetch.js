import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

/**
 * 封装用于处理标准 SSE 流式输出的 fetch 请求
 * @param {string} url - 请求路径
 * @param {object} options - 配置对象 { method: 'GET'|'POST', bodyData: {}, signal: AbortSignal }
 * @param {object} callbacks - { onMessage, onError, onComplete }
 */
export const fetchSSE = async (url, options = {}, { onMessage, onError, onComplete }) => {
    const userStore = useUserStore()
    const token = userStore.token
    const baseURL = import.meta.env.VITE_API_BASE_URL || ''

    if (!token) {
        ElMessage.warning('请先登录后再使用该功能')
        onError?.(new Error('未登录'))
        return
    }

    const method = (options.method || 'POST').toUpperCase()
    const fetchConfig = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        signal: options.signal // 支持主动取消请求
    }

    // 只有 POST 才挂载 body
    if (method === 'POST' && options.bodyData) {
        fetchConfig.body = JSON.stringify(options.bodyData)
    }

    try {
        const response = await fetch(`${baseURL}${url}`, fetchConfig)

        if (response.status === 401) {
            userStore.logout()
            ElMessage.error('登录状态已过期，请重新登录')
            throw new Error('Unauthorized')
        }

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`)

        const reader = response.body.getReader()
        const decoder = new TextDecoder('utf-8')
        let done = false
        let buffer = ''

        while (!done) {
            const { value, done: readerDone } = await reader.read()
            done = readerDone
            if (value) {
                buffer += decoder.decode(value, { stream: true })
                const parts = buffer.split('\n\n')
                buffer = parts.pop()

                for (const part of parts) {
                    if (part.includes('event: error')) {
                        const rawData = part.split('data:')[1]
                        let errorMessage = '服务端生成时发生错误'
                        if (rawData) {
                            try {
                                const errorPayload = JSON.parse(rawData.trim())
                                errorMessage = errorPayload.error || errorMessage
                            } catch (e) {
                                errorMessage = rawData.trim()
                            }
                        }
                        onError?.(new Error(errorMessage))
                        return
                    }

                    if (part.startsWith('data:')) {
                        const dataStr = part.slice(5).trim()
                        if (dataStr === '[DONE]') {
                            onComplete?.()
                            return
                        }
                        try {
                            const parsedData = JSON.parse(dataStr)
                            if (parsedData.content) {
                                onMessage?.(parsedData.content)
                            }
                        } catch (err) {
                            console.warn('流式 JSON 解析警告:', dataStr, err)
                        }
                    }
                }
            }
        }
    } catch (error) {
        // 如果是因为切换轮播图导致的 DOMException (AbortError)，我们不弹窗报错
        if (error.name === 'AbortError') {
            console.log('流式请求被主动取消')
            return
        }
        onError?.(error)
    }
}