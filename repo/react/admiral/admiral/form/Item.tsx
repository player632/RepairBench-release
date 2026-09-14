import React, { useId } from 'react'
import styles from './Form.module.scss'
import cn from 'classnames'
import Error from './Error'

export interface FormItemProps {
    label?: string
    error?: string
    showError?: boolean
    required?: boolean
    columnSpan?: 1 | 2
    onLabelClick?: React.MouseEventHandler<HTMLLabelElement>
    labelAs?: string | React.JSXElementConstructor<any>
    children?: React.ReactNode
}

function Item({
    label,
    required = false,
    error,
    showError = true,
    columnSpan = 1,
    onLabelClick,
    labelAs: LabelComponent = 'label',
    children,
}: FormItemProps) {
    const errorId = useId()

    // RepairBench instrumentation: a stable, label-derived test id so the
    // verifier can address a form field without depending on CSS-module hashes.
    // Purely additive - it derives from a prop the component already receives
    // and changes no behaviour.
    const rbTestId = label
        ? `form-item-${String(label)
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '')}`
        : undefined

    return (
        <div
            className={cn(styles.item, { [styles.item__ColumnSpanTwo]: columnSpan === 2 })}
            data-testid={rbTestId}
        >
            <LabelComponent onClick={onLabelClick}>
                <span
                    className={cn(styles.item_Label, { [styles.item_Label__Required]: required })}
                >
                    {label}
                </span>
                <div
                    className={styles.item_Field}
                    aria-invalid={!!error || undefined}
                    aria-describedby={error ? errorId : undefined}
                >
                    {children}
                </div>
            </LabelComponent>

            {showError && (
                <div id={error ? errorId : undefined}>
                    <Error error={error} />
                </div>
            )}
        </div>
    )
}

export default Item
