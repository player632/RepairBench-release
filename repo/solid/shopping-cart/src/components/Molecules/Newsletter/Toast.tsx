import { onMount, ParentComponent, createSignal } from 'solid-js';
import styles from './Styles/Toast.module.css';
import { Close } from '@/components/Atoms';

const Toast: ParentComponent<{
  close: () => void;
  success: boolean;
  time: number;
}> = (props) => {
  const [time, setTime] = createSignal<number>(100);

  let intervalid: number;

  onMount(() => {
    intervalid = setInterval(() => {
      setTime(time() - 1);
      if (time() === 0) {
        clearInterval(intervalid);
        props.close();
      }
    }, props.time / 10);
  });

  return (
    <div
      data-rb-toast="1"
      class={`${styles.toast} ${props.success && styles.success}`}
    >
      <div data-rb-close="toast">
        <Close
          onClick={() => {
            clearInterval(intervalid);
            props.close();
          }}
          classname='light'
        />
      </div>
      <div class={styles.close}>
        <img
          src={`/images/${props.success ? 'done' : 'error'}.png`}
          alt='close'
        />
        {props.children}
      </div>
      <div class={styles.outer}>
        <div
          data-rb-bar="1"
          class={styles.inner}
          style={{
            width: `${time()}%`,
            transition: `width ${props.time / 100}ms`,
          }}
        />
      </div>
    </div>
  );
};

export default Toast;
