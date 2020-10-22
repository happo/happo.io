export default () => {
  const div = document.createElement('div');
  div.innerHTML = 'I am red';
  const wrapper = document.createElement('div');
  wrapper.appendChild(div);
  document.body.innerHTML = '';
  document.body.appendChild(wrapper);
  div.style.setProperty('--var', 'red');
};
