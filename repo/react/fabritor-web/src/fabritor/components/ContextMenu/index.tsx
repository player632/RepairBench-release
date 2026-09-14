import { useImperativeHandle, forwardRef, useState, useContext } from 'react';
import type { MenuProps } from 'antd';
import { Dropdown, Flex } from 'antd';
import { SKETCH_ID } from '@/utils/constants';
import { copyObject, pasteObject, removeObject, groupSelection, ungroup, changeLayerLevel } from '@/utils/helper';
import { GlobalStateContext } from '@/context';
import { useTranslation } from '@/i18n/utils';

// ⌘ C
const ContextMenuItem = (props) => {
  const { label, keyboard, cmdKey = false } = props;
  const { t } = useTranslation();
  const isMac = navigator.userAgent.indexOf('Mac OS X') > -1;

  const getCmdkey = () => {
    if (cmdKey) {
      if (isMac) return '⌘';
      return 'Ctrl'
    }
    return '';
  }

  return (
    <Flex gap={68} justify="space-between">
      <span>{label}</span>
      <span>{`${getCmdkey()} ${keyboard}`}</span>
    </Flex>
  )
}

const ContextMenu = (props, ref) => {
  const { object, noCareOpen } = props;
  const [open, setOpen] = useState(false);
  const { editor } = useContext(GlobalStateContext);
  const { t } = useTranslation();

  const renderMenuItems = () => {
    if (!object || object.id === SKETCH_ID) {
      return [
        {
          label: <span data-testid="ctx-paste-empty"><ContextMenuItem label={t('setter.common.paste')} keyboard="V" cmdKey /></span>,
          key: 'paste',
        }
      ]
    }

    const menuItems: MenuProps['items']  = [
      {
        label: <span data-testid="ctx-copy"><ContextMenuItem label={t('setter.common.copy')} keyboard="C" cmdKey /></span>,
        key: 'copy',
      },
      {
        label: <span data-testid="ctx-paste"><ContextMenuItem label={t('setter.common.paste')} keyboard="V" cmdKey /></span>,
        key: 'paste',
      },
      {
        label: <span data-testid="ctx-dup">{t('setter.common.create_a_copy')}</span>,
        key: 'copy&paste',
      },
      {
        label: <span data-testid="ctx-del"><ContextMenuItem label={t('setter.common.del')} keyboard="DEL" /></span>,
        key: 'del',
      },
    ]

    if (object.type === 'activeSelection') {
      menuItems.push({
        type: 'divider',
      });
      menuItems.push({
        label: <span data-testid="ctx-group">{t('setter.group.g')}</span>,
        key: 'group',
      });
    }

    if (object.type === 'group' && !object.sub_type) {
      menuItems.push({
        type: 'divider',
      });
      menuItems.push({
        label: <span data-testid="ctx-ungroup">{t('setter.group.ung')}</span>,
        key: 'ungroup',
      });
    }

    if (object.type !== 'activeSelection') {
      menuItems.push({
        type: 'divider',
      });
      menuItems.push({
        label: <span data-testid="ctx-layer">{t('setter.common.layer')}</span>,
        key: 'layer',
        children: [
          {
            label: <span data-testid="ctx-layer-up">{t('setter.common.layer_up')}</span>,
            key: 'layer-up',
          },
          {
            label: <span data-testid="ctx-layer-top">{t('setter.common.layer_top')}</span>,
            key: 'layer-top',
          },
          {
            label: <span data-testid="ctx-layer-down">{t('setter.common.layer_down')}</span>,
            key: 'layer-down',
          },
          {
            label: <span data-testid="ctx-layer-bottom">{t('setter.common.layer_bottom')}</span>,
            key: 'layer-bottom'
          }
        ]
      });
    }
    
    return menuItems;
  }

  const handleClick = async ({ key }) => {
    switch (key) {
      case 'copy':
        await copyObject(editor.canvas, object);
        break;
      case 'paste':
        pasteObject(editor.canvas);
        break;
      case 'copy&paste':
        await copyObject(editor.canvas, object);
        await pasteObject(editor.canvas);
        break;
      case 'del':
        removeObject(object, editor.canvas);
        break;
      case 'group':
        groupSelection(editor.canvas, object);
        break;
      case 'ungroup':
        ungroup(editor.canvas, object);
        break;
      case 'layer-up':
      case 'layer-top':
      case 'layer-down':
      case 'layer-bottom':
        changeLayerLevel(key, editor, object);
      default:
        break; 
    }
    setOpen(false);
  } 

  useImperativeHandle(ref, () => ({
    show: () => setOpen(true),
    hide: () => setOpen(false),
  }));

  return (
    <Dropdown
      menu={{ items: renderMenuItems(), onClick: handleClick }}
      trigger={['contextMenu']}
      open={noCareOpen ? undefined : open}
    >
      {props.children}
    </Dropdown>
  )
}

export default forwardRef(ContextMenu);