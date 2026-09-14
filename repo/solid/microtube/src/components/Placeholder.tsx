import { Component, JSXElement } from 'solid-js';
import Icon from './Icon';

interface Props {
    icon: string;
    text: string;
    children?: JSXElement;
}

const Placeholder: Component<Props> = (props) => (
    <div data-rb-placeholder="1" class="flex flex-col flex-grow items-center justify-center gap-4 text-light-50">
        <Icon name={props.icon} />

        <p data-rb-placeholder-text="1">{props.text}</p>

        {props.children}
    </div>
);

export default Placeholder;
