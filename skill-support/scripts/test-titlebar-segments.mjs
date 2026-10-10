#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createTitlebarSegments, resolveTitlebarSegment, createTitlebarPreviewScenes } from '../../packages/component-contracts/src/titlebar-segments.js';
import { renderHtmlComponent, renderRuntimeHtmlComponent } from '../../packages/components-html/src/index.js';

const registry = JSON.parse(fs.readFileSync(new URL('../assets/design-system/pattern-contracts.json', import.meta.url)));
const componentStyles = fs.readFileSync(new URL('../../packages/component-styles/src/index.css', import.meta.url), 'utf8');
const componentContracts = JSON.parse(fs.readFileSync(new URL('../../packages/component-contracts/src/components.json', import.meta.url), 'utf8'));
const titlebarContract = componentContracts.components.find(component => component.id === 'titlebar');
assert.deepEqual(titlebarContract.textRolesByVariant, {
  small: ['title:subtitle-m'],
  medium: ['title:title-s'],
  large: ['title:title-s'],
  xlarge: ['title:title-s']
}, 'Titlebar title typography must be explicit for each registered size');
assert.ok(titlebarContract.tokenRoles.includes('typography.subtitle-m'));
assert.ok(titlebarContract.tokenRoles.includes('typography.title-s'));
assert.match(componentStyles, /\.tui-titlebar\[data-size="small"\][^}]*padding-right:\s*var\(--padding-titlebar-trailing-l\)/, 'Titlebar S must use the 12px trailing inset token');
assert.match(componentStyles, /\.tui-titlebar__pane-title\[data-typography-role="subtitle-m"\]\s*\{[^}]*font-size:\s*var\(--type-subtitle-m-size\)[^}]*line-height:\s*var\(--type-subtitle-m-leading\)[^}]*font-weight:\s*var\(--type-subtitle-m-weight\)/, 'Titlebar S title must use the Subtitle_M typography tokens');
assert.match(componentStyles, /\.tui-generated--titlebar\s*\{[^}]*padding-right:\s*var\(--padding-titlebar-trailing-l\)/, 'generated Titlebar must use the 12px trailing inset token');
assert.match(componentStyles, /\.tui-titlebar\[data-layout="three-column"\]\[data-pane-role="secondary-pane"\][^}]*padding-inline:\s*var\(--space-5\)[^}]*align-items:\s*center/, 'three-column middle Titlebar content must use the 16px inline inset and size-based cross-axis centering');
assert.match(componentStyles, /\.tui-titlebar__secondary-content\s*\{[^}]*width:\s*100%[^}]*display:\s*flex[^}]*align-items:\s*center/, 'middle Titlebar content must fill the slot without adding vertical padding');
const pattern = registry.patterns.find(p => p.id === 'pattern-b-three-pane');
const configs = createTitlebarSegments(pattern, {
  'primary-navigation': { slots: { logo: { src: '/product.svg', alt: '产品' }, label: '收件箱工作台' } },
  'main-detail': { slots: { 'main-detail-actions': [{ id: 'reply', label: '回复邮件', icon: 'action/reply', buttonType: 'icon-text-ghost' }] } }
});
assert.deepEqual(configs.map(s => s.region), pattern.titleLayer.segments);
assert.deepEqual(configs.map(s => s.showWindowControls), [false, false, true]);
assert.equal(resolveTitlebarSegment({ layout: 'standalone', segmentRole: 'global' }).showLogo, true);
assert.equal(resolveTitlebarSegment({ layout: 'two-column', segmentRole: 'main-content' }).showLogo, false);
assert.equal(resolveTitlebarSegment({ layout: 'two-column', segmentRole: 'main-content', showLogo: true, slots: { logo: { src: '/detail.svg', alt: '详情' } } }).showLogo, true);
assert.equal(resolveTitlebarSegment({ segmentRole: 'primary-navigation', slots: { leading: { src: '/legacy.svg', alt: '旧 Logo' } } }).logoSrc, '/legacy.svg');
assert.equal(resolveTitlebarSegment({ segmentRole: 'main-content', showLogo: false, slots: { logo: { src: '/detail.svg', alt: '详情' } } }).showLogo, false);
assert.throws(() => resolveTitlebarSegment({ segmentRole: 'primary-navigation', showLogo: false }), /first-level.*logo/i);
assert.throws(() => resolveTitlebarSegment({ segmentRole: 'primary-navigation', slots: { logo: { src: '/logo.svg' }, leading: { src: '/legacy.svg' } } }), /one logo slot/i);
assert.throws(() => resolveTitlebarSegment({ segmentRole: 'secondary-list', slots: { label: '错位' } }), /not available/);
assert.doesNotThrow(() => resolveTitlebarSegment({ layout: 'three-column', segmentRole: 'secondary-list', slots: { 'secondary-pane-content': { component: 'search', props: { placeholder: '搜索项目' } } } }));
assert.throws(() => resolveTitlebarSegment({ layout: 'three-column', segmentRole: 'secondary-list', slots: { 'secondary-pane-content': { component: 'input' } } }), /registered Search/);
assert.throws(() => resolveTitlebarSegment({ segmentRole: 'primary-navigation', showWindowControls: true }), /final/);
assert.throws(() => createTitlebarSegments(pattern, { 'main-detail': { layout: 'two-column' } }), /placement/);
assert.throws(() => resolveTitlebarSegment({ size: 'small', layout: 'two-column', segmentRole: 'main-content' }), /Titlebar_S.*standalone/);
assert.throws(() => resolveTitlebarSegment({ size: 'small', layout: 'three-column', segmentRole: 'main-detail' }), /Titlebar_S.*standalone/);
assert.throws(() => createTitlebarSegments(pattern, { 'main-detail': { size: 'small' } }), /Titlebar_S.*standalone/);
assert.doesNotThrow(() => resolveTitlebarSegment({ size: 'small', layout: 'standalone', paneRole: 'final-pane', paneTitle: '项目设置' }));
assert.throws(() => resolveTitlebarSegment({ segmentRole: 'main-detail', slots: { actions: '<button>close</button>' } }), /boolean/);
const twoPattern = registry.patterns.find(p => p.id === 'pattern-a-two-pane');
const twoConfigs = createTitlebarSegments(twoPattern, { 'main-content': { slots: { 'main-content-leading': { id: 'back', label: '返回', icon: 'navigation/back' }, 'main-content-title': '项目详情', actions: false } } });
const preview = createTitlebarPreviewScenes();
assert.equal(preview.length, 4);
assert.equal(preview.flatMap(group => group.scenes).length, 14);
assert.deepEqual(preview.find(group => group.size === 'small').scenes.map(scene => scene.layout), ['standalone', 'unfocus']);
const gallery = renderRuntimeHtmlComponent('titlebar');
assert.equal((gallery.match(/data-preview-size=/g) ?? []).length, 4);
assert.equal((gallery.match(/data-preview-layout=/g) ?? []).length, 14);

const require = createRequire(new URL('../../apps/component-gallery/package.json', import.meta.url));
const { build } = await import(pathToFileURL(require.resolve('vite')));
const { default: vuePlugin } = await import(pathToFileURL(require.resolve('@vitejs/plugin-vue')));
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { h } = require('vue');
const { renderToString } = require('vue/server-renderer');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'tui-titlebar-render-'));
try {
  const peers = ['vue', 'vue/server-renderer', 'react', '@text-to-ui/component-contracts/titlebar-segments'];
  await build({ configFile: false, root: fileURLToPath(new URL('../..', import.meta.url)), plugins: [vuePlugin()], logLevel: 'error',
    build: { ssr: true, outDir: temp, emptyOutDir: false, rollupOptions: {
      input: { react: fileURLToPath(new URL('../../packages/components-react/src/index.jsx', import.meta.url)), vue: fileURLToPath(new URL('../../packages/components-vue/src/Titlebar.vue', import.meta.url)) },
      external: peers,
      output: { entryFileNames: '[name].mjs', paths: id => id === '@text-to-ui/component-contracts/titlebar-segments' ? fileURLToPath(new URL('../../packages/component-contracts/src/titlebar-segments.js', import.meta.url)) : peers.includes(id) ? require.resolve(id) : id }
    } }
  });
  const { Titlebar: ReactTitlebar } = await import(pathToFileURL(path.join(temp, 'react.mjs')));
  const { default: VueTitlebar } = await import(pathToFileURL(path.join(temp, 'vue.mjs')));
  const renderers = {
    html: options => renderHtmlComponent('titlebar', options),
    react: options => renderToStaticMarkup(React.createElement(ReactTitlebar, options)),
    vue: options => renderToString(h(VueTitlebar, options))
  };
  for (const [framework, render] of Object.entries(renderers)) {
    for (const { size, scenes } of preview) {
      assert.deepEqual(scenes.map(scene => scene.layout), size === 'small' ? ['standalone', 'unfocus'] : ['standalone', 'two-column', 'three-column', 'unfocus']);
      for (const scene of scenes) {
        const markup = (await Promise.all(scene.segments.map(options => render(options)))).join('');
        assert.equal((markup.match(/data-component="titlebar"/g) ?? []).length, scene.segments.length, `${framework}/${size}/${scene.layout}`);
        assert.equal((markup.match(/data-action="close"/g) ?? []).length, 1, `${framework}/${size}/${scene.layout}`);
        assert.equal((markup.match(new RegExp(`<header\\b[^>]*\\bdata-size="${size}"`, 'g')) ?? []).length, scene.segments.length, `${framework} size must apply to every segment`);
        if (markup.includes('data-slot="main-content-title"')) {
          const expectedTitleRole = size === 'small' ? 'subtitle-m' : 'title-s';
          assert.match(markup, new RegExp(`data-slot="main-content-title"[^>]*data-typography-role="${expectedTitleRole}"`), `${framework}/${size} title role`);
        }
        if (scene.layout === 'three-column') {
          assert.equal((markup.match(/data-slot="secondary-pane-content"/g) ?? []).length, 1, `${framework}/${size}/three-column middle slot`);
          assert.equal((markup.match(/data-component="search"/g) ?? []).length, 1, `${framework}/${size}/three-column registered middle component`);
        }
      }
    }
    const markup = (await Promise.all(configs.map(({ region, ...options }) => render(options)))).join('');
    assert.equal((markup.match(/data-component="titlebar"/g) ?? []).length, 3, framework);
    assert.equal((markup.match(/data-action="close"/g) ?? []).length, 1, framework);
    assert.equal((markup.match(/data-slot="logo"/g) ?? []).length, 1, `${framework} first-level logo slot`);
    assert.ok((markup.match(/data-logical-component="Icon Button\/Ghost\/Default"/g) ?? []).length >= 3, `${framework} window controls must reuse the registered ghost icon Button`);
    assert.ok((markup.match(/data-icon-size="24"/g) ?? []).length >= 3, `${framework} window-control icons must be 24×24`);
    assert.match(markup, /收件箱工作台/);
    assert.match(markup, /product.svg/);
    assert.match(markup, /回复邮件/);
    const twoMarkup = (await Promise.all(twoConfigs.map(({ region, ...options }) => render(options)))).join('');
    assert.match(twoMarkup, /项目详情/);
    assert.match(twoMarkup, /data-slot="main-content-leading"/);
    assert.match(twoMarkup, /data-action="back"/);
    assert.match(twoMarkup, /data-icon-size="24"/);
    assert.doesNotMatch(twoMarkup, /data-action="close"/);
    assert.equal((await render({ size: 'large', layout: 'two-column', segmentRole: 'main-content', showLogo: true, slots: { logo: { src: '/detail.svg', alt: '详情' }, 'main-content-title': '项目详情' } })).match(/data-slot="logo"/g)?.length ?? 0, 1, `${framework} configurable final logo slot`);
    const smallStandalone = await render({ size: 'small', layout: 'standalone', paneRole: 'final-pane', paneTitle: '项目设置' });
    assert.match(smallStandalone, /项目设置/);
    assert.match(smallStandalone, /data-slot="main-content-title"[^>]*data-typography-role="subtitle-m"/);
    assert.match(smallStandalone, /data-action="close"/);
    assert.doesNotMatch(smallStandalone, /data-slot="logo"/);
    const largeStandalone = await render({ size: 'large', layout: 'standalone', paneRole: 'final-pane', paneTitle: '项目设置' });
    assert.match(largeStandalone, /data-slot="main-content-title"[^>]*data-typography-role="title-s"/);
  }
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
console.log('Titlebar Pattern segments and executable slots passed HTML / React / Vue rendering.');
