nix-channel --update && \
nix-env -iA nixpkgs.python3Full && \
pip install --no-cache-dir --upgrade pip setuptools wheel && \
pip install --no-cache-dir -r requirements.txt && \
celery -A testapp worker --loglevel=info --uid=nobody --gid=nogroup