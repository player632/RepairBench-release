import { useTheme } from '../../theme'
import { FiSun, FiMoon } from 'react-icons/fi'
import styles from './ThemeSwitch.module.scss'

export function ThemeSwitch() {
    const { themeName, setTheme } = useTheme()

    const handleChange = () => setTheme(themeName === 'light' ? 'dark' : 'light')

    return (
        <button
            className={styles.button}
            type="button"
            onClick={handleChange}
            data-testid="theme-switch"
            data-theme-name={themeName}
        >
            <span className={styles.icon}>{themeName === 'light' ? <FiMoon /> : <FiSun />}</span>
        </button>
    )
}
