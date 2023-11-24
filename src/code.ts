figma.showUI(__html__, { width: 320, height: 350 })

figma.ui.onmessage = (msg) => {
  const { type, selected } = msg

  if (type === `GENERATE`) {
    generateBackdrop(selected);
  }

}

let HEADING_SIZE = 100;
let SPEAKER_IMAGE_SIZE = 250;
let SPEAKER_CONTENT_SIZE = 400;

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

  const speaker_name = generateText(speaker.name, 'Poppins', 'Bold', 30);
  const speaker_designation = generateText(speaker.designation, 'Poppins', 'Regular', 25);
  const speaker_organisation = generateText(speaker.organisation, 'Poppins', 'Regular', 25);

  const speaker_item = generateSpeakerGroup([speaker_image, speaker_name, speaker_designation, speaker_organisation]);

  return speaker_item;

}

function generateSpeakerGroup(items){

  const speaker_group = figma.createFrame();

  speaker_group.resize(SPEAKER_CONTENT_SIZE, SPEAKER_CONTENT_SIZE);

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
  textNode.resize(SPEAKER_CONTENT_SIZE, textNode.height);

  return textNode;

}

async function generateSpeakerImage(frame, speaker){

  const image = await figma.createImageAsync(speaker.photo);

  const speaker_image = figma.createEllipse();

  speaker_image.resize(SPEAKER_IMAGE_SIZE, SPEAKER_IMAGE_SIZE);

  speaker_image.fills = [
    {
      type : 'IMAGE',
      imageHash: image.hash,
      scaleMode: 'FILL'
    }
  ];

  return speaker_image;

}

async function generateHeading(frame, agenda){

  let canvas_width = frame.width;
  let canvas_height = frame.height;

  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Poppins', style: 'Bold' });
  await figma.loadFontAsync({ family: 'Poppins', style: 'Regular' });
  
  const heading = figma.createText();
  heading.characters = agenda.name;
  heading.fontSize = HEADING_SIZE;
  heading.textAlignHorizontal = 'CENTER';
  
  let heading_width = heading.width;
  let heading_height = heading.height;

  heading.fontName = { family: "Poppins", style: 'Bold'};

  if(heading_width > canvas_width){
    heading.fontSize = HEADING_SIZE * 0.75;
    heading.resize( canvas_width * 0.8, heading.height );
    heading_width = heading.width;
    heading_height = heading.height;

    // console.log(heading_height);

    if(heading_height > 250){
      heading.fontSize = HEADING_SIZE * 0.5;
      heading.resize( canvas_width * 0.8, heading.height );

      heading_width = heading.width;
      heading_height = heading.height;
    }
  }

  return heading;

}