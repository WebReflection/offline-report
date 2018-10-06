module.exports = (render, info) => {
  return render`<input
    id="user"
    name="user"
    autofocus=${info.autofocus}
    value=${info.value}
    placeholder=${info.placeholder}
    onkeydown=${info.onkeydown}
    onkeyup=${info.onkeyup}
    autocorrect="off"
    autocapitalize="off"
    spellcheck="false"
  />`;
};
