(function (root) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  function parse(md) {
    const doc = { name: '', head: [], sections: [] };
    let target = doc.head;
    for (const raw of String(md).split('\n')) {
      const line = raw.trim();
      if (!line) continue;
      if (line.startsWith('## ')) {
        const s = { title: line.slice(3), items: [] };
        doc.sections.push(s);
        target = s.items;
        continue;
      }
      if (line.startsWith('# ')) { doc.name = line.slice(2); continue; }
      const bullet = /^[-*•]\s+/.test(line);
      target.push({ bullet, text: bullet ? line.replace(/^[-*•]\s+/, '') : line });
    }
    return doc;
  }

  function itemsHtml(items) {
    let out = '';
    let inList = false;
    for (const it of items) {
      if (it.bullet) {
        if (!inList) { out += '<ul>'; inList = true; }
        out += `<li>${inline(it.text)}</li>`;
      } else {
        if (inList) { out += '</ul>'; inList = false; }
        out += `<p>${inline(it.text)}</p>`;
      }
    }
    if (inList) out += '</ul>';
    return out;
  }

  const sectionHtml = (s) => `<section><h2>${inline(s.title)}</h2>${itemsHtml(s.items)}</section>`;
  const isSkills = (s) => /مهارات|skills/i.test(s.title);

  // Shared by the browser preview and the server-side PDF export.
  function buildPaper(state) {
    const doc = parse(state.md || '');
    const dir = state.lang === 'en' ? 'ltr' : 'rtl';

    if (state.type === 'letter') {
      return {
        className: 'paper tpl-letter',
        dir,
        html: `<h1>${inline(doc.name)}</h1>` + itemsHtml(doc.head) + doc.sections.map(sectionHtml).join(''),
      };
    }

    const tpl = ['classic', 'modern', 'minimal'].includes(state.tpl) ? state.tpl : 'classic';
    const photoOk = /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(state.photo || '');
    const photo = photoOk ? `<img class="cv-photo" src="${state.photo}" alt="">` : '';
    const headHtml = `<h1>${inline(doc.name)}</h1><div class="cv-sub">${itemsHtml(doc.head)}</div>`;

    let html;
    if (tpl === 'modern') {
      const side = doc.sections.filter(isSkills);
      const main = doc.sections.filter((s) => !isSkills(s));
      html =
        `<aside class="cv-side">${photo}${side.map(sectionHtml).join('')}</aside>` +
        `<div class="cv-content">${headHtml}${main.map(sectionHtml).join('')}</div>`;
    } else {
      html =
        `<header class="cv-head">${photo}<div class="cv-id">${headHtml}</div></header>` +
        doc.sections.map(sectionHtml).join('');
    }
    return { className: `paper tpl-${tpl}`, dir, html };
  }

  root.CVRender = { buildPaper };
})(typeof window !== 'undefined' ? window : globalThis);
