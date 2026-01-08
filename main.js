import Base64 from 'base64-js';
import MarkdownIt from 'markdown-it';
import './style.css';

let form = document.querySelector('form');
let promptInput = document.querySelector('input[name="prompt"]');
let output = document.querySelector('.output');

form.onsubmit = async (ev) => {
  ev.preventDefault();
  output.textContent = 'Generating...';

  try {
    // Load the image as a base64 string
    let imageUrl = form.elements.namedItem('chosen-image').value;
    let imageBase64 = await fetch(imageUrl)
      .then(r => r.arrayBuffer())
      .then(a => Base64.fromByteArray(new Uint8Array(a)));

    // Call the backend API
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: promptInput.value,
        imageBase64: imageBase64,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Read the streamed response from the backend
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = [];
    let md = new MarkdownIt();

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      const chunk = decoder.decode(value, { stream: true });
      buffer.push(chunk);
      output.innerHTML = md.render(buffer.join(''));
    }

  } catch (e) {
    output.innerHTML = `ApiError: ${e.toString().replaceAll('<', '&lt;')}`;
  }
};
