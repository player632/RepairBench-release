import {
  ModalForm,
  ProFormDateTimePicker,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Button, Result } from 'antd';
import { cloneElement, isValidElement, type FC } from 'react';
import type { BasicListItemDataType } from '../data.d';
import useStyles from '../style.style';

type OperationModalProps = {
  done: boolean;
  open: boolean;
  current: Partial<BasicListItemDataType> | undefined;
  onDone: () => void;
  onSubmit: (values: BasicListItemDataType) => void;
  children?: React.ReactElement;
};
const OperationModal: FC<OperationModalProps> = (props) => {
  const { styles } = useStyles();
  const { done, open, current, onDone, onSubmit, children } = props;

  return (
    <ModalForm<BasicListItemDataType>
      open={open}
      title={done ? null : `任务${current ? '编辑' : '添加'}`}
      className={styles.standardListForm}
      width={640}
      onFinish={async (values) => {
        onSubmit(Object.assign({}, values, current ? { id: current.id } : {}));
      }}
      initialValues={current}
      submitter={{
        render: (_, dom) => {
          if (done) return null;
          const items = Array.isArray(dom) ? dom : [dom];
          const last = items[items.length - 1];
          const tagged = isValidElement(last)
            ? cloneElement(last, { 'data-testid': 'modal-submit' })
            : last;
          return [...items.slice(0, items.length - 1), tagged];
        },
      }}
      trigger={children}
      modalProps={{
        onCancel: () => onDone(),
        destroyOnHidden: true,
        styles: {
          body: done
            ? {
                padding: '72px',
              }
            : undefined,
        },
      }}
    >
      {!done ? (
        <>
          <ProFormText
            name="title"
            fieldProps={{ 'data-testid': 'modal-title-input' }}
            label="任务名称"
            rules={[
              {
                required: true,
                message: '请输入任务名称',
              },
            ]}
            placeholder="请输入"
          />
          <ProFormDateTimePicker
            name="createdAt"
            label="开始时间"
            rules={[
              {
                required: true,
                message: '请选择开始时间',
              },
            ]}
            fieldProps={{
              style: {
                width: '100%',
              },
              inputRender: (inputProps) => (
                <input {...inputProps} data-testid="modal-createdat" />
              ),
            }}
            placeholder="请选择"
          />
          <ProFormSelect
            name="owner"
            fieldProps={{ 'data-testid': 'modal-owner' }}
            label="任务负责人"
            rules={[
              {
                required: true,
                message: '请选择任务负责人',
              },
            ]}
            options={[
              {
                label: '付晓晓',
                value: 'xiao',
              },
              {
                label: '周毛毛',
                value: 'mao',
              },
            ]}
            placeholder="请选择管理员"
          />
          <ProFormTextArea
            name="subDescription"
            label="产品描述"
            rules={[
              {
                message: '请输入至少五个字符的产品描述！',
                min: 5,
              },
            ]}
            placeholder="请输入至少五个字符"
          />
        </>
      ) : (
        <Result
          status="success"
          title="操作成功"
          subTitle="一系列的信息描述，很短同样也可以带标点。"
          extra={
            <Button type="primary" onClick={onDone}>
              知道了
            </Button>
          }
          className={styles.formResult}
        />
      )}
    </ModalForm>
  );
};
export default OperationModal;
