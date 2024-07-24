"""
ALL BY AI, NOT HUMAN
"""

import os
import re
import json
import pytz
import base64
import logging
import imagesize
import asyncio
from typing import List, Tuple, Dict, Any
from dataclasses import dataclass
from datetime import datetime, timedelta
from telethon import TelegramClient
from telethon.types import Message, Channel, PeerChannel, PeerChat, PeerUser
from telethon.sessions import StringSession
from github import Github, InputGitTreeElement, GithubException

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)


@dataclass
class Config:
    GITHUB_TOKEN: str
    GITHUB_REPO: str
    API_ID: str
    API_HASH: str
    SESSION_STRING: str
    CHANNEL_USERNAME: str
    GITHUB_BRANCH: str = "gh-pages"
    GITHUB_FOLDER: str = "assets/channel/"
    DAY_LIMIT: int = 7
    TIME_ZONE: str = "Asia/Shanghai"


config = Config(
    GITHUB_TOKEN=os.getenv("GITHUB_TOKEN"),
    GITHUB_REPO=os.getenv("GITHUB_REPO"),
    API_ID=os.getenv("TELEGRAM_API_ID"),
    API_HASH=os.getenv("TELEGRAM_API_HASH"),
    SESSION_STRING=os.getenv("TELEGRAM_SESSION_STRING"),
    CHANNEL_USERNAME=os.getenv("TELEGRAM_CHANNEL_USERNAME"),
    DAY_LIMIT=int(os.getenv("DAY_LIMIT") or 7),
)


class TelegramProcessor:
    def __init__(self, config: Config):
        self.config = config
        self.client = TelegramClient(
            StringSession(config.SESSION_STRING), config.API_ID, config.API_HASH
        )
        self.py_time_zone = pytz.timezone(config.TIME_ZONE)

    @staticmethod
    def extract_tags(text: str) -> Tuple[str, List[str]]:
        if not text:
            return text, []

        if "\n" not in text:
            tags = re.findall(r"#(\w+)", text) or []
            if tags:
                return "", tags
            return text, []

        last_line = text.strip().split("\n")[-1]
        tags = re.findall(r"#(\w+)", last_line) or []
        if tags:
            text = "\n".join(text.strip().split("\n")[:-1])
        return text, tags

    @staticmethod
    def custom_filename(message: Message, file_path: str) -> str:
        _, ext = os.path.splitext(file_path)
        date_str = message.date.strftime("%Y%m%d%H%M%S")
        return f"{message.id}_{date_str}{ext}"

    async def get_messages_in_range(
        self,
        channel: Channel,
        start_date: datetime,
        end_date: datetime,
        limit: int = None,
    ) -> List[Message]:
        messages = []

        if start_date > end_date:
            start_date, end_date = end_date, start_date

        async for message in self.client.iter_messages(
            channel, limit=limit, offset_date=start_date, reverse=True
        ):
            if message.date < start_date:
                break
            if start_date <= message.date <= end_date:
                messages.append(message)

        return messages

    async def process_messages(self) -> Dict[str, Dict[str, Any]]:
        async with self.client:
            channel = await self.client.get_entity(self.config.CHANNEL_USERNAME)
            now = datetime.now(self.py_time_zone)
            start_date = (now - timedelta(days=self.config.DAY_LIMIT)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            end_date = now

            start_date_utc = start_date.astimezone(pytz.utc)
            end_date_utc = end_date.astimezone(pytz.utc)

            messages = await self.get_messages_in_range(
                channel, start_date_utc, end_date_utc
            )
            return await self.process_message_groups(messages)

    async def process_message_groups(
        self, messages: List[Message]
    ) -> Dict[str, Dict[str, Any]]:
        updates = {}
        message_group = []

        for message in reversed(messages):
            if not message_group or (
                message.grouped_id
                and message.grouped_id == message_group[-1].grouped_id
            ):
                message_group.append(message)
            else:
                await self.process_and_update(message_group, updates)
                message_group = [message]

        if message_group:
            await self.process_and_update(message_group, updates)

        return updates

    async def process_and_update(
        self, message_group: List[Message], updates: Dict[str, Dict[str, Any]]
    ):
        date, group_data, media_files = await self.process_message_group(message_group)
        if not (group_data["text"] or group_data["photos"]):
            return

        month = date[:7]  # YYYY-mm
        if month not in updates:
            updates[month] = {"content": {}, "media": []}
        if date not in updates[month]["content"]:
            updates[month]["content"][date] = []
        updates[month]["content"][date].append(group_data)
        updates[month]["media"].extend(media_files)

    async def fetch_sender_info(self, from_id):
        info = {}
        if isinstance(from_id, PeerChannel):
            info["from_type"] = "channel"
            info["from_id"] = str(from_id.channel_id)
        elif isinstance(from_id, PeerUser):
            info["from_type"] = "user"
            info["from_id"] = str(from_id.user_id)
        elif isinstance(from_id, PeerChat):
            info["from_type"] = "chat"
            info["from_id"] = str(from_id.chat_id)
        return info

    async def process_message_group(
        self, messages: List[Message]
    ) -> Tuple[str, Dict[str, Any], List[Tuple[str, str]]]:
        first_message = messages[0]
        utc_date = first_message.date
        local_date = utc_date.replace(tzinfo=pytz.utc).astimezone(self.py_time_zone)

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
            "forwarded_info": None,
        }
        media_files = []
        for message in messages:
            text = message.text or ""
            media = message.media

            if not text and not media:
                continue

            text, tags = self.extract_tags(text)
            group_data["tags"].update(tags)
            group_data["text"] = "\n".join([group_data["text"], text]).strip()

            if message.forward:
                forward = message.forward
                forward_info = {
                    "from_id": str(forward.from_id) if forward.from_id else None,
                    "from_name": forward.from_name
                    or getattr(forward, "post_author", None)
                    or getattr(forward, "sender", None),
                    "channel_post": forward.channel_post,
                    "created_at": (
                        forward.date.strftime("%Y-%m-%d %H:%M:%S")
                        if forward.date
                        else None
                    ),
                }

                if forward.from_id:
                    info = await self.fetch_sender_info(forward.from_id)
                    forward_info.update(info)

                group_data["forwarded_info"] = forward_info

            if media and message.file:
                fn = str(message.file.name)
                path = await message.download_media(
                    file=self.custom_filename(message, fn)
                )
                if path:
                    width, height = imagesize.get(path)
                    media_files.append((f"{date}/{path}", path))
                    group_data["photos"].append(
                        {
                            "path": path,
                            "width": width,
                            "height": height,
                            "id": message.id,
                        }
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
                        ).astimezone(self.py_time_zone)
                        replied_text = getattr(replied_msg, "message", "")
                        from_id = (
                            str(replied_msg.sender_id)
                            if replied_msg.sender_id
                            else None
                        )

                        group_data["quoted_message"] = {
                            "id": replied_msg.id,
                            "text": (
                                replied_text[:80] + "..."
                                if replied_text and len(replied_text) > 80
                                else (replied_text or "")
                            ),
                            "from_id": from_id,
                            "created_at": replied_local_date.strftime(
                                "%Y-%m-%d %H:%M:%S"
                            ),
                        }
                        if from_id:
                            info = await self.fetch_sender_info(from_id)
                            group_data["quoted_message"].update(info)

                except Exception as e:
                    logging.error(
                        f"Error fetching replied message for {message.id}: {e}"
                    )

        group_data["tags"] = sorted(list(group_data["tags"]))
        group_data["photos"] = list(reversed(group_data["photos"]))

        return date, group_data, media_files


class GithubUpdater:
    def __init__(self, config: Config):
        self.config = config
        self.g = Github(config.GITHUB_TOKEN)
        self.repo = self.g.get_repo(config.GITHUB_REPO)

    def update_repository(self, updates: Dict[str, Dict[str, Any]]):
        self.ensure_branch_exists()
        branch_ref = self.repo.get_git_ref(f"heads/{self.config.GITHUB_BRANCH}")
        branch_sha = branch_ref.object.sha

        element_list = self.prepare_updates(updates)

        if not element_list:
            logging.info("No new updates found. Skipping commit.")
            return

        logging.info(f"Updating repository with: {element_list}")

        self.create_commit(element_list, branch_sha, branch_ref)

    def ensure_branch_exists(self):
        branch = self.config.GITHUB_BRANCH
        try:
            self.repo.get_branch(branch)
        except GithubException:
            logging.info(f"Branch {branch} does not exist. Creating it...")
            sb = self.repo.get_branch(self.repo.default_branch)
            self.repo.create_git_ref(ref=f"refs/heads/{branch}", sha=sb.commit.sha)
            logging.info(f"Branch {branch} created successfully.")

    def prepare_updates(
        self, updates: Dict[str, Dict[str, Any]]
    ) -> List[InputGitTreeElement]:
        element_list = []
        for month, data in updates.items():
            self.update_daily_files(month, data, element_list)
            self.update_monthly_file(month, data, element_list)
            self.update_media_files(month, data, element_list)
        return element_list

    def update_daily_files(
        self, month: str, data: Dict[str, Any], element_list: List[InputGitTreeElement]
    ):
        for date, content in data["content"].items():
            file_path = f"{self.config.GITHUB_FOLDER}{month}/{date}/data.json"
            content_json = json.dumps(
                content, ensure_ascii=False, separators=(",", ":")
            )
            if self.content_changed(file_path, content_json):
                element_list.append(
                    InputGitTreeElement(file_path, "100644", "blob", content_json)
                )
            else:
                logging.info(f"No changes in {file_path}. Skipping.")

    def update_monthly_file(
        self, month: str, data: Dict[str, Any], element_list: List[InputGitTreeElement]
    ):
        monthly_file_path = f"{self.config.GITHUB_FOLDER}{month}/data.json"
        existing_monthly_data = self.get_file_content(monthly_file_path) or []

        new_monthly_data = []
        for date in sorted(data["content"].keys()):
            new_monthly_data.extend(data["content"][date])

        combined_data = existing_monthly_data + new_monthly_data
        combined_data = sorted(
            {item["id"]: item for item in combined_data}.values(),
            key=lambda x: x["id"],
            reverse=True,
        )
        monthly_content = json.dumps(
            combined_data, ensure_ascii=False, separators=(",", ":")
        )
        if self.content_changed(monthly_file_path, monthly_content):
            element_list.append(
                InputGitTreeElement(
                    monthly_file_path, "100644", "blob", monthly_content
                )
            )
        else:
            logging.info(f"No changes in {monthly_file_path}. Skipping.")

    def update_media_files(
        self, month: str, data: Dict[str, Any], element_list: List[InputGitTreeElement]
    ):
        for media_path, local_path in data["media"]:
            with open(local_path, "rb") as file:
                data = base64.b64encode(file.read())
                blob = self.repo.create_git_blob(data.decode("utf-8"), "base64")
                github_media_path = f"{self.config.GITHUB_FOLDER}{month}/{media_path}"
                if self.content_changed(github_media_path, data.decode("utf-8")):
                    element_list.append(
                        InputGitTreeElement(
                            github_media_path, "100644", "blob", sha=blob.sha
                        )
                    )
            os.remove(local_path)

    def get_file_content(self, path: str) -> Any:
        try:
            content = self.repo.get_contents(path, ref=self.config.GITHUB_BRANCH)
            return json.loads(content.decoded_content.decode("utf-8"))
        except GithubException:
            return None

    def content_changed(self, file_path: str, new_content: str) -> bool:
        try:
            old_content = self.repo.get_contents(
                file_path, ref=self.config.GITHUB_BRANCH
            )

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

    def create_commit(
        self, element_list: List[InputGitTreeElement], branch_sha: str, branch_ref: Any
    ):
        base_tree = self.repo.get_git_tree(branch_sha)
        tree = self.repo.create_git_tree(element_list, base_tree)
        parent = self.repo.get_git_commit(branch_sha)
        commit = self.repo.create_git_commit(
            f"Update for {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", tree, [parent]
        )
        branch_ref.edit(commit.sha)


async def main():
    telegram_processor = TelegramProcessor(config)
    github_updater = GithubUpdater(config)

    try:
        updates = await telegram_processor.process_messages()
        github_updater.update_repository(updates)

        logging.info(
            f"Successfully updated repository with changes for months: {', '.join(updates.keys())}"
        )
    except Exception as e:
        logging.error(f"An error occurred: {e}")


if __name__ == "__main__":
    asyncio.run(main())
