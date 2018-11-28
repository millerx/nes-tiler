/** Returns an array of all child elements. */
exports.getChildElements = function (elem) {
  const children = [];
  let child = elem.firstElementChild;
  if (child) {
    do {
      children.push(child);
    } while (child = child.nextElementSibling);
  }
  return children;
}
