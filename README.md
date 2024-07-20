# Telegram to GitHub Sync

This repository automatically syncs content from a specified Telegram channel to this GitHub repository, creating a searchable and version-controlled archive of the channel's messages.

## Setup

To set up your own Telegram to GitHub sync:

1. Fork this repository.
2. Create a Telegram bot and get the bot token.
3. Set up GitHub Actions with the necessary secrets:
   - `TELEGRAM_API_ID`
   - `TELEGRAM_API_HASH`
   - `TELEGRAM_SESSION_STRING`
   - `TELEGRAM_CHANNEL_USERNAME`
4. Customize the `main.py` file if needed.
5. Enable GitHub Actions in your forked repository.

## Contributing

Contributions to improve the sync script or documentation are welcome! Please feel free to submit a pull request or open an issue for any bugs or feature requests.


## Disclaimer

This tool is not officially associated with Telegram or GitHub. Use it responsibly and in compliance with Telegram's terms of service and GitHub's usage policies.
