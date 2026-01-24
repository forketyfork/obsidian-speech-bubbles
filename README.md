# Speech Bubbles Plugin for Obsidian

An Obsidian plugin that renders transcription notes as message app style speech bubbles, similar to Apple Messages.

## Features

- Renders transcription lines as speech bubbles
- Different colors for different speakers
- Right-aligned bubbles for the vault owner (configurable)
- Toggle button to switch between normal and bubble view
- Support for multiple speaker aliases

## Usage

1. Format your transcription notes with lines like:
   ```
   [[Speaker Name]]: Message text
   ```

2. Click the message bubble icon (💬) in the ribbon or use the command palette ("Toggle Speech Bubbles View") to enable the bubble view.

3. Switch to Reading view to see the bubbles.

### Example

```markdown
[[John Smith]]: Hello!
[[me]]: Hi there!
[[John Smith]]: How are you doing?
[[me]]: I'm doing great, thanks for asking!
```

## Settings

- **Your name**: The name used in transcriptions to identify you. Messages from this person will appear on the right side with blue bubbles (default: "me").
- **Aliases**: Other names that should also be treated as you (comma-separated).

## Installation

### From Obsidian Community Plugins

1. Open Obsidian Settings
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "Speech Bubbles"
4. Install the plugin and enable it

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest release
2. Create a folder called `speech-bubbles` in your vault's `.obsidian/plugins/` directory
3. Copy the downloaded files into this folder
4. Reload Obsidian and enable the plugin in Settings > Community Plugins

## Development

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Development mode with watch
npm run dev
```

## License

MIT
