# Speech Bubbles Plugin for Obsidian

An Obsidian plugin that renders transcript notes as message app style speech bubbles, similar to Apple Messages.

<img width="40%" alt="editing mode" src="https://github.com/user-attachments/assets/d7fb7f2d-456c-41c3-af14-e97cd658bd6f" />
<img width="40%" alt="reading mode" src="https://github.com/user-attachments/assets/8a62de27-1742-424c-8f58-20e0ec53a9ea" />

## Features

- Renders transcript lines as speech bubbles
- Different colors for different speakers
- Right-aligned bubbles for the vault owner (configurable)
- Support for multiple speaker aliases
- **Per-speaker custom colors and icons** via frontmatter
- **Inline timestamps** for messages
- **Date separators** between conversation days
- **Speaker groups/sides** for roleplay and D&D scenarios
- **Customizable appearance** (bubble width, radius, compact mode)

## Usage

1. Format your transcript notes with lines like:

   ```
   [[Speaker Name]]: Message text
   ```

2. Add the `transcript` tag to the note frontmatter to enable bubbles in Reading view.

   ```yaml
   ---
   tags: [transcript]
   ---
   ```

3. Switch to Reading view to see the bubbles.

### Basic example

```markdown
[[John Smith]]: Hello!
[[me]]: Hi there!
[[John Smith]]: How are you doing?
[[me]]: I'm doing great, thanks for asking!
```

### Timestamps

Add timestamps to messages using `[HH:MM]` or `[HH:MM:SS]` format after the speaker name:

```markdown
[[John]] [14:32]: Hello!
[[me]] [14:33]: Hi there!
[[John]] [14:35]: How's it going?
```

### Date separators

Add visual date separators between conversation days:

```
--- 2024-01-15 ---
[[John]]: Hello!
[[me]]: Hi!

--- 2024-01-16 ---
[[John]]: Following up on yesterday...
```

Supported formats:

- `--- YYYY-MM-DD ---` (e.g., `--- 2024-01-15 ---`)
- `--- Month Day, Year ---` (e.g., `--- January 15, 2024 ---`)

### Per-speaker customization

Customize individual speakers with colors and icons via frontmatter:

```yaml
---
tags: [transcript]
speech-bubbles:
  speakers:
    Gandalf: "#9CA3AF" # Simple color format
    Frodo:
      color: "#34D399" # Object format with color
      icon: "🧙" # Emoji icon
    Sauron:
      color: "#EF4444"
      icon: "[[avatars/eye.png]]" # Vault image as icon
---
[[Gandalf]]: You shall not pass!
[[Frodo]]: But I must destroy the ring...
[[Sauron]]: I see you...
```

### Speaker groups/sides

For D&D, debates, or roleplay scenarios, assign speakers to left or right sides regardless of the owner setting:

```yaml
---
tags: [transcript]
speech-bubbles:
  sides:
    left: ["Gandalf", "Frodo", "Aragorn"] # Party members
    right: ["Sauron", "Saruman"] # Villains
---
[[Gandalf]]: The fellowship must continue.
[[Sauron]]: Your quest is futile.
[[Frodo]]: We will not give up.
```

## Settings

### Identity

- **Your name**: The name used in transcripts to identify you. Messages from this person will appear on the right side with blue bubbles (default: "me").
- **Aliases**: Other names that should also be treated as you (comma-separated).

### Appearance

- **Maximum bubble width**: Maximum width of speech bubbles as a percentage (10-100%, default: 75%).
- **Bubble corner radius**: Corner radius of speech bubbles in pixels (0-30px, default: 18px).
- **Show speaker names**: Display the speaker name above each bubble (default: on).
- **Compact mode**: Use smaller spacing and font sizes for a more compact layout.
- **Your bubble color**: Custom hex color for your speech bubbles (leave empty for default indigo).

### Debug

- **Enable debug logging**: Logs toggle and render details to the developer console for troubleshooting.

## Complete example

```markdown
---
tags: [transcript]
speech-bubbles:
  speakers:
    DM:
      color: "#8B5CF6"
      icon: "🎲"
    Gandalf:
      color: "#9CA3AF"
      icon: "🧙"
    Frodo:
      color: "#34D399"
  sides:
    left: ["DM"]
    right: ["Gandalf", "Frodo"]
---

--- January 15, 2024 ---

[[DM]] [19:00]: Welcome to Middle-earth! You find yourselves at the gates of Moria.
[[Gandalf]] [19:01]: I remember this place... the doors are hidden.
[[Frodo]] [19:02]: What's the password?
[[DM]] [19:03]: Roll an Intelligence check.

--- January 16, 2024 ---

[[DM]] [19:00]: Last session, you entered Moria...
```

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
yarn install

# Build for production
yarn build

# Development mode with watch
yarn dev:watch
```

## My other plugins

- [Food Tracker](https://github.com/forketyfork/obsidian-food-tracker): Track calories, macros, and nutrition totals with database and inline entries.
- [YouTrack Fetcher](https://github.com/forketyfork/obsidian-youtrack-fetcher): Fetch YouTrack issues into structured notes with templates.
- [Grazie Plugin](https://github.com/forketyfork/obsidian-grazie-plugin): Grammar and spell checking powered by JetBrains AI Platform (in development).

## License

MIT
