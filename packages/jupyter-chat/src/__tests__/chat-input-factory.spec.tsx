/*
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */

import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';

import { ChatInput } from '../components/input/chat-input';
import { ChatReactContext } from '../context';
import { IChatInputFactory } from '../tokens';
import { MockChatModel } from './mocks';

(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe('ChatInput factory', () => {
  let container: HTMLDivElement;
  let root: Root;
  let model: MockChatModel;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    model = new MockChatModel();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function render(factory?: IChatInputFactory, edit = false) {
    const onCancel = jest.fn();
    act(() => {
      root.render(
        <ChatReactContext.Provider
          value={{
            model,
            rmRegistry: {} as IRenderMimeRegistry,
            chatInputFactory: factory
          }}
        >
          <ChatInput model={model.input} edit={edit} onCancel={onCancel} />
        </ChatReactContext.Provider>
      );
    });
    return onCancel;
  }

  it('renders the stock control and surrounding input by default', () => {
    render();
    expect(container.querySelector('.jp-chat-input-textfield')).not.toBeNull();
    expect(container.querySelector('.jp-chat-input-toolbar')).not.toBeNull();
    expect(
      container
        .querySelector('.jp-chat-input-container')
        ?.getAttribute('data-input-id')
    ).toBe(model.input.id);
  });

  it('renders the stock control during message editing by default', () => {
    render(undefined, true);
    expect(container.querySelector('.jp-chat-input-textfield')).not.toBeNull();
  });

  it.each([false, true])(
    'passes the model and edit props to a custom control (edit=%s)',
    edit => {
      const factory: IChatInputFactory = {
        create: jest.fn((props: ChatInput.IProps) => (
          <button
            data-testid="custom-input"
            onClick={() => {
              props.model.value = 'draft';
              props.model.cursorIndex = 3;
              props.model.focus();
              props.onCancel?.();
            }}
          />
        ))
      };
      const focusSpy = jest.spyOn(model.input, 'focus');
      const onCancel = render(factory, edit);
      const props = (factory.create as jest.Mock).mock.calls[0][0];
      expect(props.model).toBe(model.input);
      expect(props.edit).toBe(edit);
      expect(props.onCancel).toBe(onCancel);
      expect(container.querySelector('.jp-chat-input-textfield')).toBeNull();
      expect(container.querySelector('.jp-chat-input-toolbar')).not.toBeNull();
      expect(
        container
          .querySelector('.jp-chat-input-container')
          ?.getAttribute('data-input-id')
      ).toBe(model.input.id);
      act(() =>
        container
          .querySelector<HTMLElement>('[data-testid="custom-input"]')!
          .click()
      );
      expect(model.input.value).toBe('draft');
      expect(model.input.cursorIndex).toBe(3);
      expect(focusSpy).toHaveBeenCalledTimes(1);
      expect(onCancel).toHaveBeenCalledTimes(1);
    }
  );

  it('keeps the attachment preview outside the custom control', () => {
    model.input.addAttachment?.({ type: 'file', value: 'notes.txt' });
    render({ create: () => <div data-testid="custom-input" /> });
    expect(container.textContent).toContain('notes.txt');
    expect(container.querySelector('.jp-chat-input-toolbar')).not.toBeNull();
  });
});
