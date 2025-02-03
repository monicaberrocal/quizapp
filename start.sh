#!/bin/sh

pip install --no-cache-dir --upgrade pip setuptools wheel
pip install --no-cache-dir -r requirements.txt

sudo apt-file search pkgfile

celery -A testapp worker --loglevel=info --uid=nobody --gid=nogroup