import { Children, isValidElement, useRef, useState } from 'react';
import { useMotionSettings } from '../lib/motion';
import type { FC, ReactNode } from 'react';
import { Select as Primitive } from '@base-ui/react/select';
import { Icon } from './Icon';

type OptionProps = { value?: string; children: ReactNode };
// Declarative options are read by Select rather than rendered as native controls.
export const SelectOption: FC<OptionProps> = () => null;

// Options here are plain text, so their label text can be read straight from the children.
const textOf = (node: ReactNode) =>
  Children.toArray(node)
    .map((part) => (typeof part === 'string' || typeof part === 'number' ? String(part) : ''))
    .join('');

export function Select({
  value,
  onValueChange,
  children,
  disabled,
  id,
  'aria-label': label,
}: {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
  id?: string;
  'aria-label': string;
}) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const { instant } = useMotionSettings();
  const trigger = useRef<HTMLButtonElement>(null);
  const items = Children.toArray(children).flatMap((child) => {
    if (!isValidElement<OptionProps>(child)) return [];
    return [
      { value: child.props.value ?? textOf(child.props.children), label: child.props.children },
    ];
  });
  return (
    <Primitive.Root
      onOpenChange={() => setContainer(trigger.current?.closest('dialog') ?? document.body)}
      value={value}
      items={items}
      onValueChange={(next) => {
        if (next !== null) onValueChange(next);
      }}
      disabled={disabled}
    >
      <Primitive.Trigger ref={trigger} id={id} className="select-trigger" aria-label={label}>
        <Primitive.Value className="select-value" />
        <Primitive.Icon className="select-chevron">
          <Icon name="chevron" />
        </Primitive.Icon>
      </Primitive.Trigger>
      {/* Keep the popup inside native dialogs' top layer and focus boundary. */}
      <Primitive.Portal container={container}>
        <Primitive.Positioner
          className="select-positioner"
          sideOffset={6}
          positionMethod="fixed"
          alignItemWithTrigger={false}
        >
          <Primitive.Popup className="select-popup" data-instant={instant || undefined}>
            <Primitive.List className="select-list">
              {items.map((item) => (
                <Primitive.Item
                  key={item.value}
                  value={item.value}
                  label={textOf(item.label)}
                  className="select-item"
                >
                  <Primitive.ItemText>{item.label}</Primitive.ItemText>
                  <Primitive.ItemIndicator className="select-check">
                    <Icon name="check" />
                  </Primitive.ItemIndicator>
                </Primitive.Item>
              ))}
            </Primitive.List>
          </Primitive.Popup>
        </Primitive.Positioner>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
