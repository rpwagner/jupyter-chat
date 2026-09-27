/*
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */

import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';

// React 18 asks test environments to declare themselves, otherwise every
// `act` call warns.
(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

import { ChatInput } from '../components/input/chat-input';
import { ChatBody } from '../components/chat';
import { ChatReactContext } from '../context';
import { ChatCommandRegistry, IChatCommandRegistry } from '../registers';
import { IChatInputFactory } from '../tokens';
import { IConfig } from '../types';
import { MockChatModel } from './mocks';

const DEFAULT_PLACEHOLDER = 'Type a chat message, @ to mention...';

describe('ChatInput placeholder', () => {
  let container: HTMLDivElement;
  let root: Root;

  const render = (
    config?: IConfig,
    options: {
      factory?: IChatInputFactory;
      registry?: IChatCommandRegistry;
      edit?: boolean;
      onCancel?: () => void;
    } = {}
  ): MockChatModel => {
    const model = new MockChatModel({ config });
    act(() => {
      root.render(
        <ChatReactContext.Provider
          value={{
            model,
            rmRegistry: {} as IRenderMimeRegistry,
            chatInputFactory: options.factory,
            chatCommandRegistry: options.registry
          }}
        >
          <ChatInput
            model={model.input}
            edit={options.edit}
            onCancel={options.onCancel}
          />
        </ChatReactContext.Provider>
      );
    });
    return model;
  };

  const placeholder = (): string | null =>
    container.querySelector('[role="combobox"]')!.getAttribute('placeholder');

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('should use the default placeholder when none is configured', () => {
    render();
    expect(placeholder()).toBe(DEFAULT_PLACEHOLDER);
  });

  it('should use the configured placeholder', () => {
    render({ inputPlaceholder: 'Ask the assistant' });
    expect(placeholder()).toBe('Ask the assistant');
  });

  it('should use an empty configured placeholder as is', () => {
    render({ inputPlaceholder: '' });
    expect(placeholder()).toBe('');
  });

  it('should follow a later change of the configuration', () => {
    const model = render();

    act(() => {
      model.config = { inputPlaceholder: 'Ask the assistant' };
    });
    expect(placeholder()).toBe('Ask the assistant');

    // Unsetting it is the way back to the default, an empty string is not.
    act(() => {
      model.config = { inputPlaceholder: '' };
    });
    expect(placeholder()).toBe('');

    act(() => {
      model.config = { inputPlaceholder: undefined };
    });
    expect(placeholder()).toBe(DEFAULT_PLACEHOLDER);
  });

  it('should keep the default placeholder on an unrelated change', () => {
    const model = render();

    act(() => {
      model.config = { sendWithShiftEnter: true };
    });
    expect(placeholder()).toBe(DEFAULT_PLACEHOLDER);
  });

  it('keeps the stock editor and toolbar during message editing', () => {
    render(undefined, { edit: true });
    expect(container.querySelector('.jp-chat-input-textfield')).not.toBeNull();
    expect(container.querySelector('.jp-chat-input-toolbar')).not.toBeNull();
  });

  it('accepts a custom editor through the public ChatBody options', () => {
    const model = new MockChatModel();
    const factory: IChatInputFactory = {
      create: jest.fn(() => <div data-testid="custom-input" />)
    };
    act(() => {
      root.render(
        <ChatBody
          model={model}
          rmRegistry={{} as IRenderMimeRegistry}
          chatInputFactory={factory}
        />
      );
    });
    expect(
      container.querySelector('[data-testid="custom-input"]')
    ).not.toBeNull();
    expect(factory.create).toHaveBeenCalledWith(
      expect.objectContaining({ model: model.input })
    );
  });

  it('passes the editing model while retaining attachments and toolbar', () => {
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
    const onCancel = jest.fn();
    const model = render(undefined, { factory, edit: true, onCancel });
    const focusSpy = jest.spyOn(model.input, 'focus');
    act(() =>
      model.input.addAttachment?.({ type: 'file', value: 'notes.txt' })
    );

    expect(factory.create).toHaveBeenCalledWith(
      expect.objectContaining({ model: model.input, edit: true, onCancel })
    );
    expect(container.querySelector('.jp-chat-input-textfield')).toBeNull();
    expect(container.querySelector('.jp-chat-input-toolbar')).not.toBeNull();
    expect(container.textContent).toContain('notes.txt');
    act(() =>
      container
        .querySelector<HTMLElement>('[data-testid="custom-input"]')!
        .click()
    );
    expect(model.input.value).toBe('draft');
    expect(model.input.cursorIndex).toBe(3);
    expect(focusSpy).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('leaves command discovery to the custom editor', () => {
    const registry = new ChatCommandRegistry();
    const listCommandCompletions = jest.fn(async () => []);
    registry.addProvider({
      id: 'test',
      listCommandCompletions,
      onSubmit: async () => {}
    });
    const model = render(undefined, {
      factory: { create: () => <div /> },
      registry
    });
    act(() => {
      model.input.value = '/test';
      model.input.cursorIndex = 5;
    });
    expect(listCommandCompletions).not.toHaveBeenCalled();
  });
});
