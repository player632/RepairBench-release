import { Flex, Slider, InputNumber } from 'antd';

export default function SliderInputNumber (props) {
  const { min = 1, max = 100, step = 1, style, sliderProps, inputProps, onChange, onChangeComplete, value, ...rest } = props;
  return (
    <Flex gap={6} style={style} {...rest}>
      <Slider
        style={{ flex: 1 }}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
        onAfterChange={onChangeComplete}
        value={value}
        {...sliderProps}
      />
      <InputNumber
        min={min}
        max={max}
        step={step}
        onChange={onChange}
        value={value}
        style={{ width: 56 }}
        controls={false}
        {...inputProps}
      />
    </Flex>
  )
}