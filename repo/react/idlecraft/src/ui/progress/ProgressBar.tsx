import { clsx } from 'clsx'
import { memo } from 'react'
import { Colors } from '../state/uiFunctions'
import './progress.css'

export const ProgressBar = memo(function ProgressBar(props: {
    value: number
    className?: string
    color: Colors
    testId?: string
}) {
    const { value, className, color, testId } = props
    const progress = -100 + value

    return (
        <div data-testid={testId} className={clsx('progress__root', className, color)}>
            <div className="progress__bar" style={{ transform: `translateX(${progress}%)` }} />
        </div>
    )
})
