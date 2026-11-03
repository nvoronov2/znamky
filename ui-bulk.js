// Bulk upload: many photos, processed one at a time; every result is saved to the collection automatically.
import { h, filePicker } from './dom.js';
import { T, errText, rangeText, yearLabel } from './i18n.js';
import { prepare } from './image.js';
import { analyze } from './api.js';
import { priceOf } from './price.js';
import { uid } from './state.js';
import * as db from './db.js';

const FATAL = ['errKey', 'errReq', 'errQuota']; // every following photo would fail the same way
const LIMIT_WAIT_S = 20;
const RETRIES = 2;
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function makeJob(file) {
  const img = h('img', { alt: file.name, src: BLANK });
  const title = h('strong', {}, file.name);
  const info = h('div', { class: 'muted' }, T.qWait);
  const el = h('div', { class: 'item' }, h('span', { class: 'perf' }, img), h('div', {}, title, info));
  const job = { file, el, state: 'wait' };
  job.set = (state, msg, item) => {
    job.state = state;
    info.textContent = msg;
    info.className = state === 'fail' ? 'err' : 'muted';
    el.classList.toggle('work', state === 'work');
    if (item) {
      img.src = item.thumb;
      title.textContent = `${item.country || T.cUnk}, ${yearLabel(item)}`;
    }
  };
  return job;
}

export function render(root, nav) {
  const jobs = [];
  let stopped = false;
  const list = h('div', {});
  const summary = h('p', { role: 'status' });
  const stop = h('button', { class: 'btn block hidden', onclick: () => { stopped = true; } }, T.stop);
  const again = h('button', { class: 'btn block hidden', onclick: () => run(jobs.filter((j) => j.state === 'wait' || j.state === 'fail')) }, T.retry);
  const [pickBtn, pickInput] = filePicker(T.bulkPick, (files) => {
    const fresh = files.map(makeJob);
    jobs.push(...fresh);
    list.append(...fresh.map((j) => j.el));
    run(fresh);
  }, { multiple: true, cls: 'btn primary block' });

  const refresh = (running) => {
    const done = jobs.filter((j) => j.state === 'done').length;
    summary.textContent = jobs.length ? `${T.bulkSaved}: ${done} / ${jobs.length}` : '';
    pickBtn.disabled = running;
    stop.classList.toggle('hidden', !running);
    again.classList.toggle('hidden', running || !jobs.some((j) => j.state === 'wait' || j.state === 'fail'));
  };

  async function analyzeWithRetry(job, image) {
    for (let attempt = 0; ; attempt++) {
      try {
        return await analyze(image, '');
      } catch (e) {
        if (e.message !== 'errLim' || attempt >= RETRIES) throw e;
        job.set('work', T.bulkWait);
        for (let s = 0; s < LIMIT_WAIT_S && !stopped; s++) await sleep(1000);
        if (stopped) throw e;
      }
    }
  }

  async function run(batch) {
    stopped = false;
    refresh(true);
    for (const job of batch) {
      if (stopped) break;
      job.set('work', T.qWork);
      try {
        const { image, thumb } = await prepare(job.file);
        const item = { ...(await analyzeWithRetry(job, image)), image, thumb, id: uid(), createdAt: new Date().toISOString() };
        await db.put(item);
        job.set('done', `${T.qDone}, ${rangeText(priceOf(item))}`, item);
      } catch (e) {
        if (stopped) { job.set('wait', T.qWait); break; }
        job.set('fail', errText(e));
        if (FATAL.includes(e.message)) break;
      }
    }
    refresh(false);
  }

  root.append(
    h('div', { class: 'bar' }, h('button', { class: 'btn link', onclick: () => nav('home') }, T.home)),
    h('div', { class: 'stack' },
      h('h1', {}, T.bulk),
      h('p', { class: 'muted' }, T.bulkHelp),
      pickBtn, pickInput, stop, summary, list, again));
}
