<script>
    import {notifications} from '$lib/store'
    import Notification from '$lib/ui/Notification.svelte'
</script>

<div data-testid="notifications-container" class="absolute bottom-0 flex flex-col items-center justify-center w-full pointer-events-none z-50">
    {#each $notifications as notification (notification)}
        <Notification {notification} />
    {/each}
</div>
