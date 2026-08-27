#!/usr/bin/env python3
"""Extract the final complete assistant message from the newest freebuff chat.

Usage: freebuff-extract.py CHAT_ROOT [PRE_SNAPSHOT]

  CHAT_ROOT     base dir holding per-project chats (e.g. ~/.config/manicode/projects)
  PRE_SNAPSHOT  path of the newest chat-messages.json captured before the run (optional)

Exit 0 and print the message when a new complete AI message exists.
Exit 1 otherwise (no result yet / not finished). The caller polls until exit 0.
"""
import glob
import json
import os
import sys


def newest_chat_file(chat_root):
    files = glob.glob(os.path.join(chat_root, "*", "chats", "*", "chat-messages.json"))
    if not files:
        return None
    return max(files, key=os.path.getmtime)


def main():
    if len(sys.argv) < 2:
        print("usage: freebuff-extract.py CHAT_ROOT [PRE_SNAPSHOT]", file=sys.stderr)
        sys.exit(1)
    chat_root = sys.argv[1]
    pre_snapshot = sys.argv[2] if len(sys.argv) > 2 else ""

    path = newest_chat_file(chat_root)
    if not path:
        sys.exit(1)

    if pre_snapshot:
        try:
            if os.path.getmtime(path) <= os.path.getmtime(pre_snapshot):
                sys.exit(1)
        except OSError:
            pass

    try:
        with open(path, encoding="utf-8") as fh:
            messages = json.load(fh)
    except (ValueError, OSError):
        sys.exit(1)  # mid-write; retry on the next poll

    for message in reversed(messages):
        if message.get("variant") != "ai" or not message.get("isComplete"):
            continue
        parts = []
        for block in message.get("blocks", []):
            if block.get("type") == "text" and block.get("textType") == "text":
                text = (block.get("content") or "").strip()
                if text:
                    parts.append(text)
        output = "\n".join(parts).strip()
        if output:
            print(output)
            sys.exit(0)
    sys.exit(1)


if __name__ == "__main__":
    main()
