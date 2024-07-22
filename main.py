import os
import re
import json
import pytz
import base64
import logging
import imagesize
from datetime import datetime, timedelta
from telethon import TelegramClient
from telethon.sessions import StringSession
from github import Github, InputGitTreeElement, GithubException


logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)


GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_REPO = os.getenv("GITHUB_REPO")
GITHUB_BRANCH = "gh-pages"
GITHUB_FOLDER = "assets/channel/"

API_ID = os.getenv("TELEGRAM_API_ID")
API_HASH = os.getenv("TELEGRAM_API_HASH")
SESSION_STRING = os.getenv("TELEGRAM_SESSION_STRING")
CHANNEL_USERNAME = os.getenv("TELEGRAM_CHANNEL_USERNAME")
TIME_ZONE = "Asia/Shanghai"
py_time_zone = pytz.timezone(TIME_ZONE)
# initial Telegram & github client
client = TelegramClient(StringSession(SESSION_STRING), API_ID, API_HASH)
g = Github(GITHUB_TOKEN)
repo = g.get_repo(GITHUB_REPO)


def extract_tags(text):
    if not text:
        return text, []

    if "\n" not in text:
        tags = re.findall(r"#(\w+)", text) or []
        return text, tags

    last_line = text.strip().split("\n")[-1]
    tags = re.findall(r"#(\w+)", last_line) or []
    if tags:
        text = "\n".join(text.strip().split("\n")[:-1])
    return text, tags


def custom_filename(message, file_path):
    _, ext = os.path.splitext(file_path)
    date_str = message.date.strftime("%Y%m%d%H%M%S")
    return f"{message.id}_{date_str}{ext}"


async def get_messages_in_range(client, channel, start_date, end_date, limit=None):
    messages = []

    if start_date > end_date:
        start_date, end_date = end_date, start_date

    async for message in client.iter_messages(
        channel, limit=limit, offset_date=start_date, reverse=True
    ):
        if message.date < start_date:
            break
        if start_date <= message.date <= end_date:
            messages.append(message)

    return messages


async def process_message_group(messages):
    print("Processing message group", messages)
    first_message = messages[0]
    utc_date = first_message.date
    local_date = utc_date.replace(tzinfo=pytz.utc).astimezone(py_time_zone)

    date = local_date.strftime("%Y-%m-%d")
    msg_time = local_date.strftime("%Y-%m-%d %H:%M:%S")

    group_data = {
        "id": first_message.id,
        "created_at": msg_time,
        "date": date,
        "text": "",
        "photos": [],
        "tags": set(),
        "quoted_message": None,
    }
    media_files = []

    for message in messages:
        text = message.text or ""
        media = message.media

        if not text and not media:
            continue

        text, tags = extract_tags(text)
        group_data["tags"].update(tags)
        group_data["text"] = "\n".join([group_data["text"], text]).strip()

        if media:
            if not message.file:
                continue
            fn = str(message.file.name)
            path = await message.download_media(file=custom_filename(message, fn))
            if path:
                width, height = imagesize.get(path)
                media_files.append((f"{date}/{path}", path))
                group_data["photos"].append(
                    {"path": path, "width": width, "height": height, "id": message.id}
                )

        if (
            group_data["quoted_message"] is None
            and hasattr(message, "reply_to")
            and message.reply_to
        ):
            try:
                replied_msg = await message.get_reply_message()
                if replied_msg:
                    replied_local_date = replied_msg.date.replace(
                        tzinfo=pytz.utc
                    ).astimezone(py_time_zone)
                    group_data["quoted_message"] = {
                        "id": replied_msg.id,
                        "text": (
                            getattr(replied_msg, "message", "")[:100] + "..."
                            if getattr(replied_msg, "message", "")
                            and len(getattr(replied_msg, "message", "")) > 100
                            else (getattr(replied_msg, "message", "") or "")
                        ),
                        "sender": str(replied_msg.sender_id),
                        "date": replied_local_date.strftime("%Y-%m-%d %H:%M:%S"),
                    }
            except Exception as e:
                logging.error(f"Error fetching replied message for {message.id}: {e}")

    group_data["tags"] = sorted(list(group_data["tags"]))
    group_data["photos"] = list(reversed(group_data["photos"]))

    return date, group_data, media_files


def ensure_branch_exists(repo, branch_name):
    try:
        repo.get_branch(branch_name)
    except GithubException:
        logging.info(f"Branch {branch_name} does not exist. Creating it...")
        sb = repo.get_branch(repo.default_branch)
        repo.create_git_ref(ref=f"refs/heads/{branch_name}", sha=sb.commit.sha)
        logging.info(f"Branch {branch_name} created successfully.")


def get_file_content(repo, path, branch):
    try:
        content = repo.get_contents(path, ref=branch)
        return json.loads(content.decoded_content.decode("utf-8"))
    except GithubException:
        return None


def content_changed(repo, file_path, new_content, branch):
    try:
        old_content = repo.get_contents(file_path, ref=branch)

        if isinstance(old_content.content, bytes):
            return old_content.content != new_content.encode()
        else:
            try:
                old_decoded = old_content.decoded_content.decode("utf-8")
            except UnicodeDecodeError:
                return True

            return old_decoded != new_content
    except Exception:
        return True


async def main():
    async with client:
        channel = await client.get_entity(CHANNEL_USERNAME)

        now = datetime.now(py_time_zone)
        start_date = (now - timedelta(days=3)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        end_date = now

        start_date_utc = start_date.astimezone(pytz.utc)
        end_date_utc = end_date.astimezone(pytz.utc)

        messages = await get_messages_in_range(
            client, channel, start_date_utc, end_date_utc
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
                date, group_data, media_files = await process_message_group(
                    message_group
                )
                if not (group_data["text"] or group_data["photos"]):
                    continue
                month = date[:7]  # 获取年月
                if month not in updates:
                    updates[month] = {"content": {}, "media": []}
                if date not in updates[month]["content"]:
                    updates[month]["content"][date] = []
                updates[month]["content"][date].append(group_data)
                updates[month]["media"].extend(media_files)
                message_group = [message]

        if message_group:
            date, group_data, media_files = await process_message_group(message_group)
            month = date[:7]
            if month not in updates:
                updates[month] = {"content": {}, "media": []}
            if date not in updates[month]["content"]:
                updates[month]["content"][date] = []
            updates[month]["content"][date].append(group_data)
            updates[month]["media"].extend(media_files)

        ensure_branch_exists(repo, GITHUB_BRANCH)
        branch_ref = repo.get_git_ref(f"heads/{GITHUB_BRANCH}")
        branch_sha = branch_ref.object.sha

        element_list = []
        for month, data in updates.items():
            # 更新每天的 JSON 文件
            for date, content in data["content"].items():
                file_path = f"{GITHUB_FOLDER}{month}/{date}/data.json"
                content_json = json.dumps(
                    content, ensure_ascii=False, separators=(",", ":")
                )
                if content_changed(repo, file_path, content_json, GITHUB_BRANCH):
                    element_list.append(
                        InputGitTreeElement(file_path, "100644", "blob", content_json)
                    )
                else:
                    logging.info(f"No changes in {file_path}. Skipping.")

            # 更新月度 data.json 文件
            monthly_file_path = f"{GITHUB_FOLDER}{month}/data.json"
            existing_monthly_data = (
                get_file_content(repo, monthly_file_path, GITHUB_BRANCH) or []
            )

            new_monthly_data = []
            for date in sorted(data["content"].keys()):
                new_monthly_data.extend(data["content"][date])

            combined_data = existing_monthly_data + new_monthly_data
            # 按 id 去重并排序
            combined_data = sorted(
                {item["id"]: item for item in combined_data}.values(),
                key=lambda x: x["id"],
                reverse=True,
            )
            monthly_content = json.dumps(
                combined_data, ensure_ascii=False, separators=(",", ":")
            )
            if content_changed(repo, monthly_file_path, monthly_content, GITHUB_BRANCH):
                element_list.append(
                    InputGitTreeElement(
                        monthly_file_path, "100644", "blob", monthly_content
                    )
                )
            else:
                logging.info(f"No changes in {monthly_file_path}. Skipping.")

            for media_path, local_path in data["media"]:
                with open(local_path, "rb") as file:
                    data = base64.b64encode(file.read())
                    blob = repo.create_git_blob(data.decode("utf-8"), "base64")
                    github_media_path = f"{GITHUB_FOLDER}{month}/{media_path}"
                    if content_changed(
                        repo, github_media_path, data.decode("utf-8"), GITHUB_BRANCH
                    ):
                        element_list.append(
                            InputGitTreeElement(
                                github_media_path, "100644", "blob", sha=blob.sha
                            )
                        )
                os.remove(local_path)

        if not element_list:
            logging.info("No new updates found. Skipping commit.")
            return

        base_tree = repo.get_git_tree(branch_sha)
        tree = repo.create_git_tree(element_list, base_tree)
        parent = repo.get_git_commit(branch_sha)
        commit = repo.create_git_commit(
            f"Update for {', '.join(updates.keys())}", tree, [parent]
        )
        branch_ref.edit(commit.sha)

        logging.info(
            f"Successfully updated repository with changes for months: {', '.join(updates.keys())}"
        )


with client:
    client.loop.run_until_complete(main())
