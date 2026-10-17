// Jest stand-in for the ESM-only icon package: every named icon is a component
// that renders nothing.
const Icon = () => null;
module.exports = new Proxy({ __esModule: true }, { get: (target, name) => (name in target ? target[name] : Icon) });
