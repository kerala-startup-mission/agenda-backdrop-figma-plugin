<script lang="ts">
  import {onMount} from 'svelte';

  let agenda_list = [];
  let event_list = [];

  let date;
  let time;
  let item;

  let event = "huddle-global-2023";

  $:selected = agenda_list && date && time && item ? agenda_list[date][time][item] : {};

  async function loadData(){
    let data = await fetch(`https://events.startupmission.in/api/event/${event}/agenda/venue`).then(response => response.json());
    agenda_list = data.agenda;

    date = "";
    time = "";
    item = "";

    console.log(agenda_list);
  }

  function generate(){
    parent.postMessage({ pluginMessage: { type: 'GENERATE', selected: selected } }, '*');  
  }

  async function loadEvents(){
    let data = await fetch(`https://events.startupmission.in/api/events`).then(response => response.json());
    event_list = data;
    date = "";
    time = "";
    item = "";
  }

  onMount(()=>{
    loadEvents();
  })

</script>

<div class="p-xsmall wrapper flex column base">
  <div>
    
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
  .footer {
    border-top: 1px solid var(--silver);
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
