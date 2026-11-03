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

// Button that opens the camera/gallery (multiple: several photos at once). Returns [button, hiddenInput] to append together.
export function filePicker(label, onFile, { camera = false, multiple = false, accept = 'image/*', cls = 'btn block' } = {}) {
  const input = h('input', { type: 'file', accept, capture: camera ? 'environment' : false, multiple, class: 'hidden' });
  input.addEventListener('change', () => {
    const files = [...input.files];
    input.value = '';
    if (files.length) onFile(multiple ? files : files[0]); // multiple -> array of files
  });
  return [h('button', { class: cls, onclick: () => input.click() }, label), input];
}
