const getButton = document.querySelector('#get');
const postButton = document.querySelector('#post');

getButton.addEventListener('click', () => {
  fetch('http://localhost:8080/feed/posts')
    // json from javascript engine, not from express
    // here json( notthing ) to parse json format into plain object
    // In express only. json({ a" "b"}) to make the plain object the json-type 
    .then(res => res.json())
    .then(res => console.log(res))
    .catch(e => console.log(e));
});

// Normally axios takes care of Content-Type : application/json in react.
postButton.addEventListener('click', () => {
  fetch('http://localhost:8080/feed/createPost', {
    method: 'POST',
  // because it does not have express engine, we can't use json({})
  // just use method, JSON.stringify({}) to make json file.
    body: JSON.stringify({
      title: 'A codepen post',
      content: 'Created via Codepen'
    }),
    headers: {
      // it is required to send content-type of request's data
      // because of setup " res.setHeader('Access-Control-Allow-Headers', 'Content-Type,       Authorization'); in the server side.
      'Content-Type': 'application/json'
    }
  })
  // json()
  .then(res => res.json())
  .then(res => console.log(res))
  .catch(e => console.log(e));
 
})