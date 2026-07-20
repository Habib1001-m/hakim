# Install Hakim

Hakim is currently distributed from source and local build artifacts.

Clone the repository and validate it:

```bash
git clone https://github.com/Habib1001-m/hakim.git
cd hakim
npm test
```

Build the canonical skill package:

```bash
npm run package:skill
```

Build the native plugin package:

```bash
npm run build:native-plugin
```

Use the installation and trust controls provided by the selected host. Hakim
does not bypass host-native approval, sandboxing, hook trust, or permission
controls.

No npm package or marketplace extension is currently published.
