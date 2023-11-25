<script lang="ts">
  import {onMount} from 'svelte';

  let agenda_list = [];
  let event_list = [];

  let date;
  let time;
  let item;

  let page = "main";

  let settings = {};

  let event = "";

  $:selected = agenda_list && date && time && item ? agenda_list[date][time][item] : {};

  async function loadData(){
    let data = await fetch(`https://events.startupmission.in/api/event/${event}/agenda/venue`).then(response => response.json());
    agenda_list = data.agenda;

    date = "";
    time = "";
    item = "";

    parent.postMessage({ pluginMessage: { type: 'EVENT', data: event } }, '*');  

    // console.log(agenda_list);
  }

  function generate(){
    parent.postMessage({ pluginMessage: { type: 'GENERATE', data: selected } }, '*');  
  }

  async function loadEvents(){
    let data = await fetch(`https://events.startupmission.in/api/events`).then(response => response.json());
    event_list = data;
    date = "";
    time = "";
    item = "";
  }

  function saveSettings(){
    parent.postMessage({ pluginMessage: { type: 'SETTINGS', data: settings } }, '*'); 
    page = "main"; 
  }

  function defaultSettings(){
    parent.postMessage({ pluginMessage: { type: 'DEFAULT', data: '' } }, '*'); 
    page = "main"; 
  }

  onMount(()=>{
    loadEvents();
  })

  onmessage = (e) => {
    var event_data = e.data.pluginMessage;

    
    if(event_data.type == "settings"){
      settings = event_data.data;
    }

    if(event_data.type == "event"){
      event = event_data.data;
    }

  }

</script>

<div class="p-xsmall wrapper flex column base">

  {#if page=="settings"}
    <div>

      <div class="flex justify-end mb-3 w-full">
        <button on:click={()=>{ page = "main" }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
            <path fill-rule="evenodd" d="M9.53 2.47a.75.75 0 010 1.06L4.81 8.25H15a6.75 6.75 0 010 13.5h-3a.75.75 0 010-1.5h3a5.25 5.25 0 100-10.5H4.81l4.72 4.72a.75.75 0 11-1.06 1.06l-6-6a.75.75 0 010-1.06l6-6a.75.75 0 011.06 0z" clip-rule="evenodd" />
          </svg>               
        </button>  
      </div>

      <div class="flex flex-row gap-5 mb-3">

        <div class="flex-1">
          <div class="mb-1">Heading Size</div>
          <input bind:value={settings.HEADING_SIZE} type="number" />
        </div>

      </div>

      <div class="mb-1">Speaker Settings</div>

      <div class="flex flex-row gap-5 mb-3">

        <div class="flex-1">
          <div class="mb-1">Image Size</div>
          <input bind:value={settings.SPEAKER_IMAGE_SIZE} type="number" />
        </div>

        <div class="flex-1">
          <div class="mb-1">Content Size</div>
          <input bind:value={settings.SPEAKER_CONTENT_SIZE} type="number" />
        </div>

      </div>

      <div class="flex flex-row gap-5 mb-3">

        <div class="flex-1">
          <div class="mb-1">Stroke Color</div>
          <input bind:value={settings.SPEAKER_STROKE_COLOR} />
        </div>

        <div class="flex-1">
          <div class="mb-1">Stroke Width</div>
          <input bind:value={settings.SPEAKER_STROKE_WIDTH} type="number" />
        </div>

      </div>


      <div class="flex flex-row gap-5 mb-3">

        <div class="flex-1">
          <div class="mb-1">Image Style</div>
          <div class="mb-sm custom-select">
            <select bind:value={settings.SPEAKER_IMAGE_TYPE} >
              <option value="C">Circle</option>
              <option value="CBR">Circle Border Right</option>
              <option value="CBL">Circle Border Left</option>
              <option value="BR">Rounded Border Right</option>
              <option value="BL">Rounded Border Left</option>
              <option value="SQ">Square</option>
            </select>
          </div>
        </div>

      </div>

      <div class="mb-sm flex gap-5 justify-center ">
        <button on:click={()=>{saveSettings();}} class="button">Save Settings</button>
        <button on:click={()=>{defaultSettings();}} class="button">Load Default</button>
      </div>

    </div>
  {/if}

  {#if page=="main"}
    <div>
      
      <div class="flex justify-end mb-3 w-full">
        <button on:click={()=>{ page = "settings" }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
            <path fill-rule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clip-rule="evenodd" />
          </svg>      
        </button>  
      </div>
      
      <div class="mb-sm custom-select">
        <select bind:value={event} style="max-width: 100%;">
          {#each event_list as event_item}
            <option value="{event_item.slug}">{event_item.name}</option>
          {/each}
        </select>
      </div>

      <div class="mb-sm">
        <button on:click={()=>{loadData();}} class="button">Load Data</button>
      </div>

      {#if Object.keys(agenda_list).length > 0}
        <div class="mb-sm custom-select">
          <select bind:value={date}>
            {#each Object.keys(agenda_list) as date}
              <option>{date}</option>
            {/each}
          </select>
        </div>
      {/if}

      {#if date}
        <div class="mb-sm custom-select">
          <select bind:value={time} style="max-width: 100%;">
            {#each Object.keys(agenda_list[date]) as time}
              <option>{time}</option>
            {/each}
          </select>
        </div>
      {/if}

      {#if date && time}
        <div class="mb-sm custom-select">
          <select bind:value={item} style="max-width: 100%;">
            {#each Object.keys(agenda_list[date][time]) as item}
              <option value={item}>{agenda_list[date][time][item].name}</option>
            {/each}
          </select>
        </div>
      {/if}

      {#if date && time && item}
        
        <div class="preview-container">
          <div class="preview">
            <div class="title">{selected.name}</div>

            {#if selected.speakers}
              <div class="speakers">
                {#each Object.entries(selected.speakers) as [category, speaker_list]}
                  {#each speaker_list as {name, designation, organisation, photo, linkedin}}  
                    <div class="speaker">
                      
                        <div class="image">
                          <img src="{photo}" alt="name" class="">
                        </div>
                        <div class="details">
                          <div class="name">{name}</div>
                          <div class="designation">{designation}</div>
                          <div class="organisation">{organisation ?? ''}</div>
                        </div>

                    </div>
                  {/each}
                {/each}
              </div>
            {/if}

          </div>

          <div class="mb-sm">
            <button on:click={()=>{generate();}} class="button">Generate</button>
          </div>
        </div>

      {/if}
      
    </div>
  {/if}

</div>

<style>
  .base{
    font-size: 14px;
    font-weight: normal;
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 10px;
  }
  .mb-sm{
    margin-bottom: 10px;
  }
  .button {
    background-color: blue;
    color: white;
    padding: 3px 10px;
    font-size: 12px;
    border-radius: 9999px;
  }
  .wrapper {
    text-align: center;
    height: 100%;
  }

  input {
    width:100%;
    resize: vertical;
    padding: 5px 8px;
    border-radius:5px;
    border:0;
    box-shadow:4px 4px 10px rgba(0,0,0,0.06);
    border: 1px solid #caced1;
  }

  select {
    appearance: none;
    /* safari */
    -webkit-appearance: none;
    /* other styles for aesthetics */
    width: 100%;
    padding: 5px 8px;
    background-color: #fff;
    border: 1px solid #caced1;
    border-radius: 0.25rem;
    color: #000;
    cursor: pointer;
    outline: none;
  }

  .custom-select{
    position: relative;
  }

  .custom-select::before,
  .custom-select::after {
    --size: 0.3rem;
    position: absolute;
    content: "";
    right: 1rem;
    pointer-events: none;
  }

  .custom-select::before {
    border-left: var(--size) solid transparent;
    border-right: var(--size) solid transparent;
    border-bottom: var(--size) solid black;
    top: 40%;
  }

  .custom-select::after {
    border-left: var(--size) solid transparent;
    border-right: var(--size) solid transparent;
    border-top: var(--size) solid black;
    top: 55%;
  }

  .preview{
    padding: 10px;
    margin-bottom: 10px;
    background-color: #f0eded;
    border-radius: 10px;
  }

  .preview .title{
      margin-bottom: 10px;
  }

  .preview .speakers{
    display: flex;
    gap: 5px;
    flex-direction: column;
  }

  .preview .speaker{
    display: flex;
    flex-direction: row;
    gap: 5px;
    align-items: center;
  }

  .preview .speaker .image{
    flex-shrink: 0;
  }

  .preview .speaker .image img{
    border-radius: 100%;
    width: 75px;
    height: 75px;
  }

  .preview .speaker .details{
    font-weight: normal;
    font-size: 12px;
    text-align: left;
  }

  .preview-container{
    margin-bottom: 10px;
  }
</style>
