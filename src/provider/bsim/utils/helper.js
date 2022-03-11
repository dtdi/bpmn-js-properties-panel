import { useService } from "../../../hooks";

export function getProperty(property, type) {
  const moddle = useService("moddle");

  if (!type) {
    type = this.elemStr;
  }

  if (!property) {
    return moddle.getTypeDescriptor(type);
  }
  const Type = moddle.getType(type);
  return moddle.getPropertyDescriptor(Type, property);
}

export function getDescr(property, type) {
  return getMetaProp(property, type, "description");
}

export function getMetaProp(property, type, value) {
  const meta = getProperty(property, type)?.meta || {};
  return meta[value] || null;
}

export function getName(property, type) {
  return (
    getMetaProp(property, type, "displayName") ||
    property // insert a space before all caps
      .replace(/([A-Z])/g, " $1")
      // uppercase the first character
      .replace(/^./, function (str) {
        return str.toUpperCase();
      })
  );
}
