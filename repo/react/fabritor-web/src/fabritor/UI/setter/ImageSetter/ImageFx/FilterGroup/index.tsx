import { Slider } from 'antd';
import './index.scss';

const COLOR_FILTER_LIST = [
  {
    label: '无',
    value: 'none',
    src: '[image omitted]'
  },
  {
    label: '复古',
    value: 'Sepia',
    src: '[image omitted]'
  },
  {
    label: '胶片',
    value: 'Kodachrome',
    src: '[image omitted]'
  },
  {
    label: '老照片',
    value: 'Vintage',
    src: '[image omitted]'
  },
  {
    label: '宝丽来',
    value: 'Polaroid',
    src: '[image omitted]'
  },
  {
    label: '模糊',
    value: 'Blur',
    src: '[image omitted]'
  },
  {
    label: '浮雕',
    value: 'Emboss',
    src: '[image omitted]'
  },
  {
    label: '像素',
    value: 'Pixelate',
    src: '[image omitted]'
  },
  {
    label: '黑白',
    value: 'Grayscale',
    src: '[image omitted]'
  },
  {
    label: '调色',
    value: 'HueRotation',
    src: '[image omitted]'
  }
];

export default function RadioImageGroup (props) {
  const { value, onChange } = props;

  const handleChange = (v, key) => {
    onChange?.({
      ...value,
      [key]: v
    });
  }

  return (
    <div className="fabritor-radio-image-group">
      {
        COLOR_FILTER_LIST.map(option => (
          <div
            className="fabritor-radio-image-group-item"
            onClick={() => { handleChange(option.value, 'type') }}
          >
            <div
              className="fabritor-radio-image-group-img"
              style={{ borderColor: value?.type === option.value ? '#ff2222' : '#eeeeee' }}
            >
              <img src={option.src} />
            </div>
            <span>{option.label}</span>
            {
              option.value === 'Blur' && value?.type === 'Blur' ?
              <Slider
                min={0} 
                max={1}
                step={0.01}
                value={value?.param == undefined ? 0.2 : value?.param}
                onChange={(v) => { handleChange(v, 'param') }} 
              /> : null
            }
            {
              option.value === 'Pixelate' && value?.type === 'Pixelate' ?
              <Slider
                min={2} 
                max={20}
                step={0.01}
                value={value?.param == undefined ? 4 : value?.param}
                onChange={(v) => { handleChange(v, 'param') }} 
              /> : null
            }
            {
              option.value === 'HueRotation' && value?.type === 'HueRotation' ?
              <Slider
                min={-2} 
                max={2}
                step={0.002}
                value={value?.param == undefined ? 0 : value?.param}
                onChange={(v) => { handleChange(v, 'param') }} 
              /> : null
            }
          </div>
        ))
      }
    </div>
  )
}