<script lang="ts">
	import { format } from 'date-fns';
	import { create_interval } from '🍎/state/interval.svelte';

	const time = create_interval(1000);
</script>

<div data-testid="probe-clock" style:margin="0 0.5rem">
	{format(time.value, 'EEE MMM dd')}&nbsp; {format(time.value, 'h:mm aa')}
</div>
<span data-testid="probe-clock-raw" aria-hidden="true" style="position:absolute;left:-9999px;">{time.value}</span>
