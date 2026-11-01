const form = document.getElementById('form');
const paper = document.getElementById('paper');
const statusEl = document.getElementById('status');
const printBtn = document.getElementById('printBtn');
const pdfBtn = document.getElementById('pdfBtn');
const docLabel = document.getElementById('docLabel');
const photoInput = document.getElementById('photoInput');
const photoPreview = document.getElementById('photoPreview');
const photoRemove = document.getElementById('photoRemove');
const tplRadios = document.querySelectorAll('input[name="tpl"]');
const buttons = form.querySelectorAll('button[type="submit"]');
const wrap = document.getElementById('paperWrap');
const tabForm = document.getElementById('tabForm');
const tabPreview = document.getElementById('tabPreview');
const mobile = window.matchMedia('(max-width: 860px)');
const A4_WIDTH = 794;
const facultySelect = document.getElementById('faculty');
const facultyOtherWrap = document.getElementById('facultyOtherWrap');
facultySelect.addEventListener('change', () => {
  facultyOtherWrap.hidden = facultySelect.value !== '__other';
});

// Everything the preview needs lives here. The photo never leaves the browser.
const state = { md: '', type: 'cv', lang: 'ar', tpl: 'classic', photo: '' };

let submitter = null;
buttons.forEach((b) => b.addEventListener('click', () => (submitter = b)));

function render() {
  if (!state.md) return;
  const p = CVRender.buildPaper(state);
  paper.className = p.className;
  paper.dir = p.dir;
  paper.innerHTML = p.html;
  fitPaper();
}

// On phones the preview stays a real A4 sheet, scaled down to the screen width.
function fitPaper() {
  if (!mobile.matches) {
    wrap.classList.remove('fit');
    wrap.style.height = '';
    paper.style.transform = '';
    return;
  }
  wrap.classList.add('fit');
  if (!wrap.clientWidth) return; // preview tab is hidden right now
  const scale = Math.min(1, wrap.clientWidth / A4_WIDTH);
  paper.style.transform = `scale(${scale})`;
  wrap.style.height = `${Math.ceil(paper.offsetHeight * scale)}px`;
}

function setView(view) {
  document.body.dataset.view = view;
  tabForm.setAttribute('aria-pressed', String(view === 'form'));
  tabPreview.setAttribute('aria-pressed', String(view === 'preview'));
  if (view === 'preview') fitPaper();
  window.scrollTo(0, 0);
}
tabForm.addEventListener('click', () => setView('form'));
tabPreview.addEventListener('click', () => setView('preview'));
mobile.addEventListener('change', () => { if (!mobile.matches) document.body.dataset.view = 'form'; fitPaper(); });
window.addEventListener('resize', fitPaper);
document.fonts?.ready.then(fitPaper);

function setBusy(busy, message = '', isError = false) {
  buttons.forEach((b) => (b.disabled = busy));
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const type = submitter?.dataset.type || 'cv';
  const payload = Object.fromEntries(new FormData(form).entries());
  payload.type = type;

  setBusy(true, 'جارٍ الكتابة…');
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'حدث خطأ غير متوقع.');

    Object.assign(state, { md: data.text, type, lang: payload.language === 'en' ? 'en' : 'ar' });
    tplRadios.forEach((r) => (r.disabled = type === 'letter'));
    docLabel.textContent = type === 'cv' ? 'السيرة الذاتية' : 'رسالة التقديم';
    printBtn.disabled = false;
    pdfBtn.disabled = false;
    render();
    if (mobile.matches) setView('preview');
    setBusy(false, 'تم. يمكنك تغيير الشكل أو الصورة دون إعادة التوليد.');
  } catch (err) {
    setBusy(false, err.message, true);
  }
});

tplRadios.forEach((r) =>
  r.addEventListener('change', () => {
    state.tpl = r.value;
    render();
  })
);

async function processPhoto(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, fail) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = fail;
      i.src = url;
    });
    const size = 320;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const s = Math.min(img.width, img.height);
    c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
    return c.toDataURL('image/jpeg', 0.88);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function showPhoto(data) {
  state.photo = data;
  photoPreview.style.backgroundImage = data ? `url(${data})` : '';
  photoPreview.classList.toggle('has-photo', !!data);
  photoRemove.hidden = !data;
  render();
}

photoInput.addEventListener('change', async () => {
  const file = photoInput.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) {
    setBusy(false, 'اختر صورة بصيغة JPG أو PNG بحجم أقل من 10 ميغابايت.', true);
    photoInput.value = '';
    return;
  }
  try {
    showPhoto(await processPhoto(file));
    setBusy(false, '');
  } catch {
    setBusy(false, 'تعذّرت قراءة الصورة. جرّب ملفاً آخر.', true);
  }
  photoInput.value = '';
});

photoRemove.addEventListener('click', () => showPhoto(''));
printBtn.addEventListener('click', () => window.print());

pdfBtn.addEventListener('click', async () => {
  pdfBtn.disabled = true;
  setBusy(false, 'جارٍ تجهيز ملف PDF…');
  try {
    const res = await fetch('/api/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ md: state.md, type: state.type, lang: state.lang, tpl: state.tpl, photo: state.photo }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'تعذّر إنشاء ملف PDF.');
    }
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = state.type === 'cv' ? 'CV.pdf' : 'Cover-Letter.pdf';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    setBusy(false, 'تم تحميل الملف.');
  } catch (err) {
    setBusy(false, `${err.message} يمكنك استخدام زر الطباعة بدلاً من ذلك.`, true);
  } finally {
    pdfBtn.disabled = false;
  }
});
