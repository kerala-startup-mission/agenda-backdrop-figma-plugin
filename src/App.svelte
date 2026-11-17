<script>
  import { onMount } from 'svelte'

  const API = 'https://events.startupmission.in/api'

  let event_list = []
  let event = ''
  let agenda_list = {}

  let date = ''
  let venue = ''
  let item = ''

  let loadingEvents = false
  let loadingAgenda = false
  let busy = false
  let error = ''
  let showHelp = false

  $: dates = Object.keys(agenda_list)
  $: venues = date ? Object.keys(agenda_list[date] || {}) : []
  $: sessions = (date && venue && agenda_list[date]?.[venue]) || []
  $: selected = item === '' ? null : sessions[item]
  $: speakers = selected?.speakers ? Object.values(selected.speakers).flat() : []

  async function getJSON(path) {
    const res = await fetch(`${API}/${path}`)
    if (!res.ok) throw new Error(`Request failed (${res.status})`)
    return res.json()
  }

  async function loadEvents() {
    loadingEvents = true
    error = ''
    try {
      event_list = await getJSON('events')
    } catch (e) {
      error = `Couldn't load events: ${e.message}`
    }
    loadingEvents = false
  }

  async function loadData() {
    loadingAgenda = true
    error = ''
    try {
      const data = await getJSON(`event/${event}/agenda/venue`)
      agenda_list = data.agenda || {}
      date = ''
      venue = ''
      item = ''
      post('EVENT', event)
    } catch (e) {
      error = `Couldn't load agenda: ${e.message}`
    }
    loadingAgenda = false
  }

  function post(type, data) {
    parent.postMessage({ pluginMessage: { type, data } }, '*')
  }

  function run(type, data) {
    busy = true
    post(type, data)
  }

  const describe = (s) => [s.designation, s.organisation].filter(Boolean).join(' · ')

  onmessage = (e) => {
    const msg = e.data?.pluginMessage
    if (!msg) return
    if (msg.type === 'event') event = msg.data
    if (msg.type === 'done') busy = false
  }

  onMount(loadEvents)
</script>

<main>
  <header>
    <div>
      <h1>AutoDrop</h1>
      <p class="muted">Agenda backdrops from your template</p>
    </div>
    <button class="secondary" on:click={() => run('GENERATE_TEMPLATE')} disabled={busy} title="Create a starter template frame on the canvas">
      New template
    </button>
  </header>

  <div class="content">
    <section>
      <label for="event">Event</label>
      <div class="row">
        {#if event_list.length}
          <select id="event" bind:value={event}>
            {#each event_list as e}
              <option value={e.slug}>{e.name}</option>
            {/each}
          </select>
        {:else}
          <select id="event" disabled>
            <option>{loadingEvents ? 'Loading events…' : 'No events'}</option>
          </select>
        {/if}
        <button class="primary" on:click={loadData} disabled={!event || loadingAgenda}>
          {loadingAgenda ? 'Loading…' : 'Load'}
        </button>
      </div>
    </section>

    {#if error}
      <p class="error">{error}</p>
    {/if}

    {#if dates.length}
      <section class="pair">
        <div>
          <label for="date">Date</label>
          <select id="date" bind:value={date} on:change={() => { venue = ''; item = '' }}>
            <option value="" disabled>Choose date</option>
            {#each dates as d}
              <option value={d}>{d}</option>
            {/each}
          </select>
        </div>
        <div>
          <label for="venue">Venue</label>
          <select id="venue" bind:value={venue} on:change={() => (item = '')} disabled={!date}>
            <option value="" disabled>Choose venue</option>
            {#each venues as v}
              <option value={v}>{v}</option>
            {/each}
          </select>
        </div>
      </section>
    {/if}

    {#if sessions.length}
      <section>
        <label for="session">Session</label>
        <select id="session" bind:value={item}>
          <option value="" disabled>Choose session</option>
          {#each sessions as s, i}
            <option value={i}>{s.name}</option>
          {/each}
        </select>
      </section>

      {#if selected}
        <section class="card">
          {#if selected.category}
            <div class="eyebrow">{selected.category}</div>
          {/if}
          <div class="title">{selected.name}</div>

          {#each speakers as s}
            <div class="speaker">
              {#if s.photo}
                <img src={s.photo} alt={s.name} />
              {:else}
                <div class="avatar">{(s.name || '?')[0]}</div>
              {/if}
              <div class="details">
                <div class="name">{s.name}</div>
                {#if describe(s)}
                  <div class="muted">{describe(s)}</div>
                {/if}
              </div>
            </div>
          {:else}
            <div class="muted">No speakers</div>
          {/each}
        </section>
      {/if}
    {/if}
  </div>

  <footer>
    {#if sessions.length}
      <div class="row">
        <button class="primary grow" on:click={() => run('GENERATE_PRO', selected)} disabled={!selected || busy}>
          {busy ? 'Working…' : 'Generate'}
        </button>
        <button class="secondary grow" on:click={() => run('GENERATE_PRO_MULTIPLE', sessions)} disabled={busy}>
          Generate all ({sessions.length})
        </button>
      </div>
    {/if}

    <p class="muted hint">
      Select your template frame on the canvas first.
      <button class="link" on:click={() => (showHelp = !showHelp)}>{showHelp ? 'Hide' : 'Template rules'}</button>
    </p>

    {#if showHelp}
      <ul class="help muted">
        <li>Text containing <code>#name</code>, <code>#category</code>, <code>#start_time</code>… is replaced with session data.</li>
        <li>A frame named <code>@layout</code> holds one <code>@speaker</code> card, repeated per speaker.</li>
        <li>Inside the card: <code>#name</code>, <code>#designation</code>, <code>#organisation</code>; a layer named <code>#photo</code> with an image fill gets the speaker photo.</li>
      </ul>
    {/if}
  </footer>
</main>

<style>
  :global(*) {
    box-sizing: border-box;
  }

  :global(html),
  :global(body) {
    height: 100%;
    margin: 0;
  }

  :global(body) {
    font: 11px/16px Inter, system-ui, -apple-system, 'Segoe UI', sans-serif;
    background: var(--figma-color-bg, #fff);
    color: var(--figma-color-text, #1e1e1e);
  }

  main {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--figma-color-border, #e6e6e6);
  }

  h1 {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
  }

  header p {
    margin: 0;
  }

  .content {
    flex: 1;
    overflow-y: auto;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  footer {
    padding: 12px 16px;
    border-top: 1px solid var(--figma-color-border, #e6e6e6);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  section {
    margin: 0;
  }

  label {
    display: block;
    margin-bottom: 4px;
    font-weight: 500;
    color: var(--figma-color-text-secondary, #757575);
  }

  .row {
    display: flex;
    gap: 8px;
  }

  .pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .grow {
    flex: 1;
  }

  .muted {
    color: var(--figma-color-text-secondary, #757575);
  }

  select {
    appearance: none;
    -webkit-appearance: none;
    width: 100%;
    min-width: 0;
    height: 32px;
    padding: 0 24px 0 8px;
    font: inherit;
    color: inherit;
    background-color: var(--figma-color-bg, #fff);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' fill='none' stroke='%23999' stroke-width='1.2'%3E%3Cpath d='M.5.5 4 4 7.5.5'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
    border: 1px solid var(--figma-color-border, #e6e6e6);
    border-radius: 5px;
    text-overflow: ellipsis;
    cursor: pointer;
    outline: none;
  }

  select:focus {
    border-color: var(--figma-color-border-selected, #0d99ff);
  }

  select:disabled {
    opacity: 0.5;
    cursor: default;
  }

  button {
    height: 32px;
    padding: 0 12px;
    font: inherit;
    font-weight: 500;
    border-radius: 5px;
    border: 1px solid transparent;
    cursor: pointer;
    white-space: nowrap;
  }

  button:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .primary {
    background: var(--figma-color-bg-brand, #0d99ff);
    color: var(--figma-color-text-onbrand, #fff);
  }

  .primary:not(:disabled):hover {
    background: var(--figma-color-bg-brand-hover, #007be5);
  }

  .secondary {
    background: transparent;
    color: inherit;
    border-color: var(--figma-color-border-strong, #d9d9d9);
  }

  .secondary:not(:disabled):hover {
    background: var(--figma-color-bg-hover, #f5f5f5);
  }

  .link {
    height: auto;
    padding: 0;
    border: 0;
    background: none;
    color: var(--figma-color-text-brand, #0d99ff);
  }

  .error {
    margin: 0;
    padding: 8px;
    border-radius: 5px;
    color: var(--figma-color-text-danger, #dc3412);
    background: var(--figma-color-bg-danger-tertiary, #fff1ee);
  }

  .card {
    padding: 12px;
    border-radius: 8px;
    background: var(--figma-color-bg-secondary, #f5f5f5);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .eyebrow {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--figma-color-text-brand, #0d99ff);
  }

  .title {
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .speaker {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .speaker img,
  .avatar {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }

  .avatar {
    display: grid;
    place-items: center;
    font-weight: 600;
    background: var(--figma-color-bg-tertiary, #e6e6e6);
  }

  .details {
    min-width: 0;
  }

  .name {
    font-weight: 500;
  }

  .hint {
    margin: 0;
  }

  .help {
    margin: 0;
    padding-left: 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10px;
    padding: 0 3px;
    border-radius: 3px;
    background: var(--figma-color-bg-secondary, #f5f5f5);
  }
</style>
