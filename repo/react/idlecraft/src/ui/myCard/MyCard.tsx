import { memo, ReactNode } from 'react'
import { CardHeader, CardTitle } from '@/components/ui/card'

export const MyCardHeaderTitle = memo(function MyCardHeaderTitle(props: {
    title?: string
    icon?: ReactNode
    rightSlot?: ReactNode
    onClick?: () => void
    testId?: string
}) {
    const { title, icon, rightSlot, onClick, testId } = props

    return (
        <CardHeader>
            <CardTitle data-testid={testId} onClick={onClick}>
                {icon && <span className="text-lg">{icon}</span>} {title} {rightSlot}
            </CardTitle>
        </CardHeader>
    )
})
