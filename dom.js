// Tiny DOM helper. Text is always inserted as text nodes, never as HTML.
export function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) {
    if (kid != null && kid !== false) el.append(kid);
  }
  return el;
}

export const field = (label, control) => h('label', { class: 'field' }, h('span', {}, label), control);

// Button that opens the camera/gallery. Returns [button, hiddenInput] to append together.
export function filePicker(label, onFile, { camera = false, cls = 'btn block' } = {}) {
  const input = h('input', { type: 'file', accept: 'image/*', capture: camera ? 'environment' : false, class: 'hidden' });
  input.addEventListener('change', () => {
    const file = input.files[0];
    input.value = '';
    if (file) onFile(file);
  });
  return [h('button', { class: cls, onclick: () => input.click() }, label), input];
}
