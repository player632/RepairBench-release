import { Component } from 'solid-js';
import { formatTime } from '../../../lib/helpers';

interface Props {
    time: number;
    duration: number;
}

const Time: Component<Props> = (props) => (
    <div data-rb-info-time="1" class="relative flex gap-1 text-sm font-montserrat text-light-50">
        <span data-rb-time-current="1">{props.duration ? formatTime(props.time || 0) : '--'}</span>
        <span>/</span>
        <span data-rb-time-duration="1">{props.duration ? formatTime(props.duration || 0) : '--'}</span>
    </div>
);

export default Time;
