import type { CollectionItem } from '@/global'

type SidebarDropItemType = CollectionItem['_type'] | 'sidebar-list'
type SidebarDropCursorPosition = 'top' | 'bottom'

interface SidebarDropTarget {
    id: string | undefined
    type: SidebarDropItemType
    cursorPosition: SidebarDropCursorPosition
}

interface ResolvedSidebarDropTarget {
    element: HTMLElement
    parentId: string | undefined
    id: string | undefined
    type: SidebarDropItemType
}

export function resolveSidebarDropTarget(eventTarget: Element | null): ResolvedSidebarDropTarget | null {
    if (!eventTarget) {
        return null
    }
    const item = eventTarget.closest('.sidebar-item') as HTMLElement | null
    if (item) {
        return {
            element: item,
            parentId: item.dataset.parentId,
            id: item.dataset.id,
            type: (item.dataset.type as SidebarDropItemType) ?? 'sidebar-list',
        }
    }
    const list = eventTarget.closest('.sidebar-list') as HTMLElement | null
    if (list) {
        return {
            element: list,
            parentId: list.dataset.parentId,
            id: undefined,
            type: 'sidebar-list',
        }
    }
    const container = eventTarget.closest('.sidebar-list-container') as HTMLElement | null
    if (container) {
        const rootList = container.querySelector('.sidebar-list') as HTMLElement | null
        if (rootList) {
            return {
                element: rootList,
                parentId: undefined,
                id: undefined,
                type: 'sidebar-list',
            }
        }
    }
    return null
}

interface SidebarTreeNode {
    _id: string
    children?: SidebarTreeNode[]
}

function findNodeById(nodes: SidebarTreeNode[], id: string): SidebarTreeNode | null {
    for (const node of nodes) {
        if (node._id === id) {
            return node
        }
        if (node.children) {
            const found = findNodeById(node.children, id)
            if (found) {
                return found
            }
        }
    }
    return null
}

// nested list padding resolves to the enclosing folder, so a folder dragged onto its own
// (or a descendant's) children list would become its own parent and vanish from the tree
export function isDropIntoOwnSubtree(tree: SidebarTreeNode[], draggedItemId: string, dropParentId: string | undefined): boolean {
    if (!dropParentId) {
        return false
    }
    const draggedItem = findNodeById(tree, draggedItemId)
    if (!draggedItem) {
        return false
    }
    return findNodeById([draggedItem], dropParentId) !== null
}

export function computeTargetIndex(list: Array<{ _id: string }>, target: SidebarDropTarget): number {
    if (target.cursorPosition === 'bottom') {
        if (target.type === 'request_group') {
            // bottom-half of a folder means "drop INTO it" (pink highlight), so list is the folder's children
            return 0
        }
        if (target.type === 'sidebar-list') {
            return list.length
        }
        return list.findIndex(item => item._id === target.id) + 1
    }
    return list.findIndex(item => item._id === target.id)
}
