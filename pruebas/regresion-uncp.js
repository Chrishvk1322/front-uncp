/**
 * ============================================================================================
 *  UNCP — Pruebas de regresión del tema "uncp"
 * ============================================================================================
 *
 *  Recorre en un navegador real (Playwright/Chromium) todas las páginas que el tema personaliza, en
 *  escritorio (1366px) y en celular (390px), y comprueba que nada se haya roto. Ejecutarla después
 *  de cada cambio, con el build nuevo levantado (ver bitácora, sección 9):
 *
 *     node pruebas/regresion-uncp.js            # contra http://localhost:8080
 *     BASE=http://localhost:8080 node pruebas/regresion-uncp.js
 *
 *  Pensada para el proxy de desarrollo en modo solo lectura contra producción (READ_ONLY=1): las
 *  visitas no generan estadísticas (el proxy bloquea viewevents/searchevents) y nunca descarga archivos.
 *
 *  Comprueba en cada página:
 *   - que cargue sin errores de JavaScript ni respuestas 5xx, y sin scroll horizontal;
 *   - que no aparezca en pantalla la IP del servidor (ver bitácora 8.15);
 *   - los elementos propios de esa página (tarjetas, encabezado UNCP, pestañas, insignias, etc.).
 *  Termina con código 1 si falla alguna comprobación.
 * ============================================================================================
 */
const path = require('path');
const os = require('os');

// Playwright is not a project dependency: use the local tool install (~/.local/pwtool)
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (e) {
  ({ chromium } = require(path.join(os.homedir(), '.local/pwtool/node_modules/playwright')));
}

const BASE = process.env.BASE || 'http://localhost:8080';
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.31 Safari/537.36';
const SERVER_IP = '38.43.155.155';
const GREEN = 'rgb(6, 122, 90)';
const BLUE = 'rgb(31, 78, 121)';
// Careers (UNCP_CAREERS): solid circle in the official color, own icon, white or charcoal glyph
const WHITE = 'rgb(255, 255, 255)';
const CHARCOAL = 'rgb(39, 38, 37)';
const CAREER = {
  'Ingeniería Civil': { tint: 'rgb(181, 31, 32)', ink: WHITE, icon: 'fa-bridge' },                 // #B51F20
  'Ingeniería de Minas': { tint: 'rgb(249, 193, 20)', ink: CHARCOAL, icon: 'fa-helmet-safety' },   // #F9C114
  'Ingeniería de Sistemas': { tint: 'rgb(100, 150, 210)', ink: WHITE, icon: 'fa-laptop-code' },    // #6496D2
  'Ingeniería Química': { tint: 'rgb(252, 221, 24)', ink: CHARCOAL, icon: 'fa-flask' },            // #FCDD18
};

// Production data used by the checks
const COMMUNITY = '/handle/20.500.12894/37';             // 1. Arquitectura e Ingenierías (top level)
const LIBROS = '/communities/b352a329-fe14-4186-b024-8e882173205a'; // top level, with short description
const SUBCOMMUNITY = '/handle/20.500.12894/971';         // Ingeniería de Sistemas (under 37)
const COLLECTION = '/handle/20.500.12894/6577';          // Embargo (under 6. Tesis)
const ITEM = '/handle/20.500.12894/10160';

// Responses that are expected and not errors: the GA key is not defined in production (bitácora 8.14) and
// the read-only proxy answers 403 to statistics events
const EXPECTED_HTTP = [/google\.analytics\.key/, /statistics\/(viewevents|searchevents)/];
const EXPECTED_CONSOLE = [/status of 404/, /status of 403/];

const results = [];
function check(page, name, ok, detail = '') {
  results.push({ page, name, ok: !!ok, detail });
}

/** The cookie notice (Klaro), option B: dark background, gold links, UNCP green "Aceptar" (05/11/2026) */
async function cookieNotice(label, page) {
  const n = await page.evaluate(() => {
    const box = document.querySelector('.klaro .cookie-notice:not(.cookie-modal-notice)');
    if (!box) return null;
    const accept = box.querySelector('.cm-btn-success');
    const link = box.querySelector('.cn-learn-more');
    return { bg: getComputedStyle(box).backgroundColor, accept: accept && getComputedStyle(accept).backgroundColor, link: link && getComputedStyle(link).color,
      overflow: box.getBoundingClientRect().right > window.innerWidth + 1 };
  });
  check(label, 'aviso de cookies con el estilo UNCP', n && n.bg === 'rgb(15, 42, 36)' && n.accept === 'rgb(38, 178, 105)' && n.link === 'rgb(228, 194, 122)', JSON.stringify(n));
  check(label, 'aviso de cookies dentro de la pantalla', n && !n.overflow, JSON.stringify(n));
  // the "Personalizar" window: same style, switches colored by their real state
  const more = await page.$('.klaro .cookie-notice .cn-learn-more');
  if (!more) {
    return;
  }
  await more.click();
  await page.waitForTimeout(1000);
  const m = await page.evaluate(() => {
    const modal = document.querySelector('.klaro .cookie-modal .cm-modal');
    if (!modal) return null;
    const css = (sel, prop) => { const e = modal.querySelector(sel); return e && getComputedStyle(e)[prop]; };
    const switches = [...modal.querySelectorAll('.cm-list-input')].map((i) => ({
      on: i.checked || i.classList.contains('only-required') || i.classList.contains('half-checked'),
      bg: getComputedStyle(i.parentElement.querySelector('.slider')).backgroundColor,
    }));
    return { bg: getComputedStyle(modal).backgroundColor, link: css('.cm-header a', 'color'), all: css('.cm-btn-accept-all', 'backgroundColor'), switches };
  });
  check(label, 'ventana "Personalizar" con el estilo UNCP', m && m.bg === 'rgb(15, 42, 36)' && m.link === 'rgb(228, 194, 122)' && m.all === 'rgb(38, 178, 105)', JSON.stringify(m && { bg: m.bg, link: m.link, all: m.all }));
  check(label, 'interruptores en verde solo si están encendidos', m && m.switches.length > 0 && m.switches.every((sw) => sw.on === (sw.bg !== 'rgba(255, 255, 255, 0.25)')), JSON.stringify(m?.switches));
  await page.keyboard.press('Escape');
}

/**
 * Records the load of a page (Chrome screencast) and counts the frames whose upper half is mostly the dark footer
 * color: the "dark flash" of the footer jumping up while the content is replaced (fixed 06/11/2026)
 */
async function darkFlashFrames(browser, url) {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, locale: 'es-PE', userAgent: UA });
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  cdp.on('Page.screencastFrame', async (f) => {
    frames.push(f.data);
    await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'png', maxWidth: 341, maxHeight: 192, everyNthFrame: 1 });
  try {
    await page.goto(BASE + url, { waitUntil: 'commit', timeout: 90000 });
  } catch (e) {
    await page.close();
    return { frames: 0, dark: 0, error: e.message.split('\n')[0] };
  }
  await page.waitForTimeout(6000);
  await cdp.send('Page.stopScreencast');
  const dark = await page.evaluate(async (list) => {
    let count = 0;
    for (const data of list) {
      const img = new Image();
      img.src = 'data:image/png;base64,' + data;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, Math.round(img.height * 0.2), img.width, Math.round(img.height * 0.3)).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] < 40 && d[i + 1] < 60 && d[i + 2] < 60) {
          n++;
        }
      }
      if (n / (d.length / 4) > 0.6) {
        count++;
      }
    }
    return count;
  }, frames);
  await page.close();
  return { frames: frames.length, dark };
}

async function open(browser, url, width, keepCookieNotice = false) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, locale: 'es-PE', userAgent: UA });
  const problems = [];
  page.on('pageerror', (e) => problems.push(`JS: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !EXPECTED_CONSOLE.some((re) => re.test(m.text()))) {
      problems.push(`console: ${m.text().slice(0, 150)}`);
    }
  });
  page.on('response', (r) => {
    if (r.status() >= 500 || (r.status() >= 400 && !EXPECTED_HTTP.some((re) => re.test(r.url())))) {
      problems.push(`HTTP ${r.status()} ${r.request().method()} ${r.url().replace(BASE, '')}`);
    }
  });
  const response = await page.goto(BASE + url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(6000);
  if (!keepCookieNotice) {
    await page.evaluate(() => document.querySelectorAll('.klaro').forEach((e) => e.remove()));
  }
  return { page, problems, status: response.status() };
}

/** Checks every page shares */
async function common(label, { page, problems, status }) {
  check(label, 'carga (HTTP 200)', status === 200, `HTTP ${status}`);
  check(label, 'sin errores JS ni HTTP', problems.length === 0, problems.slice(0, 5).join(' | '));
  const measure = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  let overflow = await measure();
  if (overflow > 1) {
    // the pagination and the collapsed menu adapt to phones a moment after loading: only a lasting overflow counts
    await page.waitForTimeout(3000);
    overflow = await measure();
  }
  check(label, 'sin scroll horizontal', overflow <= 1, `${overflow}px de más`);
  const ip = await page.evaluate((ip) => document.body.innerText.includes(ip)
    || [...document.querySelectorAll('a[href]')].some((a) => a.href.includes(ip)), SERVER_IP);
  check(label, 'no muestra la IP del servidor', !ip);
  check(label, 'header y pie UNCP', await page.$('ds-header img, header img') && await page.$('footer, ds-footer'));
  const nav = await page.evaluate(() => ({ desktop: !!document.querySelector('#desktop-navbar'), toggler: !!document.querySelector('#mobile-navbar-toggler') }));
  if (page.viewportSize().width < 768) {
    // pages rendered client side only (e.g. /search) used to get the desktop navbar on phones (fixed 27/10/2026)
    check(label, 'menú de celular (☰), no el de escritorio', nav.toggler && !nav.desktop, JSON.stringify(nav));
  } else {
    check(label, 'menú de escritorio', nav.desktop && !nav.toggler, JSON.stringify(nav));
  }
}

/** The UNCP community/collection header (shared/uncp-comcol-header) */
async function comcolHeader(label, page, { title, icon, description }) {
  const h = await page.evaluate(() => {
    const el = document.querySelector('ds-uncp-comcol-header');
    if (!el) return null;
    return {
      title: el.querySelector('h1')?.textContent.trim(),
      icon: [...(el.querySelector('.uncp-comcol-icon i')?.classList ?? [])].find((c) => c.startsWith('fa-') && c !== 'fa-solid') ?? 'none',
      description: el.querySelector('.uncp-comcol-description')?.textContent.trim() ?? '',
      uri: el.querySelector('.uncp-comcol-uri a')?.getAttribute('href') ?? '',
      uriColor: el.querySelector('.uncp-comcol-uri a') && getComputedStyle(el.querySelector('.uncp-comcol-uri a')).color,
      stockHeader: !!document.querySelector('ds-comcol-page-header'),
    };
  });
  check(label, 'encabezado UNCP presente', h, 'no hay ds-uncp-comcol-header');
  if (!h) return;
  check(label, 'título del encabezado (sin número)', h.title === title, `"${h.title}"`);
  const tabTitle = await page.title();
  check(label, 'título de la pestaña sin número', !/(^|:: |Examinando )\d+\./.test(tabTitle) && tabTitle.includes(title), `"${tabTitle}"`);
  check(label, 'icono de la comunidad', h.icon === icon, h.icon);
  check(label, 'URI en hdl.handle.net', /^https:\/\/hdl\.handle\.net\/20\.500\.12894\/\d+$/.test(h.uri), h.uri);
  check(label, 'URI en azul', h.uriColor === BLUE, h.uriColor);
  const uriLink = await page.$('ds-uncp-comcol-header .uncp-comcol-uri a');
  if (uriLink && page.viewportSize().width >= 768) {
    await uriLink.hover();
    await page.waitForTimeout(200);
    const hoverColor = await uriLink.evaluate((a) => getComputedStyle(a).color);
    check(label, 'URI azul también en hover', hoverColor === BLUE, hoverColor);
  }
  check(label, 'sin el encabezado de serie', !h.stockHeader);
  if (description !== undefined) {
    check(label, 'descripción corta', description ? h.description.startsWith(description) : h.description === '', h.description.slice(0, 40));
  }
}

/** The active "Examinar" tab is green and has the expected label */
async function activeTab(label, page, expected) {
  const tab = await page.evaluate(() => {
    const a = document.querySelector('.comcol-browse .list-group-item.active');
    return a && { text: a.textContent.trim(), bg: getComputedStyle(a).backgroundColor };
  });
  check(label, `pestaña activa "${expected}"`, tab && tab.text === expected, tab ? tab.text : 'ninguna');
  check(label, 'pestaña activa en verde', tab && tab.bg === GREEN, tab?.bg);
  const other = await page.$('.comcol-browse .list-group-item:not(.active)');
  if (other) {
    const before = await other.evaluate((a) => getComputedStyle(a).color);
    await other.hover();
    await page.waitForTimeout(300);
    const after = await other.evaluate((a) => { const c = getComputedStyle(a); return { color: c.color, bg: c.backgroundColor, line: c.textDecorationLine }; });
    check(label, 'pestañas no seleccionadas en azul', before === BLUE, before);
    check(label, 'hover en pestaña: subrayado y fondo gris tenue', after.color === BLUE && after.line === 'underline' && after.bg === 'rgb(241, 243, 244)', JSON.stringify(after));
  }
}

async function run() {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });

  for (const width of [1366, 390]) {
    const dev = width > 600 ? 'escritorio' : 'celular';
    const mobile = width <= 600;

    // Home
    let label = `home (${dev})`;
    let p = await open(browser, '/home', width, true);
    await cookieNotice(label, p.page);
    await p.page.evaluate(() => document.querySelectorAll('.klaro').forEach((e) => e.remove()));
    await common(label, p);
    check(label, 'carrusel', await p.page.$('#carouselExampleCaptions .carousel-item.active'));
    const cards = await p.page.$$eval('.contenido-comunidades .community-card', (els) => els.map((e) => ({
      icon: [...(e.querySelector('.uncp-community-icon i')?.classList ?? [])].find((c) => c.startsWith('fa-') && c !== 'fa-solid'),
      glyph: getComputedStyle(e.querySelector('.uncp-community-icon i'), '::before').content,
      count: e.querySelector('.card-count')?.textContent.trim(),
      link: e.querySelector('.card-link')?.textContent.trim(),
    })));
    check(label, '8 tarjetas de comunidades', cards.length === 8, `${cards.length}`);
    check(label, 'tarjetas con icono y cifra', cards.every((c) => c.icon && /^\d[\d,]* documentos$/.test(c.count)), JSON.stringify(cards[0]));
    check(label, 'iconos dibujados (Font Awesome)', cards.every((c) => c.glyph && c.glyph !== 'none' && c.glyph !== 'normal'), cards.map((c) => c.glyph).join(' '));
    check(label, '8 iconos distintos', new Set(cards.map((c) => c.icon)).size === 8, cards.map((c) => c.icon).join(' '));
    check(label, 'enlace "Explorar comunidad"', cards.every((c) => c.link === 'Explorar comunidad'), cards[0]?.link);
    // one light green background for all cards, same height per row, hover fills the icon circle in green
    const look = await p.page.$$eval('.contenido-comunidades .community-card', (els) => els.map((e) => {
      const r = e.getBoundingClientRect();
      return { bg: getComputedStyle(e).backgroundColor, img: getComputedStyle(e).backgroundImage, top: Math.round(r.top), h: Math.round(r.height) };
    }));
    check(label, 'tarjetas blancas', look.every((c) => c.bg === 'rgb(255, 255, 255)' && c.img === 'none'), [...new Set(look.map((c) => c.bg))].join(' '));
    const sizes = look.map((c) => c.h);
    check(label, 'tamaño de tarjeta sin cambios (alto mínimo 220px)', sizes.every((h) => h >= 220), sizes.join(','));
    const circle = await p.page.evaluate(() => {
      const e = document.querySelector('.contenido-comunidades .uncp-community-icon');
      return e && { bg: getComputedStyle(e).backgroundColor, fg: getComputedStyle(e).color };
    });
    check(label, 'círculo verde sólido con icono blanco', circle && circle.bg === GREEN && circle.fg === 'rgb(255, 255, 255)', JSON.stringify(circle));
    const rows = {};
    look.forEach((c) => (rows[c.top] = rows[c.top] || []).push(c.h));
    check(label, 'misma altura por fila', Object.values(rows).every((hs) => Math.max(...hs) - Math.min(...hs) <= 1), JSON.stringify(rows));
    const card = await p.page.$('.contenido-comunidades .community-card');
    await card.scrollIntoViewIfNeeded();
    await card.hover();
    await p.page.waitForTimeout(500);
    const hover = await card.evaluate((e) => ({
      border: getComputedStyle(e).borderTopColor, icon: getComputedStyle(e.querySelector('.uncp-community-icon')).backgroundColor,
    }));
    check(label, 'hover: borde verde e icono en verde', hover.border === GREEN && hover.icon === GREEN, JSON.stringify(hover));
    const link = await card.$('.card-link');
    await link.hover();
    await p.page.waitForTimeout(400);
    const linkColor = await link.evaluate((a) => ({ text: getComputedStyle(a).color, arrow: getComputedStyle(a.querySelector('i')).color }));
    check(label, 'hover en "Explorar comunidad": texto y flecha en azul', linkColor.text === 'rgb(31, 78, 121)' && linkColor.arrow === 'rgb(31, 78, 121)', JSON.stringify(linkColor));
    check(label, 'publicaciones recientes', (await p.page.$$('ds-item-search-result-list-element')).length > 0);
    const footer = await p.page.$$eval('.stat-number', (els) => els.map((e) => e.textContent.trim()));
    check(label, 'cifras del pie', footer.length === 4 && footer.every((n) => /^\d[\d,]*$/.test(n)), footer.join(' '));
    await p.page.close();

    // Search
    label = `búsqueda (${dev})`;
    p = await open(browser, '/search?spc.page=1&spc.sf=dc.date.accessioned&spc.sd=DESC', width);
    await common(label, p);
    const items = await p.page.$$eval('ds-item-search-result-list-element', (els) => els.map((e) => e.querySelectorAll('.badge, .rounded-pill').length));
    check(label, 'resultados de ítems', items.length >= 5, `${items.length}`);
    check(label, 'insignias de tipo y acceso', items.length && items.every((n) => n >= 2), items.join(','));
    check(label, 'sin "Más..." visible', !(await p.page.evaluate(() => [...document.querySelectorAll('ds-truncatable-part button, ds-truncatable-part a')]
      .some((e) => e.offsetParent !== null && /más/i.test(e.textContent)))));
    const pag = await p.page.evaluate(() => {
      const a = document.querySelector('.pagination .page-item.active .page-link');
      return a && getComputedStyle(a).backgroundColor;
    });
    check(label, 'paginación activa en verde', pag === GREEN, pag);
    // filters (05/11/2026): no gray focus ring after a click, "Mostrar más" blue and not underlined, smaller values
    const toggle = await p.page.$('ds-search-filter .filter-name');
    if (toggle && !mobile) {
      await toggle.click();
      await p.page.waitForTimeout(2500);
      const f = await p.page.evaluate(() => {
        const box = document.querySelector('ds-search-filter .facet-filter');
        const more = document.querySelector('ds-search-filter .toggle-more-filters a');
        const value = document.querySelector('ds-search-facet-option .break-facet');
        return {
          ring: getComputedStyle(box).boxShadow,
          more: more && { color: getComputedStyle(more).color, line: getComputedStyle(more).textDecorationLine },
          size: value && getComputedStyle(value).fontSize,
        };
      });
      check(label, 'filtro abierto con contorno de foco verde suave', f.ring === 'rgba(6, 122, 90, 0.35) 0px 0px 0px 2px', f.ring);
      check(label, '"Mostrar más" en azul y sin subrayado', f.more && f.more.color === BLUE && f.more.line === 'none', JSON.stringify(f.more));
      check(label, 'valores de filtro en letra más pequeña (14.4px)', f.size === '14.4px', f.size);
    }
    await p.page.close();

    // Search results that are collections (page 1 of /search) and communities (page 4): UNCP cards
    if (!mobile) {
      for (const [pg, type, sample, bg] of [
        [1, 'Colección', 'Doctorado - Ingeniería Química Ambiental', 'rgb(252, 221, 24)'],
        [4, 'Comunidad', 'Agronomia', 'rgb(62, 154, 92)'],
      ]) {
        label = `búsqueda: resultados de tipo ${type} (${dev})`;
        p = await open(browser, `/search?spc.page=${pg}`, width);
        await common(label, p);
        const res = await p.page.$$eval('.uncp-comcol-result', (els) => els.map((a) => ({
          name: a.querySelector('.uncp-comcol-card-name').textContent.trim(),
          detail: a.querySelector('.uncp-comcol-card-detail').textContent.trim(),
          bg: getComputedStyle(a.querySelector('.uncp-community-icon')).backgroundColor,
          href: a.getAttribute('href'),
        })));
        const stockBadges = await p.page.$$eval('ds-collection-search-result-list-element ds-themed-badges, ds-community-search-result-list-element ds-themed-badges', (els) => els.length);
        check(label, 'tarjetas UNCP en lugar del enlace de serie', res.length >= 7 && stockBadges === 0, `${res.length} tarjetas, ${stockBadges} etiquetas de serie`);
        check(label, 'nombres sin número de orden', res.every((r) => !/^\d+\./.test(r.name)), res.map((r) => r.name).filter((n) => /^\d/.test(n)).join(', '));
        check(label, `tipo "${type}" y comunidad debajo`, res.some((r) => r.detail.startsWith(`${type} · `)), res[0]?.detail);
        const card = res.find((r) => r.name === sample);
        check(label, `${sample}: color de su carrera`, card && card.bg === bg && /^\/(collections|communities)\//.test(card.href), JSON.stringify(card));
        await p.page.close();
      }
    }

    // Community, subcommunity, collection
    for (const [name, url, expected] of [
      ['comunidad', COMMUNITY, { title: 'Arquitectura e Ingenierías', icon: 'fa-gears', description: '' }],
      ['comunidad con descripción', LIBROS, { title: 'Libros de investigación', icon: 'fa-book', description: 'Libros publicados por docentes' }],
      ['subcomunidad', SUBCOMMUNITY, { title: 'Ingeniería de Sistemas', icon: 'fa-laptop-code', description: '' }],
      ['colección', COLLECTION, { title: 'Embargo', icon: 'fa-graduation-cap', description: '' }],
    ]) {
      label = `${name} (${dev})`;
      p = await open(browser, url, width);
      await common(label, p);
      await comcolHeader(label, p.page, expected);
      if (!mobile) {
        await activeTab(label, p.page, name === 'colección' ? 'Envíos recientes' : 'Subcomunidades y colecciones');
      } else {
        check(label, 'selector de pestañas en celular', await p.page.$('.comcol-browse select'));
      }
      await p.page.close();
    }

    // Subcommunity and collection cards, breadcrumbs without order numbers, green RSS button
    label = `tarjetas de subcomunidades (${dev})`;
    p = await open(browser, COMMUNITY, width);
    await common(label, p);
    const subs = await p.page.evaluate(() => ({
      title: document.querySelector('ds-community-page-sub-community-list .uncp-comcol-section-title')?.textContent.trim(),
      cards: [...document.querySelectorAll('ds-community-page-sub-community-list .uncp-comcol-card')].map((a) => ({
        name: a.querySelector('.uncp-comcol-card-name')?.textContent.trim(), href: a.getAttribute('href'),
        icon: [...(a.querySelector('.uncp-community-icon i')?.classList ?? [])].find((c) => c.startsWith('fa-') && c !== 'fa-solid'),
        tint: getComputedStyle(a.querySelector('.uncp-community-icon')).backgroundColor,
        ink: getComputedStyle(a.querySelector('.uncp-community-icon')).color,
      })),
      pager: !!document.querySelector('ds-community-page-sub-community-list ngb-pagination'),
      crumbs: [...document.querySelectorAll('.breadcrumb-item')].map((li) => li.textContent.trim()),
      rss: (() => { const b = document.querySelector('ds-uncp-comcol-header ds-rss .btn'); return b && getComputedStyle(b).color; })(),
    }));
    check(label, 'título "Subcomunidades"', subs.title === 'Subcomunidades', subs.title);
    check(label, 'las 11 en una sola vista, sin paginación', subs.cards.length === 11 && !subs.pager, `${subs.cards.length} tarjetas, paginación: ${subs.pager}`);
    check(label, 'tarjetas con nombre, enlace e icono propio', subs.cards.every((c) => c.name && /^\/communities\//.test(c.href) && c.icon && c.icon !== 'fa-gears'), JSON.stringify(subs.cards[0]));
    check(label, 'tarjetas blancas', await p.page.$$eval('ds-community-page-sub-community-list .uncp-comcol-card', (els) => els.every((a) => getComputedStyle(a).backgroundColor === 'rgb(255, 255, 255)')));
    check(label, 'migas de pan sin número', subs.crumbs.join(' | ') === 'Inicio | Arquitectura e Ingenierías', subs.crumbs.join(' | '));
    check(label, 'botón RSS verde', subs.rss === GREEN, subs.rss);
    for (const [career, colors] of Object.entries(CAREER)) {
      const card = subs.cards.find((c) => c.name === career);
      check(label, `color e icono de carrera: ${career}`, card && card.tint === colors.tint && card.ink === colors.ink && card.icon === colors.icon, JSON.stringify(card));
    }
    if (!mobile) {
      const subCard = await p.page.$('ds-community-page-sub-community-list .uncp-comcol-card');
      await subCard.hover();
      await p.page.waitForTimeout(400);
      const subHover = await subCard.evaluate((a) => ({ border: getComputedStyle(a).borderTopColor, icon: getComputedStyle(a.querySelector('.uncp-community-icon')).backgroundColor }));
      check(label, 'hover: borde verde, el círculo conserva el color de la carrera', subHover.border === GREEN && subHover.icon === 'rgb(34, 138, 203)', JSON.stringify(subHover));
    }
    await p.page.close();

    // faculties 2 to 5: every career card has its official color (colors given on 28/10/2026)
    if (!mobile) {
      for (const [faculty, uuid, careers, sample] of [
        ['Administrativas', 'a24e4817-4cff-4c9c-b0bd-fcef79473277', 5, ['Economía', 'rgb(216, 33, 32)', WHITE, 'fa-chart-line']],
        ['Agrarias', 'a51150e5-83e6-4f09-bb12-8f2412f768ad', 11, ['Zootecnia', 'rgb(179, 34, 34)', WHITE, 'fa-cow']],
        ['Salud', 'c9e7a303-9874-44b9-bf51-280646e192eb', 2, ['Enfermería', 'rgb(95, 195, 238)', CHARCOAL, 'fa-user-nurse']],
        ['Sociales y Educación', '3222eea9-3c3c-45ff-bbed-7a444937ba8d', 17, ['Trabajo Social', 'rgb(25, 48, 116)', WHITE, 'fa-hands-holding-child']],
      ]) {
        label = `carreras de ${faculty} (${dev})`;
        p = await open(browser, `/communities/${uuid}`, width);
        await common(label, p);
        const found = await p.page.$$eval('ds-community-page-sub-community-list .uncp-comcol-card', (els) => els.map((a) => {
          const circle = a.querySelector('.uncp-community-icon');
          return { name: a.querySelector('.uncp-comcol-card-name').textContent.trim(), career: circle.classList.contains('uncp-career-icon'),
            bg: getComputedStyle(circle).backgroundColor, fg: getComputedStyle(circle).color,
            icon: [...circle.querySelector('i').classList].find((c) => c.startsWith('fa-') && c !== 'fa-solid') };
        }));
        check(label, `las ${careers} carreras con su color`, found.length === careers && found.every((c) => c.career), found.filter((c) => !c.career).map((c) => c.name).join(', ') || `${found.length} tarjetas`);
        const [name, bg, fg, icon] = sample;
        const card = found.find((c) => c.name === name);
        check(label, `${name}: color, icono y contraste`, card && card.bg === bg && card.fg === fg && card.icon === icon, JSON.stringify(card));
        await p.page.close();
      }
    }

    label = `tarjetas de colecciones (${dev})`;
    p = await open(browser, SUBCOMMUNITY, width);
    await common(label, p);
    const cols = await p.page.evaluate(() => ({
      title: document.querySelector('ds-community-page-sub-collection-list .uncp-comcol-section-title')?.textContent.trim(),
      cards: [...document.querySelectorAll('ds-community-page-sub-collection-list .uncp-comcol-card')].map((a) => ({
        name: a.querySelector('.uncp-comcol-card-name')?.textContent.trim(), detail: a.querySelector('.uncp-comcol-card-detail')?.textContent.trim(),
        href: a.getAttribute('href'),
      })),
      crumbs: [...document.querySelectorAll('.breadcrumb-item')].map((li) => li.textContent.trim()),
    }));
    const headerCircle = await p.page.$eval('ds-uncp-comcol-header .uncp-community-icon', (e) => ({ tint: getComputedStyle(e).backgroundColor, ink: getComputedStyle(e).color,
      icon: [...e.querySelector('i').classList].find((c) => c.startsWith('fa-') && c !== 'fa-solid') }));
    const sis = CAREER['Ingeniería de Sistemas'];
    check(label, 'encabezado con el color y el icono de la carrera (Sistemas)', headerCircle.tint === sis.tint && headerCircle.ink === sis.ink && headerCircle.icon === sis.icon, JSON.stringify(headerCircle));
    const colCircles = await p.page.$$eval('ds-community-page-sub-collection-list .uncp-community-icon', (els) => els.map((e) => ({ bg: getComputedStyle(e).backgroundColor, fg: getComputedStyle(e).color })));
    check(label, 'colecciones con el color de la carrera', colCircles.length === 3 && colCircles.every((c) => c.bg === sis.tint && c.fg === sis.ink), JSON.stringify(colCircles[0]));
    check(label, 'título "Colecciones"', cols.title === 'Colecciones', cols.title);
    check(label, 'orden Pregrado → Maestría → Doctorado', cols.cards.map((c) => c.name).join(',') === 'Pregrado,Maestría,Doctorado', cols.cards.map((c) => c.name).join(','));
    check(label, 'nombre completo como detalle', cols.cards.every((c) => /^Tesis - .+ - Ingeniería de Sistemas$/.test(c.detail) && /^\/collections\//.test(c.href)), JSON.stringify(cols.cards[0]));
    check(label, 'migas de pan sin número', cols.crumbs.join(' | ') === 'Inicio | Arquitectura e Ingenierías | Ingeniería de Sistemas', cols.crumbs.join(' | '));
    await p.page.close();

    // a collection of a career inherits the career color in its header; a top-level community stays neutral
    label = `colección de una carrera (${dev})`;
    const pregrado = cols.cards.find((c) => c.name === 'Pregrado');
    p = await open(browser, pregrado.href, width);
    await common(label, p);
    const colCircle = await p.page.$eval('ds-uncp-comcol-header .uncp-community-icon', (e) => getComputedStyle(e).backgroundColor);
    check(label, 'encabezado en el color de la carrera', colCircle === CAREER['Ingeniería de Sistemas'].tint, colCircle);
    await p.page.close();

    // Name with an order number and no space after the dot ("6.Tesis de pre y posgrado - ...")
    if (!mobile) {
      const cols = await (await fetch(`${BASE}/server/api/core/collections?size=200`)).json();
      const tesis = cols._embedded.collections.find((c) => /^6\.\S/.test(c.name));
      label = 'colección "6.Tesis..." (escritorio)';
      check(label, 'existe en la API', tesis, 'no se encontró');
      if (tesis) {
        p = await open(browser, `/collections/${tesis.uuid}`, width);
        await common(label, p);
        await comcolHeader(label, p.page, { title: tesis.name.replace(/^6\./, ''), icon: 'fa-graduation-cap' });
        const crumbs = await p.page.$$eval('.breadcrumb-item', (lis) => lis.map((li) => li.textContent.trim()));
        check(label, 'migas de pan sin número', crumbs.every((c) => !/^\d+\./.test(c)), crumbs.join(' | '));
        await p.page.close();
      }
    }

    // Every "Examinar" tab of a community: the header must stay (bug reported on 27/10/2026)
    if (!mobile) {
      p = await open(browser, COMMUNITY, width);
      const tabs = await p.page.$$eval('.comcol-browse .list-group-item', (els) => els.map((a) => ({
        text: a.textContent.trim(), href: a.getAttribute('href'),
      })));
      await p.page.close();
      check('pestañas de comunidad', 'hay 6 pestañas', tabs.length === 6, tabs.map((t) => t.text).join(', '));
      for (const tab of tabs.slice(1)) {
        label = `"${tab.text}" de comunidad (${dev})`;
        p = await open(browser, tab.href, width);
        await common(label, p);
        await comcolHeader(label, p.page, { title: 'Arquitectura e Ingenierías', icon: 'fa-gears' });
        await activeTab(label, p.page, tab.text);
        const button = await p.page.evaluate(() => {
          const b = document.querySelector('ds-starts-with-text .btn-primary, ds-starts-with-date .btn-primary, ds-browse-by-taxonomy-page .btn-primary');
          return b && getComputedStyle(b).backgroundColor;
        });
        check(label, 'botón en verde', button === GREEN, button);
        await p.page.close();
      }
    }
    // Same tabs, from a subcommunity and a collection (header icon inherited from the top community)
    for (const [name, url, title, icon] of [
      ['subcomunidad', `/browse/author?scope=${await uuidOf(SUBCOMMUNITY)}`, 'Ingeniería de Sistemas', 'fa-laptop-code'],
      ['colección', `/browse/dateissued?scope=${await uuidOf(COLLECTION)}`, 'Embargo', 'fa-graduation-cap'],
    ]) {
      label = `navegación de ${name} (${dev})`;
      p = await open(browser, url, width);
      await common(label, p);
      await comcolHeader(label, p.page, { title, icon });
      await p.page.close();
    }
    // Browse without scope: no header
    label = `navegación general (${dev})`;
    p = await open(browser, '/browse/author', width);
    await common(label, p);
    check(label, 'sin encabezado de comunidad', !(await p.page.$('ds-uncp-comcol-header')));
    await p.page.close();

    // Item page and full item page
    label = `ficha (${dev})`;
    p = await open(browser, ITEM, width);
    await common(label, p);
    check(label, 'insignias de tipo y acceso', (await p.page.$$('.uncp-item-badges > span')).length >= 2);
    check(label, 'resumen justificado', await p.page.$('.uncp-justify'));
    check(label, 'bloque de estadísticas', (await p.page.$$('.uncp-stat-card')).length === 2);
    check(label, 'miniatura', await p.page.$('ds-themed-thumbnail img, ds-thumbnail img'));
    await p.page.close();

    // same left column width on every item (thesis, book, article), 454px or 38% of the row (05/11/2026)
    if (!mobile) {
      const widths = [];
      for (const uuid of ['5583420e-5bec-41a4-a5db-3c40192258c1', '47382c68-1aa0-4833-956b-959cd8054eb3', 'b5a034cd-ea7e-46c5-bb0c-bb9ae4fd0a93', '8ff08aa4-d5d2-413a-b9d6-1919d0fd42bd']) {
        const q = await open(browser, `/items/${uuid}`, width);
        widths.push(await q.page.evaluate(() => {
          const left = document.querySelector('.uncp-item-left');
          return left ? { w: Math.round(left.getBoundingClientRect().width), overflow: left.scrollWidth > left.clientWidth + 1 } : null;
        }));
        await q.page.close();
      }
      check(`ficha (${dev})`, 'columna izquierda igual en tesis, libros y artículos', widths.every((x) => x && x.w === widths[0].w), widths.map((x) => x?.w).join(', '));
      check(`ficha (${dev})`, 'columna izquierda de 433px a 1366px (38%)', widths[0]?.w === 433, `${widths[0]?.w}px`);
      check(`ficha (${dev})`, 'sin desbordes en la columna izquierda', widths.every((x) => x && !x.overflow), JSON.stringify(widths));
    }

    label = `ficha completa (${dev})`;
    p = await open(browser, `/items/${await uuidOf(ITEM)}/full`, width);
    await common(label, p);
    check(label, 'bloque de estadísticas', (await p.page.$$('.uncp-stat-card')).length === 2);
    await p.page.close();
  }

  // No dark flash of the footer while the page loads
  for (const url of ['/home', '/search', COMMUNITY, ITEM]) {
    const r = await darkFlashFrames(browser, url);
    check(`carga de ${url}`, 'sin destello oscuro del pie al cargar', r.frames > 5 && r.dark === 0, r.error ?? `${r.dark} de ${r.frames} cuadros`);
  }

  // Server-side rendering: the header and its icon are already in the HTML (good for crawlers)
  const html = await (await fetch(`${BASE}/communities/${await uuidOf(SUBCOMMUNITY)}`)).text();
  check('SSR subcomunidad', 'encabezado UNCP en el HTML', html.includes('uncp-comcol-header'));
  check('SSR subcomunidad', 'icono de la carrera en el HTML', /uncp-comcol-icon[^<]*<i[^>]*fa-laptop-code/.test(html));

  await browser.close();
}

const uuids = {};
async function uuidOf(handleUrl) {
  if (!uuids[handleUrl]) {
    const handle = handleUrl.replace('/handle/', '');
    const r = await fetch(`${BASE}/server/api/pid/find?id=${encodeURIComponent(handle)}`, { redirect: 'manual' });
    uuids[handleUrl] = (r.headers.get('location') || '').split('/').pop();
  }
  return uuids[handleUrl];
}

run().then(() => {
  let lastPage = '';
  for (const r of results) {
    if (r.page !== lastPage) {
      console.log(`\n${r.page}`);
      lastPage = r.page;
    }
    console.log(`  ${r.ok ? 'OK   ' : 'FALLA'} ${r.name}${r.ok || !r.detail ? '' : `  → ${r.detail}`}`);
  }
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} comprobaciones correctas${failed ? `, ${failed} fallas` : ''}`);
  process.exit(failed ? 1 : 0);
}).catch((e) => {
  console.error(e);
  process.exit(2);
});
