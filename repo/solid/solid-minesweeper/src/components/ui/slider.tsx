import {
  Slider as SliderPrimitive,
  SliderRootProps,
} from "@kobalte/core/slider";
import { cn } from "@/libs/cn";
import { Show, splitProps } from "solid-js";

type SliderProps = SliderRootProps & {
  labelText?: string;
  class?: string;
  labelContainerClass?: string;
  labelClass?: string;
  valueLabelClass?: string;
  trackClass?: string;
  fillClass?: string;
  thumbClass?: string;
  inputClass?: string;
};

const rootClass =
  "relative flex w-full touch-none select-none items-center flex-col";
const labelContainerClass = "w-full flex justify-between";
const labelClass = "";
const valueLabelClass = "";
const trackClass =
  "relative h-2 w-full grow overflow-visible rounded-full bg-secondary";
const fillClass = "absolute h-full bg-primary rounded-full";
const thumbClass =
  "block h-5 w-5 top-[-5px] rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
const inputClass = "";

export const Slider = (props: SliderProps) => {
  const [local, rest] = splitProps(props, [
    "labelText",
    "class",
    "labelContainerClass",
    "labelClass",
    "valueLabelClass",
    "trackClass",
    "fillClass",
    "thumbClass",
    "inputClass",
    "value",
  ]);
  const initialValue = (local.value || [])[0];
  return (
    <SliderPrimitive
      class={cn(rootClass, local.class)}
      {...rest}
      value={[initialValue]}
    >
      <div class={cn(labelContainerClass, local.labelContainerClass)}>
        <Show when={local.labelText}>
          <SliderPrimitive.Label class={cn(labelClass, local.labelClass)}>
            {local.labelText}
          </SliderPrimitive.Label>
        </Show>
        <SliderPrimitive.ValueLabel
          class={cn(valueLabelClass, local.valueLabelClass)}
          data-rb-zoom-valuelabel=""
        />
      </div>
      <SliderPrimitive.Track class={cn(trackClass, local.trackClass)}>
        <SliderPrimitive.Fill class={cn(fillClass, local.fillClass)} />
        <SliderPrimitive.Thumb class={cn(thumbClass, local.thumbClass)} data-rb-zoom-thumb="">
          <SliderPrimitive.Input class={cn(inputClass, local.inputClass)} />
        </SliderPrimitive.Thumb>
      </SliderPrimitive.Track>
    </SliderPrimitive>
  );
};
