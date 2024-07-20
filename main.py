import os
import base64
import logging
from telethon import TelegramClient
from telethon.sessions import StringSession
from github import Github, InputGitTreeElement

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_REPO = os.getenv("GITHUB_REPO")
API_ID = os.getenv("TELEGRAM_API_ID")
API_HASH = os.getenv("TELEGRAM_API_HASH")
SESSION_STRING = os.getenv("TELEGRAM_SESSION_STRING")
CHANNEL_USERNAME = os.getenv("TELEGRAM_CHANNEL_USERNAME")
MESSAGE_LIMIT = os.getenv("MESSAGE_LIMIT")

# initial Telegram & github client
client = TelegramClient(StringSession(SESSION_STRING), API_ID, API_HASH)
g = Github(GITHUB_TOKEN)
repo = g.get_repo(GITHUB_REPO)


def custom_filename(message, file_path):
    _, ext = os.path.splitext(file_path)
    date_str = message.date.strftime("%Y%m%d%H%M%S")
    return f"{message.id}_{date_str}{ext}"


async def process_message_group(messages):
    first_message = messages[0]
    date = first_message.date.strftime("%Y-%m-%d")
    msg_time = first_message.date.strftime("%Y-%m-%d %H:%M:%S")

    content = f"# {msg_time}\n\n{first_message.text or ""}\n\n"
    media_files = []

    for message in messages:
        if not message.text and not message.media:
            continue
        if message.media:
            if not message.photo:
                continue
            fn = str(message.file.name)
            path = await message.download_media(file=custom_filename(message, fn))
            if not path:
                continue
            media_filename = f"{message.id}_{os.path.basename(path)}"
            media_files.append((f"{date}/media/{media_filename}", path))
            content += f"![Media](./media/{media_filename})\n\n"

    return date, content, media_files


async def main():
    async with client:
        messages = await client.get_messages(
            CHANNEL_USERNAME, limit=int(MESSAGE_LIMIT or 5)
        )
        updates = {}
        message_group = []

        for message in reversed(messages):
            if not message_group or (
                message.grouped_id
                and message.grouped_id == message_group[-1].grouped_id
            ):
                message_group.append(message)
            else:
                date, content, media_files = await process_message_group(message_group)
                if not (content or media_files):
                    continue
                if date not in updates:
                    updates[date] = {"content": [], "media": []}
                updates[date]["content"].append(content)
                updates[date]["media"].extend(media_files)
                message_group = [message]

        if message_group:
            date, content, media_files = await process_message_group(message_group)
            if date not in updates:
                updates[date] = {"content": [], "media": []}
            updates[date]["content"].append(content)
            updates[date]["media"].extend(media_files)

        master_ref = repo.get_git_ref(f"heads/{repo.default_branch}")
        master_sha = master_ref.object.sha
        base_tree = repo.get_git_tree(master_sha)
        element_list = []

        for date, data in updates.items():
            # 合并当天的所有内容
            full_content = "\n---\n".join(data["content"])
            file_path = f"{date}/readme.md"
            element_list.append(
                InputGitTreeElement(file_path, "100644", "blob", full_content)
            )

            for media_path, local_path in data["media"]:
                with open(local_path, "rb") as file:
                    data = base64.b64encode(file.read())
                    blob = repo.create_git_blob(data.decode("utf-8"), "base64")
                    element_list.append(
                        InputGitTreeElement(media_path, "100644", "blob", sha=blob.sha)
                    )
                os.remove(local_path)

        tree = repo.create_git_tree(element_list, base_tree)
        parent = repo.get_git_commit(master_sha)
        commit = repo.create_git_commit(
            f"Update for {', '.join(updates.keys())}", tree, [parent]
        )
        master_ref.edit(commit.sha)

        logging.info(
            f"Successfully updated repository with changes for dates: {', '.join(updates.keys())}"
        )


with client:
    client.loop.run_until_complete(main())
