const url = 'https://drive.google.com/uc?export=download&id=1WpO5Z8fHy0JSJ5ssRT4oFQvxhtek8540&confirm=t';

fetch(url, { redirect: 'follow' })
  .then(res => res.text())
  .then(text => {
    // console.log(text.substring(0, 1000));
    const matches = text.match(/confirm=([a-zA-Z0-9_-]+)/g);
    console.log('Matches:', matches);
  })
  .catch(console.error);
