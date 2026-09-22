interface Props { data: unknown }

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildHtml(raw: string): string {
  let result = ''
  let i = 0
  while (i < raw.length) {
    const ch = raw[i]

    if (ch === '"') {
      // scan to end of JSON string
      let j = i + 1
      while (j < raw.length) {
        if (raw[j] === '\\') { j += 2; continue }
        if (raw[j] === '"') { j++; break }
        j++
      }
      const str = raw.slice(i, j)
      // is it a key? check for optional-space + colon after
      const keyMatch = raw.slice(j).match(/^[ \t]*:/)
      if (keyMatch) {
        result += `<span class="jk">${escHtml(str)}</span>${escHtml(keyMatch[0])}`
        i = j + keyMatch[0].length
      } else {
        result += `<span class="js">${escHtml(str)}</span>`
        i = j
      }
      continue
    }

    if (ch === '-' || (ch >= '0' && ch <= '9')) {
      const m = raw.slice(i).match(/^-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?/)
      if (m) {
        result += `<span class="jn">${m[0]}</span>`
        i += m[0].length
        continue
      }
    }

    if (raw.startsWith('true', i))  { result += '<span class="jb">true</span>';  i += 4; continue }
    if (raw.startsWith('false', i)) { result += '<span class="jb">false</span>'; i += 5; continue }
    if (raw.startsWith('null', i))  { result += '<span class="jb">null</span>';  i += 4; continue }

    result += escHtml(ch)
    i++
  }
  return result
}

export default function JsonViewer({ data }: Props) {
  const raw = JSON.stringify(data, null, 2) ?? 'null'
  return (
    <pre
      className="json-viewer"
      dangerouslySetInnerHTML={{ __html: buildHtml(raw) }}
    />
  )
}
