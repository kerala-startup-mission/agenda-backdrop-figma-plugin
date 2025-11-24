figma.showUI(__html__, { width: 320, height: 400 })

figma.ui.onmessage = (msg) => {
  const { type, data } = msg

  if (type === `GENERATE`) {
    generateBackdrop(data);
  }

  if (type === 'GENERATE_MULTIPLE'){
    generateMultipleBackdrop(data);
  }

  if (type === `SETTINGS`) {
    saveSettings(data);
  }

  if (type === `EVENT`) {
    saveEvent(data);
  }

  if (type === `DEFAULT`){

    settings = default_settings;

    figma.ui.postMessage({
      type: "settings",
      data: default_settings
    });

  }

}

let settings = {};

let default_settings = {
  HEADING_SIZE : 100,
  SPEAKER_IMAGE_SIZE : 250,
  SPEAKER_CONTENT_SIZE : 400,
  SPEAKER_STROKE_COLOR : "#C70000",
  SPEAKER_IMAGE_TYPE : 'BR',
  SPEAKER_STROKE_WIDTH : 5,
  NAME_FONT_SIZE: 30,
  CONTENT_FONT_SIZE: 25,
}

// let HEADING_SIZE = 100;
// let SPEAKER_IMAGE_SIZE = 250;
// let SPEAKER_CONTENT_SIZE = 400;
// let SPEAKER_STROKE_COLOR = "#C70000";
// let SPEAKER_IMAGE_TYPE = 'BR';
// let SPEAKER_STROKE_WIDTH = 5;

init();

async function init(){
  await loadSettings();

  let event = await loadEvent();

  figma.ui.postMessage({
    type: "settings",
    data: settings
  });

  figma.ui.postMessage({
    type: "event",
    data: event
  });

}

async function loadEvent(){

  let saved_event = await figma.clientStorage.getAsync('event');

  if(saved_event){
    return saved_event;
  }
  else{
    return "huddle-global-2023";
  }

}

async function saveEvent(data){
  figma.clientStorage.setAsync('event', data);
}

async function loadSettings(){

  let saved_settings = await figma.clientStorage.getAsync('settings');

  if(saved_settings){
    settings = JSON.parse(saved_settings);
  }
  else{
    settings = default_settings;
  }

}

async function saveSettings(data){
  figma.clientStorage.setAsync('settings', JSON.stringify(data));
  settings = data;
}

async function generateMultipleBackdrop(agenda_list){

  if(figma.currentPage.selection.length <= 0){
    alert('Please select a frame');
    return;
  }

  var frame = figma.currentPage.selection[0];

  if(typeof frame?.children === 'undefined'){
    alert('Please select a frame');
    return;
  }

  // console.log(frame);

  const { x, y, width, height } = frame;

  const cols = 10;
  const rows = 10;
  const spacing = 50;

  const actual_rows = Math.ceil(agenda_list.length / cols);

  var repeater = figma.createFrame();

  repeater.fills = [];

  // Auto Layout grid with wrap
  repeater.layoutMode = "HORIZONTAL";
  repeater.layoutWrap = "WRAP";
  repeater.primaryAxisAlignItems = "CENTER";
  repeater.counterAxisAlignItems = "CENTER";
  repeater.itemSpacing = spacing;
  repeater.counterAxisSpacing = spacing;
  repeater.paddingLeft = 0;
  repeater.paddingRight = 0;
  repeater.paddingTop = 0;
  repeater.paddingBottom = 0;

  // Fix the container size so wrap respects our exact cols/rows
  repeater.primaryAxisSizingMode = "FIXED";
  repeater.counterAxisSizingMode = "FIXED";

  const targetWidth  = width  * cols + spacing * (cols - 1);
  const targetHeight = height * actual_rows + spacing * (actual_rows - 1);
  repeater.resize(targetWidth, targetHeight);

  repeater.x = x + width + 10;
  repeater.y = y + height;

  for(var i = 0; i < agenda_list.length; i++){

    const agenda = agenda_list[i];

    const agenda_group = figma.createFrame();

    agenda_group.fills = [];
  
    const heading = await generateHeading(frame, agenda);
    agenda_group.appendChild(heading);

    if(Object.keys(agenda.speakers).length){
      const speaker_layout = await generateSpeakers(frame, agenda);    
      agenda_group.appendChild(speaker_layout);
    }

    agenda_group.layoutMode = 'VERTICAL';
    agenda_group.primaryAxisAlignItems = 'CENTER';
    agenda_group.counterAxisAlignItems = 'CENTER';
    agenda_group.itemSpacing = 50;

    agenda_group.resize(width, height);

    // console.log(agenda_group.fills);

    const group = frame.clone();

    group.appendChild(agenda_group);
    
    repeater.appendChild(group);

  }

  const parent = frame.parent as (PageNode | FrameNode | ComponentNode);

  parent.appendChild(repeater);

}

async function generateBackdrop(agenda){

  if(figma.currentPage.selection.length <= 0){
    alert('Please select a frame');
    return;
  }

  var frame = figma.currentPage.selection[0];

  if(typeof frame?.children === 'undefined'){
    alert('Please select a frame');
    return;
  }

  // console.log(frame);

  let canvas_width = frame.width;
  let canvas_height = frame.height;

  // console.log(canvas_width, canvas_height);

  const agenda_group = figma.createFrame();
  
  const heading = await generateHeading(frame, agenda);
  agenda_group.appendChild(heading);

  if(agenda.speakers){
    const speaker_layout = await generateSpeakers(frame, agenda);    
    agenda_group.appendChild(speaker_layout);
  }

  agenda_group.layoutMode = 'VERTICAL';
  agenda_group.primaryAxisAlignItems = 'CENTER';
  agenda_group.counterAxisAlignItems = 'CENTER';
  agenda_group.itemSpacing = 50;

  agenda_group.resize(canvas_width, canvas_height);

  agenda_group.fills = [];

  // console.log(agenda_group.fills);
  
  frame.appendChild(agenda_group);

}

async function generateSpeakers(frame, agenda){

  var speakers = Object.values(agenda.speakers).flat();

  const speaker_layout = figma.createFrame();

  speakers.forEach(async (speaker) => {
    const speaker_item = await generateSpeaker(frame, speaker);

    speaker_layout.appendChild(speaker_item);
  });

  speaker_layout.layoutMode = 'HORIZONTAL';
  speaker_layout.primaryAxisAlignItems = 'CENTER';
  speaker_layout.counterAxisAlignItems = 'MIN';

  speaker_layout.layoutWrap = 'WRAP';

  speaker_layout.itemSpacing = 25;
  speaker_layout.counterAxisSpacing = 25;

  speaker_layout.resize(frame.width * 0.9 , frame.height * 0.9);

  speaker_layout.layoutSizingVertical = 'HUG';
  speaker_layout.fills = [];

  return speaker_layout;
}

async function generateSpeaker(frame, speaker){

  // console.log(speaker);

  const speaker_image = await generateSpeakerImage(frame, speaker);

  const speaker_name = generateText(speaker.name, 'Poppins', 'Bold', settings.NAME_FONT_SIZE);
  const speaker_designation = generateText(speaker.designation, 'Poppins', 'Regular', settings.CONTENT_FONT_SIZE);
  const speaker_organisation = generateText(speaker.organisation, 'Poppins', 'Regular', settings.CONTENT_FONT_SIZE);

  const speaker_item = generateSpeakerGroup([speaker_image, speaker_name, speaker_designation, speaker_organisation]);

  return speaker_item;

}

function generateSpeakerGroup(items){

  const speaker_group = figma.createFrame();

  speaker_group.resize(settings.SPEAKER_CONTENT_SIZE, settings.SPEAKER_CONTENT_SIZE);

  items.forEach(item => {
    speaker_group.appendChild(item);    
  });

  speaker_group.layoutMode = 'VERTICAL';
  speaker_group.primaryAxisAlignItems = 'MIN';
  speaker_group.counterAxisAlignItems = 'CENTER';
  speaker_group.fills = [];

  return speaker_group;

}

function generateText(text, fontname, weight, size){

  const textNode = figma.createText();
  textNode.characters = text ?? " ";
  textNode.fontName = { family: fontname, style: weight};
  textNode.fontSize = size;
  textNode.textAlignHorizontal = 'CENTER';
  textNode.textAlignVertical = 'CENTER';
  textNode.textAutoResize = 'WIDTH_AND_HEIGHT';
  textNode.resize(settings.SPEAKER_CONTENT_SIZE, textNode.height);

  return textNode;

}

async function generateSpeakerImage(frame, speaker){

  const image = await figma.createImageAsync(speaker.photo);

  const speaker_image = figma.createRectangle();

  speakerImageDecoration(speaker_image);

  speaker_image.resize(settings.SPEAKER_IMAGE_SIZE, settings.SPEAKER_IMAGE_SIZE);

  speaker_image.fills = [
    figma.util.solidPaint('#FFFFFF'),
    {
      type : 'IMAGE',
      imageHash: image.hash,
      scaleMode: 'FILL'
    }
  ];

  return speaker_image;

}

function speakerImageDecoration(speaker_image){

  if(settings.SPEAKER_IMAGE_TYPE == "C"){
    speaker_image.cornerRadius = settings.SPEAKER_IMAGE_SIZE/2;
  }
  else if(settings.SPEAKER_IMAGE_TYPE == "CBR"){
    speaker_image.cornerRadius = settings.SPEAKER_IMAGE_SIZE/2;
    speaker_image.bottomRightRadius = 0;
  }
  else if(settings.SPEAKER_IMAGE_TYPE == "CBL"){
    speaker_image.cornerRadius = settings.SPEAKER_IMAGE_SIZE/2;
    speaker_image.bottomLeftRadius = 0;
  }
  else if(settings.SPEAKER_IMAGE_TYPE == "BR"){
    speaker_image.cornerRadius = settings.SPEAKER_IMAGE_SIZE * 0.2;
    speaker_image.bottomRightRadius = 0;
  }
  else if(settings.SPEAKER_IMAGE_TYPE == "BL"){
    speaker_image.cornerRadius = settings.SPEAKER_IMAGE_SIZE * 0.2;
    speaker_image.bottomLeftRadius = 0;
  }

  speaker_image.strokes = [
    figma.util.solidPaint(settings.SPEAKER_STROKE_COLOR)
  ]

  speaker_image.strokeWeight = settings.SPEAKER_STROKE_WIDTH;

}

async function generateHeading(frame, agenda){

  let canvas_width = frame.width;
  let canvas_height = frame.height;

  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Poppins', style: 'Bold' });
  await figma.loadFontAsync({ family: 'Poppins', style: 'Regular' });
  
  const heading = figma.createText();
  heading.characters = agenda.name;
  heading.fontSize = settings.HEADING_SIZE;
  heading.textAlignHorizontal = 'CENTER';
  
  let heading_width = heading.width;
  let heading_height = heading.height;

  heading.fontName = { family: "Poppins", style: 'Bold'};

  if(heading_width > canvas_width){
    heading.fontSize = settings.HEADING_SIZE * 0.75;
    heading.resize( canvas_width * 0.8, heading.height );
    heading_width = heading.width;
    heading_height = heading.height;

    // console.log(heading_height);

    if(heading_height > 250){
      heading.fontSize = settings.HEADING_SIZE * 0.5;
      heading.resize( canvas_width * 0.8, heading.height );

      heading_width = heading.width;
      heading_height = heading.height;
    }
  }

  return heading;

}