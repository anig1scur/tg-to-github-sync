# Telegram to GitHub Sync

This repository automatically syncs content from a specified Telegram channel to this GitHub repository, creating a version-controlled archive of the channel's messages with a cute self-hosted website.

## Setup

### 1. Telegram to GitHub sync

1. Fork this repository
2. Create a Telegram login session to get the `SESSION_STRING` by [StringSessionBot](https://github.com/ShivangKakkar/StringSessionBot) or any other ways, and get `API_ID`D and `API_HASH` from https://my.telegram.org/auth?to=apps
3. Set up GitHub Actions with the necessary Repository secrets:
   - `TELEGRAM_API_ID`
   - `TELEGRAM_API_HASH`
   - `TELEGRAM_SESSION_STRING`
4. Set up these Repository variables:
   - `TELEGRAM_CHANNEL_USERNAME`
   - `DAY_LIMIT`
     - default `7`, you may limit it for faster sync
5. Customize the `main.py` file if needed
6. Enable GitHub Actions in your forked repository

### 2. IFTTT

cause the github actions doesn't really work in cron situation. We need ifttt to add a comment triggering it.

[If New post in Telegram Channel, then create a comment for one repo](https://ifttt.com/applets/Ed3eDvEU-if-new-post-in-channel-capricious_eunice-eunice-in-caprice-then-create-a-comment)

## Contributing

Contributions to improve the sync script or documentation are welcome! Please feel free to submit a pull request or open an issue for any bugs or feature requests.

## Disclaimer

This tool is not officially associated with Telegram or GitHub. Use it responsibly and in compliance with Telegram's terms of service and GitHub's usage policies.
