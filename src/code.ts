type Values = Record<string, unknown>
type Session = Values & { name?: string; speakers?: Record<string, Values[]> | null }
type Container = SceneNode & ChildrenMixin

const DEFAULT_EVENT = 'huddle-global-2023'
// 1×1 gray PNG used as the #photo placeholder in generated templates.
const PLACEHOLDER_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGM4AwAAzgDN1GaQsAAAAABJRU5ErkJggg=='

figma.showUI(__html__, { width: 360, height: 560, themeColors: true })

figma.ui.onmessage = async ({ type, data }) => {
  try {
    if (type === 'GENERATE_PRO') await generateProBackdrop(data)
    else if (type === 'GENERATE_PRO_MULTIPLE') await generateProMultipleBackdrop(data)
    else if (type === 'GENERATE_TEMPLATE') await createTemplate()
    else if (type === 'EVENT') await figma.clientStorage.setAsync('event', data)
  } catch (e) {
    figma.notify(e instanceof Error ? e.message : String(e), { error: true })
  }
  figma.ui.postMessage({ type: 'done' })
}

figma.clientStorage.getAsync('event').then((event) => {
  figma.ui.postMessage({ type: 'event', data: event || DEFAULT_EVENT })
})

function getTemplate(): Container {
  const node = figma.currentPage.selection[0]
  if (!node || !('children' in node)) throw new Error('Select a template frame first')
  return node
}

const parentOf = (node: SceneNode) => node.parent as BaseNode & ChildrenMixin

async function generateProBackdrop(session: Session) {
  const template = getTemplate()
  const frame = await generatePro(template, session, (f) => {
    parentOf(template).appendChild(f)
    f.x = template.x + template.width + 10
    f.y = template.y
  })

  figma.notify(`Generated "${frame.name}"`)
}

async function generateProMultipleBackdrop(sessions: Session[]) {
  if (!sessions?.length) throw new Error('No sessions to generate')

  const template = getTemplate()
  const { x, y, width, height } = template

  const cols = 10
  const spacing = 50
  const rows = Math.ceil(sessions.length / cols)

  const repeater = figma.createFrame()
  repeater.fills = []

  // Auto Layout grid with wrap
  repeater.layoutMode = 'HORIZONTAL'
  repeater.layoutWrap = 'WRAP'
  repeater.primaryAxisAlignItems = 'CENTER'
  repeater.counterAxisAlignItems = 'CENTER'
  repeater.itemSpacing = spacing
  repeater.counterAxisSpacing = spacing

  // Fix the container size so wrap respects our exact cols/rows
  repeater.primaryAxisSizingMode = 'FIXED'
  repeater.counterAxisSizingMode = 'FIXED'
  repeater.resize(width * cols + spacing * (cols - 1), height * rows + spacing * (rows - 1))

  parentOf(template).appendChild(repeater)
  repeater.x = x + width + 10
  repeater.y = y

  // Sequential so frames keep agenda order; each clone drops into the grid as soon as it's made.
  try {
    for (const session of sessions) await generatePro(template, session, (f) => repeater.appendChild(f))
  } catch (e) {
    repeater.remove()
    throw e
  }

  figma.notify(`Generated ${sessions.length} backdrops`)
}

// Layer names get stray whitespace / zero-width chars when copy-pasted.
const clean = (name: string) => name.replace(/[\s\u200B-\u200D\u2060\uFEFF]/g, '')

const findContainer = (root: ChildrenMixin, name: string) =>
  root.findOne((n) => 'children' in n && clean(n.name) === name) as Container | null

const textsIn = (root: ChildrenMixin) => root.findAll((n) => n.type === 'TEXT') as TextNode[]

type ImageNode = RectangleNode | EllipseNode | FrameNode
const imagesIn = (root: ChildrenMixin) =>
  root.findAll(
    (n) =>
      (n.type === 'RECTANGLE' || n.type === 'ELLIPSE' || n.type === 'FRAME') &&
      Array.isArray(n.fills) &&
      n.fills.some((f: Paint) => f.type === 'IMAGE'),
  ) as ImageNode[]

// `place` moves the fresh clone to its final spot before filling, so it never sits on top of the template.
async function generatePro(template: Container, session: Session, place: (frame: Container) => void): Promise<Container> {
  const frame = template.clone() as Container
  place(frame)

  const layout = findContainer(frame, '@layout')
  const speakerCard = layout && findContainer(layout, '@speaker')

  if (!layout || !speakerCard) {
    // Show real names with non-ASCII escaped, so lookalike chars are visible.
    const found = (layout || frame).children
      .map((c) => JSON.stringify(c.name).replace(/[^\x20-\x7E]/g, (ch) => '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0')))
      .join(', ')
    frame.remove()
    throw new Error(
      (!layout ? 'Template is missing a layer named "@layout"' : 'No layer named "@speaker" inside "@layout"') + `. Found: ${found}`,
    )
  }

  frame.name = session.name || frame.name

  await loadFonts(textsIn(frame))

  // Session-level placeholders: everything outside the speaker card.
  const speakerTextIds = new Set(textsIn(speakerCard).map((t) => t.id))
  fillText(
    textsIn(frame).filter((t) => !speakerTextIds.has(t.id)),
    session,
  )

  const speakers = ([] as Values[]).concat(...Object.values(session.speakers ?? {}))
  const imageJobs: Promise<void>[] = []

  for (const speaker of speakers) {
    const card = speakerCard.clone() as Container
    fillText(textsIn(card), speaker)

    for (const node of imagesIn(card)) {
      const name = clean(node.name)
      const key = name.slice(1)
      if (name[0] === '#' && key in speaker) imageJobs.push(setImage(node, speaker[key], speaker.name))
    }

    layout.appendChild(card)
  }

  speakerCard.remove()
  await Promise.all(imageJobs)

  return frame
}

async function loadFonts(nodes: TextNode[]) {
  const fonts = new Map<string, FontName>()
  for (const t of nodes) {
    const names = t.characters.length ? t.getRangeAllFontNames(0, t.characters.length) : [t.fontName as FontName]
    for (const f of names) fonts.set(`${f.family}|${f.style}`, f)
  }
  await Promise.all([...fonts.values()].map((f) => figma.loadFontAsync(f)))
}

// Replace every "#key" with its value. Longest keys first so "#link_text" isn't eaten by "#link".
function fillText(nodes: TextNode[], values: Values) {
  const keys = Object.keys(values)
    .filter((k) => values[k] === null || typeof values[k] !== 'object')
    .sort((a, b) => b.length - a.length)

  for (const node of nodes) {
    const text = keys.reduce((s, k) => s.split('#' + k).join(values[k] == null ? '' : String(values[k])), node.characters)
    if (text !== node.characters) node.characters = text
  }
}

async function setImage(node: ImageNode, url: unknown, who: unknown) {
  try {
    if (!url) throw new Error('missing')
    const image = await figma.createImageAsync(String(url))
    node.fills = [{ type: 'IMAGE', imageHash: image.hash, scaleMode: 'FILL' }]
  } catch {
    figma.notify(`Couldn't load photo for ${who || 'a speaker'}`, { error: true })
  }
}

async function createTemplate() {
  const regular: FontName = { family: 'Inter', style: 'Regular' }
  const bold: FontName = { family: 'Inter', style: 'Bold' }
  await Promise.all([figma.loadFontAsync(regular), figma.loadFontAsync(bold)])

  const text = (chars: string, size: number, width: number, font = regular) => {
    const t = figma.createText()
    t.fontName = font
    t.characters = chars
    t.fontSize = size
    t.textAlignHorizontal = 'CENTER'
    t.resize(width, t.height)
    t.textAutoResize = 'HEIGHT'
    return t
  }

  const stack = (name: string, mode: 'HORIZONTAL' | 'VERTICAL', gap: number, children: SceneNode[]) => {
    const f = figma.createFrame()
    f.name = name
    f.fills = []
    f.layoutMode = mode
    f.itemSpacing = gap
    f.primaryAxisAlignItems = 'CENTER'
    f.counterAxisAlignItems = 'CENTER'
    f.primaryAxisSizingMode = 'AUTO'
    f.counterAxisSizingMode = 'AUTO'
    children.forEach((c) => f.appendChild(c))
    return f
  }

  const photo = figma.createRectangle()
  photo.name = '#photo'
  photo.resize(240, 240)
  photo.cornerRadius = 120
  photo.fills = [{ type: 'IMAGE', imageHash: figma.createImage(figma.base64Decode(PLACEHOLDER_PNG)).hash, scaleMode: 'FILL' }]

  const speaker = stack('@speaker', 'VERTICAL', 12, [
    photo,
    text('#name', 28, 280, bold),
    text('#designation', 20, 280),
    text('#organisation', 20, 280),
  ])

  const layout = stack('@layout', 'HORIZONTAL', 48, [speaker])
  layout.layoutWrap = 'WRAP'
  layout.counterAxisSpacing = 48
  layout.resize(1600, layout.height)
  layout.primaryAxisSizingMode = 'FIXED'
  layout.counterAxisSizingMode = 'AUTO'

  const root = stack('AutoDrop Template', 'VERTICAL', 64, [text('#category', 36, 1600), text('#name', 80, 1600, bold), layout])
  root.fills = [figma.util.solidPaint('#FFFFFF')]
  root.paddingTop = root.paddingBottom = root.paddingLeft = root.paddingRight = 80
  root.resize(1920, 1080)
  root.primaryAxisSizingMode = 'FIXED'
  root.counterAxisSizingMode = 'FIXED'
  root.x = Math.round(figma.viewport.center.x - root.width / 2)
  root.y = Math.round(figma.viewport.center.y - root.height / 2)

  figma.currentPage.selection = [root]
  figma.viewport.scrollAndZoomIntoView([root])
  figma.notify('Template created and selected. Style it, then Generate.')
}
