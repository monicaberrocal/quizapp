#!/bin/sh

python3 --version
which python3

pip install --no-cache-dir --upgrade pip setuptools wheel
pip install --no-cache-dir -r requirements.txt

celery -A testapp worker --loglevel=info --uid=nobody --gid=nogroup