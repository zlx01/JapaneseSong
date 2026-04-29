import { onMounted, onUnmounted, ref } from 'vue'

const DEFAULT_MOBILE_QUERY = '(max-width: 768px)'

export const useMobileActionPanel = (query = DEFAULT_MOBILE_QUERY) => {
    const shellRef = ref<HTMLElement | null>(null)
    const isMobileViewport = ref(false)
    const isOpen = ref(false)
    let mediaQueryList: MediaQueryList | null = null

    const syncViewportState = () => {
        isMobileViewport.value = mediaQueryList?.matches ?? false
        if (!isMobileViewport.value) {
            isOpen.value = false
        }
    }

    const toggle = () => {
        isOpen.value = !isOpen.value
    }

    const close = () => {
        if (isMobileViewport.value) {
            isOpen.value = false
        }
    }

    const handlePointerDownOutside = (event: PointerEvent) => {
        if (!isMobileViewport.value || !isOpen.value) return

        const target = event.target
        if (!(target instanceof Node)) return
        if (shellRef.value?.contains(target)) return

        close()
    }

    onMounted(() => {
        mediaQueryList = window.matchMedia(query)
        syncViewportState()
        mediaQueryList.addEventListener('change', syncViewportState)
        document.addEventListener('pointerdown', handlePointerDownOutside)
    })

    onUnmounted(() => {
        document.removeEventListener('pointerdown', handlePointerDownOutside)
        mediaQueryList?.removeEventListener('change', syncViewportState)
    })

    return {
        shellRef,
        isMobileViewport,
        isOpen,
        toggle,
        close,
    }
}
