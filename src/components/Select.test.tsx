import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { Select, SelectOption } from './Select';
import { Modal } from './Modal';
function Example({ disabled = false }) {
  const [value, setValue] = useState('');
  return (
    <Select aria-label="Category" value={value} onValueChange={setValue} disabled={disabled}>
      <SelectOption value="">All categories</SelectOption>
      <SelectOption value="Work">Work</SelectOption>
      <SelectOption value="Health">Health</SelectOption>
    </Select>
  );
}
it('opens a custom list, chooses an option, and restores trigger focus', async () => {
  const user = userEvent.setup();
  render(<Example />);
  const trigger = screen.getByRole('combobox', { name: 'Category' });
  await user.click(trigger);
  await user.click(await screen.findByRole('option', { name: 'Health' }));
  expect(trigger).toHaveTextContent('Health');
  await waitFor(() => expect(trigger).toHaveFocus());
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
});
it('supports keyboard navigation and Escape without closing its parent dialog', async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  render(
    <Modal id="testDialog" title="Task" onClose={onClose}>
      <Example />
    </Modal>,
  );
  const trigger = screen.getByRole('combobox', { name: 'Category' });
  trigger.focus();
  await user.keyboard('{ArrowDown}');
  const list = await screen.findByRole('listbox');
  expect(screen.getByRole('dialog')).toContainElement(list);
  await user.keyboard('{End}{Enter}');
  expect(trigger).toHaveTextContent('Health');
  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
  await user.click(trigger);
  await screen.findByRole('listbox');
  await user.keyboard('{Escape}');
  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
  expect(onClose).not.toHaveBeenCalled();
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
it('keeps a disabled select closed', async () => {
  render(<Example disabled />);
  await userEvent.click(screen.getByRole('combobox'));
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
});
