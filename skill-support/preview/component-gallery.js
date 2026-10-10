const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

$$('.segment').forEach((button) => {
  button.addEventListener('click', () => {
    $$('.segment').forEach((item) => item.setAttribute('aria-pressed', 'false'));
    button.setAttribute('aria-pressed', 'true');
    document.body.dataset.surface = button.dataset.surface;
    $('.content').style.background = button.dataset.surface === 'white' ? 'var(--color-bg)' : 'var(--color-bg-subtle)';
  });
});


$$('[data-search-input]').forEach((input) => {
  const shell = input.closest('.search-shell');
  const clearButton = $('[data-search-clear]', shell);
  const syncClearButton = () => {
    clearButton.hidden = input.value.length === 0;
  };

  input.addEventListener('input', syncClearButton);
  clearButton.addEventListener('click', () => {
    input.value = '';
    syncClearButton();
    input.focus();
  });
  syncClearButton();
});

$$('.switch').forEach((control) => {
  control.addEventListener('click', () => {
    control.setAttribute('aria-checked', control.getAttribute('aria-checked') !== 'true');
  });
});

$$('[data-tabs]').forEach((tabsRoot) => {
  const tabs = $$('[role="tab"]:not(:disabled)', tabsRoot);
  const orientation = tabsRoot.dataset.orientation || 'horizontal';
  const activation = tabsRoot.dataset.activation || 'automatic';
  const activateTab = (nextTab, moveFocus = false) => {
    tabs.forEach((tab) => {
      const selected = tab === nextTab;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      const panelId = tab.getAttribute('aria-controls');
      if (panelId) $(`#${panelId}`, tabsRoot).hidden = !selected;
    });
    tabsRoot.dispatchEvent(new CustomEvent('tabs:change', { detail: { tab: nextTab } }));
    if (moveFocus) nextTab.focus();
  };

  const moveFocusTo = (nextTab) => {
    tabs.forEach((tab) => { tab.tabIndex = tab === nextTab ? 0 : -1; });
    nextTab.focus();
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', (event) => {
      let nextIndex = index;
      const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
      const previousKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
      if (event.key === nextKey) nextIndex = (index + 1) % tabs.length;
      else if (event.key === previousKey) nextIndex = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = tabs.length - 1;
      else if (activation === 'manual' && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        activateTab(tab, true);
        return;
      }
      else return;
      event.preventDefault();
      if (activation === 'manual') moveFocusTo(tabs[nextIndex]);
      else activateTab(tabs[nextIndex], true);
    });
  });
});

$$('.list-item').forEach((item) => {
  item.addEventListener('click', () => {
    $$('.list-item').forEach((row) => row.classList.remove('selected'));
    item.classList.add('selected');
  });
});


const resourceTableBody = $('#resource-table-body');
const resourceRows = () => $$('tr', resourceTableBody);
const setResourceRowSelected = (row, selected) => row.setAttribute('aria-selected', String(selected));

resourceRows().forEach((row) => {
  const toggle = () => setResourceRowSelected(row, row.getAttribute('aria-selected') !== 'true');
  row.addEventListener('click', toggle);
  row.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle();
    }
  });
});

$('#clear-row-selection').addEventListener('click', () => {
  resourceRows().forEach((row) => setResourceRowSelected(row, false));
  showToast('已清除表格选择');
});

$$('.sort-button').forEach((button) => {
  let ascending = true;
  button.addEventListener('click', () => {
    const key = button.dataset.sort;
    const rows = resourceRows().sort((a, b) => {
      if (key === 'size') return Number(a.dataset.size) - Number(b.dataset.size);
      return a.dataset.name.localeCompare(b.dataset.name, 'zh-CN');
    });
    if (!ascending) rows.reverse();
    rows.forEach((row) => resourceTableBody.append(row));
    $$('.sort-button').forEach((item) => {
      item.closest('th').removeAttribute('aria-sort');
      $('span', item).textContent = '↕';
    });
    button.closest('th').setAttribute('aria-sort', ascending ? 'ascending' : 'descending');
    $('span', button).textContent = ascending ? '↑' : '↓';
    ascending = !ascending;
  });
});

const paginationItems = $$('.pagination-item:not([aria-label])');
const updateCurrentPage = (button) => {
  paginationItems.forEach((item) => item.removeAttribute('aria-current'));
  button.setAttribute('aria-current', 'page');
  $('#table-summary').textContent = `共 32 个资源，当前第 ${button.textContent} 页`;
  showToast(`已切换到第 ${button.textContent} 页`);
};
paginationItems.forEach((button) => {
  button.addEventListener('click', () => updateCurrentPage(button));
});

const nextPage = $('.pagination-item[aria-label="下一页"]');
nextPage.addEventListener('click', () => {
  const currentIndex = paginationItems.findIndex((item) => item.getAttribute('aria-current') === 'page');
  updateCurrentPage(paginationItems[Math.min(currentIndex + 1, paginationItems.length - 1)]);
});

$('#empty-state-action').addEventListener('click', () => showToast('已开始新建资源'));

const closeDropdown = (dropdown, returnFocus = false) => {
  const trigger = $('.dropdown-trigger', dropdown);
  const menu = $('.dropdown-menu', dropdown);
  trigger.setAttribute('aria-expanded', 'false');
  menu.hidden = true;
  if (returnFocus) trigger.focus();
};

const closeOtherDropdowns = (current) => {
  $$('[data-dropdown]').forEach((dropdown) => {
    if (dropdown !== current) closeDropdown(dropdown);
  });
};

$$('[data-dropdown]').forEach((dropdown) => {
  const trigger = $('.dropdown-trigger', dropdown);
  const menu = $('.dropdown-menu', dropdown);
  const items = $$('.dropdown-menu-item', dropdown);

  const openDropdown = (focusFirst = false) => {
    closeOtherDropdowns(dropdown);
    trigger.setAttribute('aria-expanded', 'true');
    menu.hidden = false;
    if (focusFirst && items[0]) items[0].focus();
  };

  trigger.addEventListener('click', () => {
    if (trigger.getAttribute('aria-expanded') === 'true') closeDropdown(dropdown);
    else openDropdown();
  });

  items.forEach((item) => { item.tabIndex = -1; });

  trigger.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      openDropdown();
      (event.key === 'ArrowDown' ? items[0] : items[items.length - 1])?.focus();
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      openDropdown();
      (event.key === 'Home' ? items[0] : items[items.length - 1])?.focus();
    } else if ((event.key === 'Enter' || event.key === ' ') && trigger.getAttribute('aria-expanded') !== 'true') {
      event.preventDefault(); openDropdown(true);
    } else if (event.key === 'Escape' && trigger.getAttribute('aria-expanded') === 'true') {
      event.preventDefault(); closeDropdown(dropdown, true);
    }
  });

  items.forEach((item) => {
    item.addEventListener('click', () => {
      if (dropdown.dataset.mode === 'select') $('[data-dropdown-label]', dropdown).textContent = item.dataset.value;
      else showToast(`已选择：${item.dataset.value}`);
      closeDropdown(dropdown, true);
    });
    item.addEventListener('keydown', (event) => {
      const index = items.indexOf(item);
      let next = index;
      if (event.key === 'ArrowDown') next = (index + 1) % items.length;
      else if (event.key === 'ArrowUp') next = (index - 1 + items.length) % items.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = items.length - 1;
      else return;
      event.preventDefault(); items[next].focus();
    });
  });

  dropdown.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && trigger.getAttribute('aria-expanded') === 'true') {
      event.preventDefault();
      closeDropdown(dropdown, true);
    }
  });
});

$$('[data-split-action]').forEach((button) => {
  button.addEventListener('click', () => showToast(`已执行：${button.dataset.splitAction}`));
});

const closeSelect = (select, returnFocus = false) => {
  const trigger = $('.select-trigger', select);
  const listbox = $('.select-listbox', select);
  if (!trigger || !listbox) return;
  trigger.setAttribute('aria-expanded', 'false');
  trigger.removeAttribute('aria-activedescendant');
  listbox.hidden = true;
  $$('.select-option', select).forEach((option) => option.classList.remove('is-active'));
  if (returnFocus) trigger.focus();
};

$$('[data-select]').forEach((select, selectIndex) => {
  const trigger = $('.select-trigger', select);
  const listbox = $('.select-listbox', select);
  const options = $$('.select-option', select);
  let activeIndex = Math.max(0, options.findIndex((option) => option.getAttribute('aria-selected') === 'true'));

  options.forEach((option, optionIndex) => {
    if (!option.id) option.id = `select-${selectIndex}-option-${optionIndex}`;
    option.tabIndex = -1;
  });

  const setActive = (index) => {
    activeIndex = (index + options.length) % options.length;
    options.forEach((option, optionIndex) => option.classList.toggle('is-active', optionIndex === activeIndex));
    trigger.setAttribute('aria-activedescendant', options[activeIndex].id);
    options[activeIndex].scrollIntoView({ block: 'nearest' });
  };

  const openSelect = (initialIndex = activeIndex) => {
    $$('[data-select]').forEach((other) => { if (other !== select) closeSelect(other); });
    trigger.setAttribute('aria-expanded', 'true');
    listbox.hidden = false;
    setActive(initialIndex);
  };

  const commitOption = (option) => {
    $('[data-select-value]', select).textContent = option.dataset.value;
    options.forEach((item) => item.setAttribute('aria-selected', String(item === option)));
    activeIndex = options.indexOf(option);
    trigger.classList.remove('error');
    trigger.removeAttribute('aria-invalid');
    const errorText = $('.error-text', select.closest('.field-wrap'));
    if (errorText) {
      errorText.className = 'help';
      errorText.textContent = `已选择：${option.dataset.value}`;
    }
    closeSelect(select, true);
  };

  trigger.addEventListener('click', () => {
    if (trigger.getAttribute('aria-expanded') === 'true') closeSelect(select);
    else openSelect();
  });

  trigger.addEventListener('keydown', (event) => {
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) openSelect(event.key === 'ArrowDown' ? activeIndex : options.length - 1);
      else setActive(activeIndex + (event.key === 'ArrowDown' ? 1 : -1));
    } else if (event.key === 'Home' && isOpen) {
      event.preventDefault(); setActive(0);
    } else if (event.key === 'End' && isOpen) {
      event.preventDefault(); setActive(options.length - 1);
    } else if ((event.key === 'Enter' || event.key === ' ') && isOpen) {
      event.preventDefault(); commitOption(options[activeIndex]);
    } else if ((event.key === 'Enter' || event.key === ' ') && !isOpen) {
      event.preventDefault(); openSelect();
    } else if (event.key === 'Escape' && isOpen) {
      event.preventDefault(); closeSelect(select, true);
    }
  });

  options.forEach((option, index) => {
    option.addEventListener('mouseenter', () => setActive(index));
    option.addEventListener('click', () => commitOption(option));
  });
});

$$('[data-tooltip]').forEach((root) => {
  const tooltip = $('.tooltip', root);
  let tooltipTimer;
  const show = () => {
    clearTimeout(tooltipTimer);
    tooltipTimer = setTimeout(() => tooltip.classList.add('is-visible'), 300);
  };
  const hide = () => {
    clearTimeout(tooltipTimer);
    tooltip.classList.remove('is-visible');
  };
  root.addEventListener('mouseenter', show);
  root.addEventListener('mouseleave', hide);
  root.addEventListener('focusin', show);
  root.addEventListener('focusout', hide);
  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') hide();
  });
});

document.addEventListener('click', (event) => {
  $$('[data-dropdown]').forEach((dropdown) => {
    if (!dropdown.contains(event.target)) closeDropdown(dropdown);
  });
  $$('[data-select]').forEach((select) => {
    if (!select.contains(event.target)) closeSelect(select);
  });
});

$$('[data-accordion]').forEach((root) => {
  const triggers = $$('.accordion-trigger', root);
  triggers.forEach((trigger, index) => {
    trigger.addEventListener('click', () => {
      const willOpen = trigger.getAttribute('aria-expanded') !== 'true';
      $$('.accordion-trigger', root).forEach((item) => {
        const panel = $(`#${item.getAttribute('aria-controls')}`);
        const open = item === trigger && willOpen;
        item.setAttribute('aria-expanded', String(open));
        panel.hidden = !open;
      });
    });
    trigger.addEventListener('keydown', (event) => {
      let nextIndex = index;
      if (event.key === 'ArrowDown') nextIndex = (index + 1) % triggers.length;
      else if (event.key === 'ArrowUp') nextIndex = (index - 1 + triggers.length) % triggers.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = triggers.length - 1;
      else return;
      event.preventDefault(); triggers[nextIndex].focus();
    });
  });
});

$$('[data-collapsible]').forEach((root) => {
  const trigger = $('.collapsible-trigger', root);
  const content = $(`#${trigger.getAttribute('aria-controls')}`);
  trigger.addEventListener('click', () => {
    const open = trigger.getAttribute('aria-expanded') !== 'true';
    trigger.setAttribute('aria-expanded', String(open));
    content.hidden = !open;
  });
});

$$('.menubar').forEach((bar) => {
  const items = $$(':scope > [role="menuitem"]', bar);
  const menu = $('.menubar-popup', bar);
  const commands = $$('[role="menuitem"]', menu);
  const close = (returnFocus = false) => {
    menu.hidden = true;
    items.forEach((item) => item.setAttribute('aria-expanded', 'false'));
    if (returnFocus) items.find((item) => item.tabIndex === 0)?.focus();
  };
  const open = (button) => {
    items.forEach((item) => item.setAttribute('aria-expanded', String(item === button)));
    menu.hidden = false; commands[0]?.focus();
  };
  items.forEach((button, index) => {
    button.tabIndex = index === 0 ? 0 : -1;
    button.addEventListener('click', () => menu.hidden ? open(button) : close());
    button.addEventListener('keydown', (event) => {
      let nextIndex = index;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % items.length;
      else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + items.length) % items.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = items.length - 1;
      else if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(button); return; }
      else if (event.key === 'Escape') { event.preventDefault(); close(true); return; }
      else return;
      event.preventDefault();
      items.forEach((item, itemIndex) => { item.tabIndex = itemIndex === nextIndex ? 0 : -1; });
      items[nextIndex].focus();
    });
  });
  commands.forEach((command, index) => {
    command.addEventListener('click', () => { showToast(`已执行：${command.dataset.menuCommand}`); close(true); });
    command.addEventListener('keydown', (event) => {
      const next = { ArrowDown: (index + 1) % commands.length, ArrowUp: (index - 1 + commands.length) % commands.length, Home: 0, End: commands.length - 1 }[event.key];
      if (event.key === 'Escape') { event.preventDefault(); close(true); return; }
      if (next === undefined) return;
      event.preventDefault(); commands[next].focus();
    });
  });
  document.addEventListener('pointerdown', (event) => { if (!bar.contains(event.target)) close(); });
});

$$('.sidebar-sample').forEach((sidebar) => {
  const items = $$('.pattern-nav-item', sidebar);
  items.forEach((button) => button.addEventListener('click', () => {
    items.forEach((item) => {
      const selected = item === button;
      item.classList.toggle('selected', selected);
      if (selected) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });
  }));
});

$$('.item-card:not(:disabled)').forEach((button) => button.addEventListener('click', () => {
  const row = button.closest('.item-row');
  if (row) $$('.item-card', row).forEach((item) => item.classList.toggle('selected', item === button));
}));

$$('[data-popover]').forEach((root) => {
  const trigger = $('button[aria-controls]', root);
  const panel = $(`#${trigger.getAttribute('aria-controls')}`);
  const close = () => { trigger.setAttribute('aria-expanded', 'false'); panel.hidden = true; };
  trigger.addEventListener('click', () => {
    const open = trigger.getAttribute('aria-expanded') !== 'true';
    trigger.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
    if (open) $('input', panel).focus();
  });
  $('[data-close-popover]', panel).addEventListener('click', () => { close(); showToast('标签已保存'); trigger.focus(); });
  root.addEventListener('keydown', (event) => { if (event.key === 'Escape') { close(); trigger.focus(); } });
  document.addEventListener('click', (event) => { if (!root.contains(event.target)) close(); });
});

const contextMenu = $('.context-menu');
const contextTarget = $('[data-context-target]');
const closeContextMenu = (returnFocus = false) => { contextMenu.hidden = true; if (returnFocus) contextTarget.focus(); };
contextTarget.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  contextMenu.style.left = `${Math.min(event.clientX, window.innerWidth - 200)}px`;
  contextMenu.style.top = `${Math.min(event.clientY, window.innerHeight - 190)}px`;
  contextMenu.hidden = false;
  $('[role="menuitem"]', contextMenu).focus();
});
contextTarget.addEventListener('keydown', (event) => {
  if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
    event.preventDefault();
    const rect = contextTarget.getBoundingClientRect();
    contextMenu.style.left = `${rect.left + 24}px`; contextMenu.style.top = `${rect.top + 24}px`;
    contextMenu.hidden = false; $('[role="menuitem"]', contextMenu).focus();
  }
});
const contextMenuItems = $$('[role="menuitem"]', contextMenu);
contextMenuItems.forEach((item, index) => {
  item.addEventListener('click', () => { showToast(`已选择：${item.textContent}`); closeContextMenu(true); });
  item.addEventListener('keydown', (event) => {
    const next = { ArrowDown: (index + 1) % contextMenuItems.length, ArrowUp: (index - 1 + contextMenuItems.length) % contextMenuItems.length, Home: 0, End: contextMenuItems.length - 1 }[event.key];
    if (event.key === 'Escape') { event.preventDefault(); closeContextMenu(true); return; }
    if (next === undefined) return;
    event.preventDefault(); contextMenuItems[next].focus();
  });
});
document.addEventListener('pointerdown', (event) => { if (!contextMenu.hidden && !contextMenu.closest('[data-component="Context Menu"]').contains(event.target)) closeContextMenu(); });

let lastLayerTrigger = null;
const syncModalLock = () => {
  const hasModal = $$('.component-layer.open').some((layer) => $('[aria-modal="true"]', layer));
  document.body.classList.toggle('has-modal-layer', hasModal);
};
const closeLayer = (layer, restoreFocus = true) => {
  if (!layer) return;
  layer.classList.remove('open');
  layer.setAttribute('aria-hidden', 'true');
  syncModalLock();
  if (restoreFocus && lastLayerTrigger) lastLayerTrigger.focus();
};
const openLayer = (layer, trigger) => {
  lastLayerTrigger = trigger;
  layer.classList.add('open');
  layer.setAttribute('aria-hidden', 'false');
  syncModalLock();
  const focusTarget = $('input, [data-close-layer], button', layer);
  if (focusTarget) focusTarget.focus();
};
$$('[data-open-layer]').forEach((trigger) => trigger.addEventListener('click', () => {
  const layer = $(`#${trigger.dataset.openLayer}`);
  openLayer(layer, trigger);
}));
$$('[data-open-semi-modal]').forEach((trigger) => trigger.addEventListener('click', () => {
  const layer = $('#semi-modal-layer');
  const panel = $('[data-semi-modal-panel]', layer);
  const contentContext = $('[data-semi-modal-content-context]', panel);
  const isModal = trigger.dataset.modalMode === 'modal';
  panel.classList.remove('modal-size-s', 'modal-size-m', 'modal-size-l', 'modal-surface-white', 'modal-surface-gray');
  panel.classList.add(`modal-size-${trigger.dataset.modalSize}`, `modal-surface-${trigger.dataset.modalSurface}`);
  contentContext.classList.toggle('on-white', trigger.dataset.modalSurface === 'white');
  contentContext.classList.toggle('on-gray', trigger.dataset.modalSurface === 'gray');
  panel.setAttribute('aria-modal', String(isModal));
  layer.classList.toggle('modal-variant', isModal);
  $('[data-semi-modal-description]', panel).textContent = isModal
    ? '模态模式使用遮罩并约束焦点，背景内容暂不可操作。'
    : '非模态模式为默认状态，可以继续操作背景内容。';
  $('[data-semi-modal-surface-rule]', panel).textContent = trigger.dataset.modalSurface === 'gray'
    ? 'Gray Surface：输入与搜索等组件使用白色 Surface。'
    : 'White Surface：输入与搜索等组件使用灰色 Surface。';
  openLayer(layer, trigger);
}));
$$('[data-close-layer]').forEach((button) => button.addEventListener('click', () => closeLayer(button.closest('.component-layer'))));
$$('[data-confirm-layer]').forEach((button) => button.addEventListener('click', () => {
  const message = button.dataset.confirmLayer;
  closeLayer(button.closest('.component-layer'));
  showToast(message);
}));
$$('.component-layer').forEach((layer) => layer.addEventListener('click', (event) => {
  if (event.target === layer && layer.dataset.dismissOutside === 'true') closeLayer(layer);
}));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeContextMenu();
    const openLayers = $$('.component-layer.open');
    const topLayer = openLayers[openLayers.length - 1];
    if (topLayer) closeLayer(topLayer);
  }
  if (event.key === 'Tab') {
    const openModalLayers = $$('.component-layer.open').filter((layer) => $('[aria-modal="true"]', layer));
    const topModalLayer = openModalLayers[openModalLayers.length - 1];
    if (!topModalLayer) return;
    const focusable = $$('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])', topModalLayer).filter((element) => !element.hidden);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});


const zoomSlider = $('#zoom-slider');
zoomSlider.addEventListener('input', () => { $('#zoom-output').value = `${zoomSlider.value}%`; });

$$('.toggle-btn').forEach((button) => button.addEventListener('click', () => button.setAttribute('aria-pressed', button.getAttribute('aria-pressed') !== 'true')));

$$('[data-combobox]').forEach((root) => {
  const trigger = $('.combobox-trigger', root);
  const panel = $('.combobox-panel', root);
  const search = $('[data-combobox-search]', root);
  const value = $('[data-combobox-value]', root);
  const options = $$('[role="option"]', root);
  trigger.setAttribute('aria-label', value.textContent);
  options.forEach((option) => { option.tabIndex = -1; });
  const close = () => { trigger.setAttribute('aria-expanded', 'false'); panel.hidden = true; search.value = ''; options.forEach((option) => { option.hidden = false; }); };
  trigger.addEventListener('click', () => {
    const open = trigger.getAttribute('aria-expanded') !== 'true';
    trigger.setAttribute('aria-expanded', String(open)); panel.hidden = !open;
    if (open) search.focus();
  });
  search.addEventListener('input', () => options.forEach((option) => { option.hidden = !option.textContent.includes(search.value); }));
  options.forEach((option) => option.addEventListener('click', () => {
    value.textContent = option.dataset.value;
    trigger.setAttribute('aria-label', option.dataset.value);
    options.forEach((item) => item.setAttribute('aria-selected', String(item === option)));
    close();
    trigger.focus();
  }));
  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { close(); trigger.focus(); }
    else if (event.key === 'ArrowDown' && !panel.hidden) { event.preventDefault(); const visible = options.filter((item) => !item.hidden); const index = visible.indexOf(document.activeElement); (visible[index + 1] || visible[0])?.focus(); }
    else if (event.key === 'ArrowUp' && !panel.hidden) { event.preventDefault(); const visible = options.filter((item) => !item.hidden); const index = visible.indexOf(document.activeElement); (visible[index - 1] || visible[visible.length - 1])?.focus(); }
    else if (event.key === 'Enter' && document.activeElement?.getAttribute('role') === 'option') document.activeElement.click();
  });
  document.addEventListener('pointerdown', (event) => { if (!panel.hidden && !root.contains(event.target)) close(); });
});

const otpInputs = $$('.otp input');
otpInputs.forEach((input, index) => {
  input.addEventListener('input', () => { input.value = input.value.replace(/\D/g, '').slice(0, 1); if (input.value && otpInputs[index + 1]) otpInputs[index + 1].focus(); });
  input.addEventListener('keydown', (event) => { if (event.key === 'Backspace' && !input.value && otpInputs[index - 1]) otpInputs[index - 1].focus(); });
});

$$('[data-calendar]').forEach((calendar) => {
  const days = $$('.days button', calendar);
  days.forEach((button, index) => {
    button.addEventListener('click', () => days.forEach((item) => { item.classList.toggle('selected', item === button); item.setAttribute('aria-pressed', String(item === button)); }));
    button.addEventListener('keydown', (event) => {
      const delta = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 }[event.key];
      if (!delta) return;
      event.preventDefault(); days[Math.max(0, Math.min(days.length - 1, index + delta))].focus();
    });
  });
  $$('.calendar-head button', calendar).forEach((button) => button.addEventListener('click', () => showToast(button.getAttribute('aria-label'))));
});

$$('[data-date-picker]').forEach((root) => {
  const trigger = $('.date-picker-trigger', root);
  const panel = $('.date-picker-panel', root);
  const monthLabel = $('[data-date-month]', root);
  const dayGrid = $('[data-date-days]', root);
  const valueLabel = $('[data-date-value]', root);
  const input = $('[data-date-input]', root);
  const pad = (value) => String(value).padStart(2, '0');
  const toIso = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const toLabel = (date) => `${date.getFullYear()}年${pad(date.getMonth() + 1)}月${pad(date.getDate())}日`;
  const sameDay = (left, right) => left && right && toIso(left) === toIso(right);
  const fromIso = (value) => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  };
  let selectedDate = input.value ? fromIso(input.value) : null;
  let viewDate = selectedDate ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1) : new Date();

  const render = (focusIso) => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    monthLabel.textContent = `${year}年${pad(month + 1)}月`;
    dayGrid.replaceChildren();
    const gridStart = new Date(year, month, 1 - new Date(year, month, 1).getDay());
    const today = new Date();
    for (let index = 0; index < 42; index += 1) {
      const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
      const iso = toIso(date);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'date-picker-day';
      button.textContent = String(date.getDate());
      button.dataset.date = iso;
      button.setAttribute('role', 'gridcell');
      button.setAttribute('aria-label', toLabel(date));
      button.setAttribute('aria-selected', String(sameDay(date, selectedDate)));
      if (date.getMonth() !== month) button.classList.add('outside');
      if (sameDay(date, today)) { button.classList.add('today'); button.setAttribute('aria-current', 'date'); }
      if (sameDay(date, selectedDate)) button.classList.add('selected');
      button.addEventListener('click', () => {
        selectedDate = date;
        viewDate = new Date(date.getFullYear(), date.getMonth(), 1);
        input.value = iso;
        valueLabel.textContent = toLabel(date);
        close(true);
      });
      dayGrid.append(button);
    }
    if (focusIso) $(`[data-date="${focusIso}"]`, dayGrid)?.focus();
  };
  const open = () => {
    trigger.setAttribute('aria-expanded', 'true');
    panel.hidden = false;
    render();
    requestAnimationFrame(() => ($('.selected', dayGrid) || $('.today', dayGrid) || $('.date-picker-day', dayGrid))?.focus());
  };
  const close = (restoreFocus = false) => {
    trigger.setAttribute('aria-expanded', 'false');
    panel.hidden = true;
    if (restoreFocus) trigger.focus();
  };

  trigger.addEventListener('click', () => panel.hidden ? open() : close());
  $('[data-date-previous]', root).addEventListener('click', () => { viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1); render(); });
  $('[data-date-next]', root).addEventListener('click', () => { viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1); render(); });
  $('[data-date-today]', root).addEventListener('click', () => {
    const today = new Date();
    selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
    input.value = toIso(selectedDate);
    valueLabel.textContent = toLabel(selectedDate);
    close(true);
  });
  $('[data-date-clear]', root).addEventListener('click', () => {
    selectedDate = null;
    input.value = '';
    valueLabel.textContent = '选择日期';
    close(true);
  });
  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); close(true); return; }
    const delta = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 }[event.key];
    if (!delta || !document.activeElement?.classList.contains('date-picker-day')) return;
    event.preventDefault();
    const nextDate = fromIso(document.activeElement.dataset.date);
    nextDate.setDate(nextDate.getDate() + delta);
    const nextIso = toIso(nextDate);
    if (nextDate.getMonth() !== viewDate.getMonth()) viewDate = new Date(nextDate.getFullYear(), nextDate.getMonth(), 1);
    render(nextIso);
  });
  document.addEventListener('pointerdown', (event) => { if (!panel.hidden && !root.contains(event.target)) close(); });
  render();
});

$$('[data-time-picker]').forEach((root) => {
  const trigger = $('.time-picker-trigger', root);
  const panel = $('.time-picker-panel', root);
  const valueLabel = $('[data-time-value]', root);
  const input = $('[data-time-input]', root);
  const hourList = $('[data-time-hours]', root);
  const minuteList = $('[data-time-minutes]', root);
  const pad = (value) => String(value).padStart(2, '0');
  const parse = (value) => {
    const [hour = 0, minute = 0] = value.split(':').map(Number);
    return { hour, minute };
  };
  let committed = parse(input.value);
  let draft = { ...committed };

  const makeOptions = (list, values, unit) => values.forEach((value) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'time-picker-option';
    option.textContent = pad(value);
    option.dataset.timeUnit = unit;
    option.dataset.timeOption = String(value);
    option.setAttribute('role', 'option');
    option.addEventListener('click', () => { draft[unit] = value; syncOptions(); });
    list.append(option);
  });
  makeOptions(hourList, Array.from({ length: 24 }, (_, index) => index), 'hour');
  makeOptions(minuteList, Array.from({ length: 12 }, (_, index) => index * 5), 'minute');

  const syncOptions = () => {
    $$('.time-picker-option', root).forEach((option) => {
      const selected = Number(option.dataset.timeOption) === draft[option.dataset.timeUnit];
      option.classList.toggle('selected', selected);
      option.setAttribute('aria-selected', String(selected));
    });
  };
  const close = (restoreFocus = false) => {
    trigger.setAttribute('aria-expanded', 'false');
    panel.hidden = true;
    if (restoreFocus) trigger.focus();
  };
  const open = () => {
    draft = input.value ? parse(input.value) : { hour: 0, minute: 0 };
    syncOptions();
    trigger.setAttribute('aria-expanded', 'true');
    panel.hidden = false;
    requestAnimationFrame(() => {
      const selectedHour = $('.time-picker-option.selected', hourList);
      const selectedMinute = $('.time-picker-option.selected', minuteList);
      selectedHour?.scrollIntoView({ block: 'center' });
      selectedMinute?.scrollIntoView({ block: 'center' });
      selectedHour?.focus();
    });
  };
  const commit = (value) => {
    committed = { ...value };
    input.value = `${pad(committed.hour)}:${pad(committed.minute)}`;
    valueLabel.textContent = input.value;
    close(true);
  };

  trigger.addEventListener('click', () => panel.hidden ? open() : close());
  $('[data-time-confirm]', root).addEventListener('click', () => commit(draft));
  $('[data-time-clear]', root).addEventListener('click', () => {
    input.value = '';
    valueLabel.textContent = '选择时间';
    close(true);
  });
  $('[data-time-now]', root).addEventListener('click', () => {
    const now = new Date();
    const roundedMinute = Math.round(now.getMinutes() / 5) * 5;
    commit({ hour: (now.getHours() + (roundedMinute === 60 ? 1 : 0)) % 24, minute: roundedMinute % 60 });
  });
  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); close(true); return; }
    const option = document.activeElement;
    if (!option?.classList.contains('time-picker-option')) return;
    const list = option.closest('.time-picker-list');
    const options = $$('.time-picker-option', list);
    const index = options.indexOf(option);
    const nextIndex = event.key === 'ArrowDown' ? Math.min(options.length - 1, index + 1) : event.key === 'ArrowUp' ? Math.max(0, index - 1) : event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : null;
    if (nextIndex === null) return;
    event.preventDefault();
    options[nextIndex].focus();
    options[nextIndex].click();
  });
  document.addEventListener('pointerdown', (event) => { if (!panel.hidden && !root.contains(event.target)) close(); });
  syncOptions();
});

$$('[data-carousel]').forEach((root) => {
  const slides = $$('.carousel-slide', root);
  let index = 0;
  const show = (next) => { index = (next + slides.length) % slides.length; slides.forEach((slide, slideIndex) => slide.classList.toggle('active', slideIndex === index)); };
  const previous = $('button[aria-label="上一张"]', root);
  const next = $('button[aria-label="下一张"]', root);
  previous.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));
});

$$('.attachment input').forEach((input) => input.addEventListener('change', () => {
  const label = $('[data-file-label]', input.closest('.attachment'));
  label.textContent = input.files.length ? `已选择 ${input.files.length} 个文件` : '支持图片、PDF 和压缩包';
}));

$$('[data-alert-action]').forEach((button) => button.addEventListener('click', () => showToast(button.dataset.alertAction)));
$$('[data-dismiss-alert]').forEach((button) => button.addEventListener('click', () => button.closest('.alert')?.remove()));

let toastTimer;
function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}
$('#show-toast').addEventListener('click', () => showToast('设置已保存'));

const sections = $$('.section');
const navLinks = $$('.nav-link');
navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.forEach((item) => item.classList.toggle('active', item === link));
  });
});
const syncActiveNav = () => {
  const marker = 96;
  let current = sections[0];
  sections.forEach((section) => { if (section.getBoundingClientRect().top <= marker) current = section; });
  navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${current.id}`));
};
window.addEventListener('scroll', syncActiveNav, { passive: true });
syncActiveNav();
