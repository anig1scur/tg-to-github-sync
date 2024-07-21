# Telegram to GitHub Sync

This repository automatically syncs content from a specified Telegram channel to this GitHub repository, creating a searchable and version-controlled archive of the channel's messages.

## Setup

### 1. Telegram to GitHub sync

1. Fork this repository.
2. Create a Telegram login session and get the SESSION_STRING: https://github.com/ShivangKakkar/StringSessionBot
3. Set up GitHub Actions with the necessary secrets:
   - `TELEGRAM_API_ID`
   - `TELEGRAM_API_HASH`
   - `TELEGRAM_SESSION_STRING`
   - `TELEGRAM_CHANNEL_USERNAME`
4. Customize the `main.py` file if needed.
5. Enable GitHub Actions in your forked repository.

### 2. IFTTT

cause the github actions doesn't really work in cron situation. We need ifttt to add a comment triggering it. 

[If New post in Telegram Channel, then create a comment for one repo](https://ifttt.com/applets/Ed3eDvEU-if-new-post-in-channel-capricious_eunice-eunice-in-caprice-then-create-a-comment)


## Contributing

Contributions to improve the sync script or documentation are welcome! Please feel free to submit a pull request or open an issue for any bugs or feature requests.


## Disclaimer

This tool is not officially associated with Telegram or GitHub. Use it responsibly and in compliance with Telegram's terms of service and GitHub's usage policies.
