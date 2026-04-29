import { onMounted, onUnmounted, ref } from 'vue'

export const useScrollJumpButtons = (threshold = 240) => {
    const showBackToTop = ref(false)
    const showGoToBottom = ref(false)

    const syncScrollState = () => {
        showBackToTop.value = window.scrollY > threshold

        const distanceToBottom =
            document.documentElement.scrollHeight - (window.scrollY + window.innerHeight)
        showGoToBottom.value = distanceToBottom > threshold
    }

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const scrollToBottom = () => {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
    }

    onMounted(() => {
        syncScrollState()
        window.addEventListener('scroll', syncScrollState, { passive: true })
    })

    onUnmounted(() => {
        window.removeEventListener('scroll', syncScrollState)
    })

    return {
        showBackToTop,
        showGoToBottom,
        scrollToTop,
        scrollToBottom,
    }
}
