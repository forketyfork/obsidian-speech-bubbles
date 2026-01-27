# Speech Bubbles Plugin for Obsidian

An Obsidian plugin that renders transcript notes as message app style speech bubbles, similar to Apple Messages.

<img width="40%" alt="editing mode" src="https://github.com/user-attachments/assets/d7fb7f2d-456c-41c3-af14-e97cd658bd6f" />
<img width="40%" alt="reading mode" src="https://github.com/user-attachments/assets/8a62de27-1742-424c-8f58-20e0ec53a9ea" />

## Features

- Renders transcript lines as speech bubbles
- Different colors for different speakers
- Right-aligned bubbles for the vault owner (configurable)
- Support for multiple speaker aliases

## Usage

1. Format your transcript notes with lines like:

   ```
   [[Speaker Name]]: Message text
   ```

2. Add the `transcript` tag to the note frontmatter to enable bubbles in Reading view.

   ```
   ---
   tags: [transcript]
   ---
   ```

3. Switch to Reading view to see the bubbles.

### Example

```markdown
[[John Smith]]: Hello!
[[me]]: Hi there!
[[John Smith]]: How are you doing?
[[me]]: I'm doing great, thanks for asking!
```

## Settings

- **Your name**: The name used in transcripts to identify you. Messages from this person will appear on the right side with blue bubbles (default: "me").
- **Aliases**: Other names that should also be treated as you (comma-separated).
- **Enable debug logging**: Logs toggle and render details to the developer console for troubleshooting.

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

## My other plugins

- [Food Tracker](https://github.com/forketyfork/obsidian-food-tracker): Track calories, macros, and nutrition totals with database and inline entries.
- [YouTrack Fetcher](https://github.com/forketyfork/obsidian-youtrack-fetcher): Fetch YouTrack issues into structured notes with templates.
- [Grazie Plugin](https://github.com/forketyfork/obsidian-grazie-plugin): Grammar and spell checking powered by JetBrains AI Platform (in development).

## License

MIT
