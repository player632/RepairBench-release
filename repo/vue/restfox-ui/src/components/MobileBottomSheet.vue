<template>
    <teleport to="body">
        <div v-if="show" class="mobile-sheet-overlay" @click.self="$emit('update:show', false)">
            <div class="mobile-sheet">
                <div class="mobile-sheet-handle-row">
                    <div class="mobile-sheet-handle"></div>
                </div>
                <div v-if="title" class="mobile-sheet-title">{{ title }}</div>
                <div class="mobile-sheet-items">
                    <template v-for="item in items" :key="item.value ?? item.label">
                        <div v-if="item.type === 'separator'" class="mobile-sheet-divider"></div>
                        <div v-else-if="item.type === 'section-header'" class="mobile-sheet-section-header">
                            <i v-if="item.icon" :class="'fa ' + item.icon"></i>
                            <span>{{ item.label }}</span>
                        </div>
                        <div v-else class="mobile-sheet-row" :class="{ 'mobile-sheet-row--danger': item.type === 'danger' }" @click="handleSelect(item.value)">
                            <i v-if="item.icon" :class="'fa ' + item.icon"></i>
                            <div class="mobile-sheet-row-text">
                                <div class="mobile-sheet-row-label-line">
                                    <span>{{ item.label }}</span>
                                    <div v-if="item.tags?.length" class="mobile-sheet-row-tags">
                                        <span v-for="tag in item.tags" :key="tag.text" class="mobile-sheet-tag" :class="tag.color ? `mobile-sheet-tag--${tag.color}` : ''">{{ tag.text }}</span>
                                    </div>
                                </div>
                                <div v-if="item.sublabel" class="mobile-sheet-row-sublabel">
                                    <span v-if="item.method" :class="`request-method--${item.method}`">{{ item.method }}</span>
                                    <span>{{ item.sublabel }}</span>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </teleport>
</template>

<script>
export default {
    props: {
        show: {
            type: Boolean,
            required: true
        },
        title: {
            type: String,
            default: ''
        },
        items: {
            type: Array,
            default: () => []
        }
    },
    emits: ['select', 'update:show'],
    methods: {
        handleSelect(value) {
            this.$emit('select', value)
            this.$emit('update:show', false)
        }
    }
}
</script>

<style scoped>
.mobile-sheet-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 1000;
    display: flex;
    align-items: flex-end;
}

.mobile-sheet {
    background: var(--background-color);
    width: 100%;
    border-radius: 12px 12px 0 0;
    padding-bottom: env(safe-area-inset-bottom, 0px);
    animation: sheet-up 200ms ease;
    max-height: 75vh;
    display: flex;
    flex-direction: column;
}

@keyframes sheet-up {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
}

.mobile-sheet-handle-row {
    display: flex;
    justify-content: center;
    padding: 10px 0 6px;
}

.mobile-sheet-handle {
    width: 36px;
    height: 4px;
    background: var(--default-border-color);
    border-radius: 2px;
}

.mobile-sheet-items {
    overflow-y: auto;
    flex: 1;
}

.mobile-sheet-title {
    padding: 0 16px 8px;
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--text-color);
}

.mobile-sheet-divider {
    height: 1px;
    background: var(--default-border-color);
    margin: 4px 0;
}

.mobile-sheet-section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 16px 4px;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.mobile-sheet-section-header .fa {
    width: 16px;
    text-align: center;
}

.mobile-sheet-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    cursor: pointer;
    color: var(--text-color);
    font-size: 0.95rem;
}

.mobile-sheet-row:active {
    background: var(--sidebar-item-active-color);
}

.mobile-sheet-row .fa {
    width: 18px;
    text-align: center;
    color: var(--text-color);
    flex-shrink: 0;
}

.mobile-sheet-row-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

.mobile-sheet-row-label-line {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
}

.mobile-sheet-row-tags {
    display: flex;
    gap: 4px;
}

.mobile-sheet-tag {
    font-size: 0.7rem;
    font-weight: 600;
    padding: 1px 5px;
    border-radius: 3px;
    background: var(--default-border-color);
    color: var(--text-color);
}

.mobile-sheet-tag--green { background: #75ba24; color: white; }
.mobile-sheet-tag--yellow { background: #ec8702; color: white; }
.mobile-sheet-tag--red { background: #e15251; color: white; }

.mobile-sheet-row-sublabel {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.75rem;
    color: var(--tip-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.mobile-sheet-row--danger {
    color: var(--base-color-error);
}

.mobile-sheet-row--danger .fa {
    color: var(--base-color-error);
}
</style>
