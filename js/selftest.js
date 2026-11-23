/* Автотесты Must Have. Запускаются только по ?selftest=1 в отдельном хранилище. */
(function () {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const visualMode = params.get('visual');

  const q = (selector) => document.querySelector(selector);
  const qa = (selector) => Array.from(document.querySelectorAll(selector));
  const tick = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms || 20));
  const norm = (value) => String(value || '').replace(/\s+/g, ' ').trim();

  function setValue(selector, value) {
    const el = q(selector);
    el.focus();
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return el;
  }

  function itemByName(selector, name) {
    return qa(selector).find((item) => norm(item.querySelector('.item-title')?.textContent) === name);
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  async function waitFor(condition, message, timeout) {
    const limit = timeout || 1500;
    const started = Date.now();
    while (Date.now() - started < limit) {
      if (condition()) return;
      await tick(25);
    }
    throw new Error(message || 'Условие не выполнилось за ' + limit + ' мс');
  }

  async function run() {
    const app = window.__mustHaveTest;
    if (!app) throw new Error('Не найден тестовый API приложения');

    if (visualMode) {
      document.body.classList.add('visual-qa');
      document.body.classList.add('no-bg-transition');
      document.body.classList.add('no-transitions');
      if (visualMode === 'settings' || visualMode === 'archive' || visualMode === 'wish' || visualMode === 'step') {
        document.body.classList.add('no-animations');
      }
      qa('dialog[open]').forEach((dialog) => dialog.close());
      app.reset();
      if (visualMode !== 'empty') {
        app.seedDemo();
      }
      const wantedBg = params.get('bg');
      const wantedTheme = params.get('theme');
      if (wantedBg || wantedTheme) {
        q('#settingsBtn').click();
        await tick(120);
        if (wantedTheme) {
          const themeButton = q('[data-theme-id="' + wantedTheme + '"]');
          if (themeButton) themeButton.click();
        }
        if (wantedBg) {
          const bgButton = q('[data-bg-id="' + wantedBg + '"]');
          if (bgButton) bgButton.click();
        }
        q('#applyVisualBtn').click();
        await tick(250);
      }
      if (visualMode === 'wish') {
        q('#addWishBtn').click();
        await tick(250);
      }
      if (visualMode === 'step') {
        q('#addStepBtn').click();
        await tick(250);
      }
      if (visualMode === 'settings') {
        q('#settingsBtn').click();
        await tick(250);
      }
      if (visualMode === 'archive') {
        q('#settingsBtn').click();
        await tick(100);
        q('#tabArchive').click();
        await tick(250);
      }
      if (visualMode === 'wallpaper') {
        qa('[data-close]').forEach((button) => button.click());
        await tick(3600);
      }
      await tick(250);
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      const input = q('#haveInput');
      const wrap = input.closest('.money-input-wrap');
      document.documentElement.dataset.qa = JSON.stringify({
        innerWidth: window.innerWidth,
        clientWidth: document.documentElement.clientWidth,
        bodyScrollWidth: document.body.scrollWidth,
        cardRect: q('.card-a').getBoundingClientRect().toJSON(),
        inputValue: input.value,
        inputInlineWidth: input.style.width,
        inputRect: input.getBoundingClientRect().toJSON(),
        wrapRect: wrap.getBoundingClientRect().toJSON(),
        currencyRect: wrap.querySelector('.money-currency').getBoundingClientRect().toJSON(),
        theme: document.body.dataset.theme,
        ink: getComputedStyle(document.body).getPropertyValue('--ink').trim(),
        brandColor: getComputedStyle(q('.brand')).color,
        zoomColor: getComputedStyle(q('.zoom-btn')).color,
        cardTitleColor: getComputedStyle(q('.card-title')).color
      });
      document.documentElement.dataset.visualReady = '1';
      return;
    }

    qa('dialog[open]').forEach((dialog) => dialog.close());
    app.reset();
    await tick(40);

    const results = [];

    async function test(name, fn) {
      try {
        await fn();
        results.push({ name, ok: true });
      } catch (error) {
        results.push({ name, ok: false, error: String(error && error.message ? error.message : error) });
      }
    }

    await test('Старт: пустые блоки и нулевые суммы', async () => {
      assert(q('#haveInput').value === '0', 'А1 должна начинаться с нуля');
      assert(norm(q('#needValue').textContent) === '0', 'А2 должна начинаться с нуля');
      assert(app.getTotals().have === 0, 'Итог «есть» не ноль');
      assert(app.getTotals().need === 0, 'Итог «нужно» не ноль');
      assert(qa('#wishList .wish-item').length === 0, 'Список желаний не пуст');
      assert(qa('#stepList .step-item').length === 0, 'Список шагов не пуст');
      assert(!q('#wishEmpty').hidden, 'Пустое состояние желаний не показано');
      assert(!q('#stepEmpty').hidden, 'Пустое состояние шагов не показано');
    });

    await test('Буква и точка перед названием каждого блока', async () => {
      assert(norm(q('#titleA').textContent) === 'А. Итого', 'Заголовок А');
      assert(norm(q('#titleB').textContent) === 'Б. Что мне надо', 'Заголовок Б');
      assert(norm(q('#titleC').textContent) === 'В. Что делаем', 'Заголовок В');
    });

    await test('Блок Б: создание желания попадает в А2', async () => {
      q('#addWishBtn').click();
      assert(q('#wishDialog').open, 'Модалка желания не открылась');
      setValue('#wishName', 'Ноутбук для работы');
      setValue('#wishDesc', 'Чтобы брать заказы в любом месте.');
      setValue('#wishPrice', '78000');
      q('#wishForm').requestSubmit();
      await tick(40);
      assert(!q('#wishDialog').open, 'Модалка не закрылась');
      assert(app.getState().wishes.length === 1, 'Желание не добавилось');
      assert(app.getTotals().need === 78000, 'Сумма А2 неверна: ' + app.getTotals().need);
      assert(norm(q('#needValue').textContent) === '78 000', 'Текст А2 неверен: ' + q('#needValue').textContent);
      assert(qa('#wishList .wish-item').length === 1, 'Пункт не появился в списке');
    });

    await test('Блок Б: новое желание встаёт сверху, суммы складываются', async () => {
      q('#addWishBtn').click();
      setValue('#wishName', 'Курс по вёрстке');
      setValue('#wishPrice', '3000');
      q('#wishForm').requestSubmit();
      await tick(40);
      assert(app.getState().wishes.length === 2, 'Второе желание не добавилось');
      assert(norm(q('#wishList .wish-item .item-title').textContent) === 'Курс по вёрстке', 'Новое желание не сверху');
      assert(app.getTotals().need === 81000, 'Сумма желаний не сложилась');
      assert(norm(q('#needValue').textContent) === '81 000', 'А2 не обновилась');
    });

    await test('Блок Б: редактирование меняет сумму', async () => {
      itemByName('.wish-item', 'Ноутбук для работы').querySelector('[data-action="edit-wish"]').click();
      await tick(20);
      assert(q('#wishDialog').open, 'Модалка редактирования не открылась');
      assert(q('#wishName').value === 'Ноутбук для работы', 'Поля не заполнились');
      setValue('#wishPrice', '80000');
      q('#wishForm').requestSubmit();
      await tick(40);
      assert(app.getTotals().need === 83000, 'Сумма после редактирования неверна');
    });

    await test('Блок Б: пустая форма не сохраняется', async () => {
      q('#addWishBtn').click();
      q('#wishForm').requestSubmit();
      await tick(20);
      assert(q('#wishDialog').open, 'Модалка закрылась при ошибке');
      assert(q('#wishNameError').textContent.length > 0, 'Нет ошибки названия');
      assert(q('#wishPriceError').textContent.length > 0, 'Нет ошибки суммы');
      assert(app.getState().wishes.length === 2, 'Пустое желание добавилось');
      q('#wishDialog [data-close-dialog]').click();
    });

    await test('Блок Б: лимиты названия и описания работают', async () => {
      q('#addWishBtn').click();
      setValue('#wishName', 'Я'.repeat(90));
      setValue('#wishDesc', 'Д'.repeat(3200));
      assert(q('#wishName').value.length === 54, 'Название не ограничено 54 символами');
      assert(q('#wishDesc').value.length === 3000, 'Описание не ограничено 3000 символами');
      q('#wishDialog [data-close-dialog]').click();
    });

    await test('Блок В: шаг создаётся вместе со временем', async () => {
      q('#addStepBtn').click();
      assert(q('#stepDialog').open, 'Модалка шага не открылась');
      setValue('#stepName', 'Сдать лендинг');
      setValue('#stepDesc', 'Первый платёж от постоянного клиента.');
      setValue('#stepAmount', '18000');
      setValue('#stepTime', '2 дня');
      q('#stepForm').requestSubmit();
      await tick(40);
      assert(app.getState().steps.length === 1, 'Шаг не добавился');
      assert(app.getState().steps[0].time === '2 дня', 'Время шага не сохранилось');
      assert(norm(itemByName('.step-item', 'Сдать лендинг').querySelector('.item-time').textContent) === '2 дня', 'Время не показано в списке');
      assert(norm(q('#cSub').textContent).indexOf('18 000') >= 0, 'Подзаголовок блока В неверен');
    });

    await test('Блок В: чекбокс добавляет сумму в А1 и снимает', async () => {
      itemByName('.step-item', 'Сдать лендинг').querySelector('.check').click();
      await tick(40);
      assert(app.getTotals().checked === 18000, 'Выполненный шаг не учтён');
      assert(app.getTotals().have === 18000, 'Сумма А1 не увеличилась');
      assert(q('#haveInput').value.replace(/\D/g, '') === '18000', 'Поле А1 не показывает сумму шага');
      assert(itemByName('.step-item', 'Сдать лендинг').classList.contains('is-done'), 'Шаг не стал тусклым');
      itemByName('.step-item', 'Сдать лендинг').querySelector('.check').click();
      await tick(40);
      assert(app.getTotals().have === 0, 'Сумма А1 не уменьшилась');
      itemByName('.step-item', 'Сдать лендинг').querySelector('.check').click();
      await tick(40);
    });

    await test('Блок В: редактирование выполненного шага обновляет А1', async () => {
      itemByName('.step-item', 'Сдать лендинг').querySelector('[data-action="edit-step"]').click();
      await tick(20);
      setValue('#stepAmount', '20000');
      q('#stepForm').requestSubmit();
      await tick(40);
      assert(app.getTotals().checked === 20000, 'Сумма выполненного шага не обновилась');
      assert(q('#haveInput').value.replace(/\D/g, '') === '20000', 'А1 не обновилась после редактирования шага');
    });

    await test('Блок А: ручная сумма складывается с шагами', async () => {
      setValue('#haveInput', '50000');
      await tick(40);
      assert(app.getTotals().have === 50000, 'Итог А1 неверен: ' + app.getTotals().have);
      assert(app.getState().manualAmount === 30000, 'Ручная часть А1 неверна');
      itemByName('.step-item', 'Сдать лендинг').querySelector('.check').click();
      await tick(40);
      assert(app.getTotals().have === 30000, 'Снятие шага не вычло сумму');
      itemByName('.step-item', 'Сдать лендинг').querySelector('.check').click();
      await tick(40);
    });

    await test('Блок А: больше 6 цифр не вводится', async () => {
      setValue('#haveInput', '1234567');
      await tick(30);
      assert(q('#haveInput').value.replace(/\D/g, '').length <= 6, 'В А1 больше 6 цифр');
      assert(app.getTotals().have === 123456, 'Сумма А1 посчитана неверно');
      setValue('#haveInput', '50000');
      await tick(20);
    });

    await test('Блок Б: отмена удаления не трогает данные', async () => {
      itemByName('.wish-item', 'Курс по вёрстке').querySelector('[data-action="delete-wish"]').click();
      await waitFor(() => q('#confirmDialog').open, 'Окно удаления не открылось');
      assert(norm(q('#confirmTitle').textContent) === 'Удалить желание?', 'Неверный заголовок удаления');
      q('#confirmNo').click();
      await tick(50);
      assert(app.getState().wishes.length === 2, 'Желание удалилось при отмене');
    });

    await test('Блок Б: удаление вычитает цену из А2', async () => {
      itemByName('.wish-item', 'Курс по вёрстке').querySelector('[data-action="delete-wish"]').click();
      await waitFor(() => q('#confirmDialog').open, 'Окно удаления не открылось');
      q('#confirmYes').click();
      await waitFor(() => app.getState().wishes.length === 1, 'Желание не удалилось');
      assert(app.getTotals().need === 80000, 'А2 не вычла цену удалённого желания');
    });

    await test('Свернуть и развернуть блок', async () => {
      q('[data-collapse="b"]').click();
      await tick(20);
      assert(q('.card-b').classList.contains('is-collapsed'), 'Блок Б не свернулся');
      assert(q('[data-collapse="b"]').getAttribute('aria-expanded') === 'false', 'aria-expanded неверен');
      q('[data-collapse="b"]').click();
      await tick(20);
      assert(!q('.card-b').classList.contains('is-collapsed'), 'Блок Б не развернулся');
    });

    await test('Закрыть и вернуть блок с панели', async () => {
      q('[data-close="c"]').click();
      await tick(20);
      assert(q('.card-c').classList.contains('is-closed'), 'Блок В не закрылся');
      assert(q('[data-open-block="c"]').getAttribute('aria-pressed') === 'false', 'Иконка В осталась активной');
      q('[data-open-block="c"]').click();
      await tick(20);
      assert(!q('.card-c').classList.contains('is-closed'), 'Блок В не вернулся');
    });

    await test('Настройки: 7 тем и 7 карточек фона', async () => {
      q('#settingsBtn').click();
      await waitFor(() => q('#settingsDialog').open, 'Настройки не открылись');
      assert(qa('[data-theme-id]').length === 7, 'Тем не 7');
      assert(qa('[data-bg-id]').length === 6, 'Встроенных фонов не 6');
      assert(Boolean(q('#customBgCard')), 'Нет карточки своего фона');
    });

    await test('Настройки: тема применяется и сохраняется', async () => {
      q('[data-theme-id="night"]').click();
      q('#applyVisualBtn').click();
      await tick(80);
      assert(!q('#settingsDialog').open, 'Настройки не закрылись после Применить');
      assert(document.body.dataset.theme === 'night', 'Тема не применилась');
      const saved = JSON.parse(localStorage.getItem(app.storageKey));
      assert(saved.visual.theme === 'night', 'Тема не сохранилась в localStorage');
      q('#settingsBtn').click();
      await waitFor(() => q('#settingsDialog').open, 'Настройки не открылись повторно');
      q('[data-theme-id="paper"]').click();
      q('#applyVisualBtn').click();
      await tick(50);
      assert(document.body.dataset.theme === 'paper', 'Тема не вернулась');
    });

    await test('Настройки: закрытие без Применить не меняет тему', async () => {
      q('#settingsBtn').click();
      await waitFor(() => q('#settingsDialog').open, 'Настройки не открылись');
      q('[data-theme-id="sage"]').click();
      q('#settingsDialog [data-close-settings]').click();
      await tick(40);
      assert(document.body.dataset.theme === 'paper', 'Тема применилась без Применить');
    });

    await test('Масштаб: текст крупнее, ширина блока не меняется', async () => {
      const label = q('.money-label');
      const card = q('.card-a');
      const beforeFont = parseFloat(getComputedStyle(label).fontSize);
      const beforeWidth = card.getBoundingClientRect().width;
      q('#zoomIn').click();
      await tick(80);
      const afterFont = parseFloat(getComputedStyle(label).fontSize);
      const afterWidth = card.getBoundingClientRect().width;
      assert(afterFont > beforeFont, 'Текст не увеличился: ' + beforeFont + ' → ' + afterFont);
      assert(Math.abs(afterWidth - beforeWidth) < 1, 'Ширина блока изменилась: ' + beforeWidth + ' → ' + afterWidth);
      q('#zoomOut').click();
      await tick(50);
    });

    await test('Фон применяется и сохраняется', async () => {
      q('#settingsBtn').click();
      await waitFor(() => q('#settingsDialog').open, 'Настройки не открылись');
      q('[data-bg-id="rain"]').click();
      q('#applyVisualBtn').click();
      await tick(80);
      const saved = JSON.parse(localStorage.getItem(app.storageKey));
      assert(saved.visual.background === 'rain', 'Фон не сохранился: ' + saved.visual.background);
      await waitFor(() => {
        const active = q('.wallpaper-layer.is-active .scene-base');
        return active && active.src.indexOf('rain-base.webp') >= 0;
      }, 'Активный фоновый слой не переключился');
      q('#settingsBtn').click();
      await waitFor(() => q('#settingsDialog').open, 'Настройки не открылись');
      q('[data-bg-id="bamboo"]').click();
      q('#applyVisualBtn').click();
      await tick(60);
    });

    await test('Свой фон: загрузка, применение и сохранение', async () => {
      q('#settingsBtn').click();
      await waitFor(() => q('#settingsDialog').open, 'Настройки не открылись');
      const canvas = document.createElement('canvas');
      canvas.width = 96;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#c9d6bd';
      ctx.fillRect(0, 0, 96, 64);
      ctx.fillStyle = '#7b946c';
      ctx.beginPath();
      ctx.arc(60, 30, 18, 0, Math.PI * 2);
      ctx.fill();
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], 'custom-bg.png', { type: 'image/png' });
      const transfer = new DataTransfer();
      transfer.items.add(file);
      const input = q('#customBgInput');
      input.files = transfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      await waitFor(() => q('#customBgCard') && q('#customBgCard').classList.contains('is-selected'), 'Свой фон не выбрался', 4000);
      q('#applyVisualBtn').click();
      await tick(100);
      const saved = JSON.parse(localStorage.getItem(app.storageKey));
      assert(saved.visual.background === 'custom', 'Свой фон не сохранился');
      assert(String(saved.visual.customBackground).indexOf('data:image/jpeg;base64,') === 0, 'Свой фон не сжат в изображение');
      q('#settingsBtn').click();
      await waitFor(() => q('#settingsDialog').open, 'Настройки не открылись');
      q('[data-bg-id="bamboo"]').click();
      q('#applyVisualBtn').click();
      await tick(60);
    });

    await test('Режим тестировщика: неверный пароль не открывает окно', async () => {
      q('#testBtn').click();
      await waitFor(() => q('#pinDialog').open, 'Окно пароля не открылось');
      setValue('#pinInput', '0000');
      q('#pinForm').requestSubmit();
      await tick(30);
      assert(q('#pinError').textContent.length > 0, 'Нет ошибки пароля');
      assert(q('#pinDialog').open, 'Окно пароля закрылось при ошибке');
    });

    await test('Режим тестировщика: пароль 0211 открывает изолированную копию', async () => {
      const originalOpen = window.open;
      let opened = null;
      window.open = (url, name, features) => {
        opened = { url: String(url), name, features };
        return { closed: false, focus() {} };
      };
      try {
        setValue('#pinInput', '0211');
        q('#pinForm').requestSubmit();
        await tick(50);
        assert(Boolean(opened), 'window.open не вызван');
        assert(opened.url.indexOf('mode=test') >= 0, 'В URL нет mode=test');
        assert(opened.url.indexOf('run=') >= 0, 'В URL нет изолированного run');
        assert(!q('#pinDialog').open, 'Окно пароля не закрылось');
      } finally {
        window.open = originalOpen;
        if (q('#pinDialog').open) q('#pinDialog').close();
      }
    });

    await test('Архив: статистика и сохранение', async () => {
      q('#settingsBtn').click();
      await waitFor(() => q('#settingsDialog').open, 'Настройки не открылись');
      q('#tabArchive').click();
      await tick(30);
      assert(q('#archiveWishes').textContent === '1', 'Статистика желаний неверна');
      assert(q('#archiveSteps').textContent === '1', 'Статистика шагов неверна');
      assert(q('#archiveSaved').textContent !== 'ещё не сохранялось', 'Нет времени сохранения');
      const saved = JSON.parse(localStorage.getItem(app.storageKey));
      assert(saved.wishes.length === 1 && saved.steps.length === 1, 'Данные не в localStorage');
      q('#settingsDialog [data-close-settings]').click();
    });

    await test('Тестовое хранилище изолировано от основного', async () => {
      assert(app.storageKey === 'must-have.selftest.v1', 'Ключ тестового прогона неверен: ' + app.storageKey);
    });

    await test('Архив: импорт JSON заменяет данные', async () => {
      const payload = {
        app: 'must-have',
        version: 1,
        data: {
          manualAmount: 1000,
          wishes: [{ id: 'import-wish', name: 'Тест импорта', description: 'Проверка архива', price: 5000 }],
          steps: []
        }
      };
      const file = new File([JSON.stringify(payload)], 'must-have-backup.json', { type: 'application/json' });
      const transfer = new DataTransfer();
      transfer.items.add(file);
      const input = q('#importInput');
      input.files = transfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      await waitFor(() => q('#confirmDialog').open, 'Подтверждение импорта не открылось');
      q('#confirmYes').click();
      await waitFor(() => app.getState().wishes.length === 1 && app.getState().wishes[0].name === 'Тест импорта', 'Импорт не применился');
      assert(app.getTotals().need === 5000, 'Сумма импортированного желания неверна');
      assert(app.getTotals().have === 1000, 'Импортированная сумма А1 неверна');
      q('#settingsDialog [data-close-settings]').click();
    });

    await test('Сброс всех данных очищает блоки', async () => {
      q('#settingsBtn').click();
      await waitFor(() => q('#settingsDialog').open, 'Настройки не открылись');
      q('#tabArchive').click();
      await tick(20);
      q('#resetAllBtn').click();
      await waitFor(() => q('#confirmDialog').open, 'Подтверждение сброса не открылось');
      q('#confirmYes').click();
      await waitFor(() => app.getState().wishes.length === 0, 'Желания не сбросились');
      assert(app.getState().steps.length === 0, 'Шаги не сбросились');
      assert(app.getTotals().have === 0 && app.getTotals().need === 0, 'Суммы не сбросились');
      q('#settingsDialog [data-close-settings]').click();
    });

    const failed = results.filter((result) => !result.ok);
    const payload = {
      app: 'must-have',
      total: results.length,
      passed: results.length - failed.length,
      failed: failed.length,
      fontBody: getComputedStyle(document.body).fontFamily,
      results
    };

    const pre = document.createElement('pre');
    pre.id = 'selftest-results';
    pre.textContent = JSON.stringify(payload, null, 2);
    pre.style.cssText = 'position:fixed;left:-9999px;top:0;white-space:pre-wrap;';
    document.body.appendChild(pre);
    document.body.dataset.selftest = failed.length ? 'fail' : 'pass';
    document.title = failed.length ? 'Must Have — TEST FAIL' : 'Must Have — TEST PASS';
    console.log('[must-have selftest]', payload);
  }

  run().catch((error) => {
    const payload = {
      app: 'must-have',
      total: 0,
      passed: 0,
      failed: 1,
      fatal: String(error && error.stack ? error.stack : error)
    };
    const pre = document.createElement('pre');
    pre.id = 'selftest-results';
    pre.textContent = JSON.stringify(payload, null, 2);
    pre.style.cssText = 'position:fixed;left:-9999px;top:0;';
    document.body.appendChild(pre);
    document.body.dataset.selftest = 'fatal';
    document.title = 'Must Have — TEST FATAL';
    console.log('[must-have selftest fatal]', error);
  });
})();
