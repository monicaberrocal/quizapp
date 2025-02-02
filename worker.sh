#!/bin/bash
celery -A quiz worker --loglevel=info
