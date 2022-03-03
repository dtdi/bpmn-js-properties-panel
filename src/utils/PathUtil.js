/**
 * Get path from model element and optional parent model element. Falls back to
 * returning null.
 *
 * @param {ModdleElement} moddleElement
 * @param {ModdleElement} [parentModdleElement]
 *
 * @returns {string[]|null}
 */
export function getPath(moddleElement, parentModdleElement) {
  if (moddleElement === parentModdleElement) {
    return null;
  }

  let path = [],
      parent;

  do {
    parent = moddleElement.$parent;

    if (!parent) {
      if (moddleElement.$instanceOf('bpmn:Definitions')) {
        break;
      } else {
        return null;
      }
    }

    path = [ ...getPropertyName(moddleElement, parent), ...path ];

    moddleElement = parent;

    if (parentModdleElement && moddleElement === parentModdleElement) {
      break;
    }
  } while (parent);

  return path;
}

/**
 * Get property name from model element and parent model element.
 *
 * @param {ModdleElement} moddleElement
 * @param {ModdleElement} parentModdleElement
 *
 * @returns {string[]}
 */
function getPropertyName(moddleElement, parentModdleElement) {
  for (let property of Object.values(parentModdleElement.$descriptor.propertiesByName)) {
    if (property.isMany) {
      if (parentModdleElement.get(property.name).includes(moddleElement)) {
        return [
          property.name,
          parentModdleElement.get(property.name).indexOf(moddleElement)
        ];
      }
    } else {
      if (parentModdleElement.get(property.name) === moddleElement) {
        return [ property.name ];
      }
    }
  }

  return [];
}

/**
 * @param {string} path
 * @param {string} [separator]
 *
 * @returns {(number|string)[]}
 */
export function pathParse(path, separator = '.') {
  return path.split(separator);
}

/**
 * @param {(number|string)[]} path
 * @param {string} [separator]
 *
 * @returns {string}
 */
export function pathStringify(path, separator = '.') {
  return path.join(separator);
}