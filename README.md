# Telegram to GitHub Sync

This repository automatically syncs content from a specified Telegram channel to this GitHub repository, creating a searchable and version-controlled archive of the channel's messages.

## Features

- Real-time synchronization of Telegram channel messages to GitHub
- Chronological ordering of messages in a Markdown file
- Automated updates using GitHub Actions
- Easy to set up and customize

## How It Works

1. A Telegram bot listens to new messages in the specified channel.
2. When a new message is posted, the bot captures the content.
3. The content is then formatted and appended to a Markdown file in this repository.
4. The update is committed and pushed to GitHub, maintaining a running log of all channel messages.

## Setup

To set up your own Telegram to GitHub sync:

1. Fork this repository.
2. Create a Telegram bot and get the bot token.
3. Set up GitHub Actions with the necessary secrets:
   - `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
   - `GITHUB_TOKEN`: A GitHub personal access token with repo permissions
4. Customize the `sync_script.py` file if needed.
5. Enable GitHub Actions in your forked repository.

For detailed setup instructions, please refer to the [Setup Guide](setup_guide.md).

## Configuration

You can configure the sync behavior by modifying the following files:

- `.github/workflows/sync_telegram.yml`: Adjust the cron schedule for sync frequency
- `sync_script.py`: Customize how messages are formatted and stored

## Contributing

Contributions to improve the sync script or documentation are welcome! Please feel free to submit a pull request or open an issue for any bugs or feature requests.


## Disclaimer

This tool is not officially associated with Telegram or GitHub. Use it responsibly and in compliance with Telegram's terms of service and GitHub's usage policies.
