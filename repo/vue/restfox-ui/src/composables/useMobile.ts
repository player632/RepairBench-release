import { ref } from 'vue'

const mql = window.matchMedia('(max-width: 768px)')
const isMobile = ref(mql.matches)

mql.addEventListener('change', (e: MediaQueryListEvent) => {
    isMobile.value = e.matches
})

export function useMobile() {
    return { isMobile }
}
