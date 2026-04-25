FROM node:20-bookworm

ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1
ENV APP_ROOT=/app
ENV VIRTUAL_ENV=/opt/venv
ENV PATH="/opt/venv/bin:${PATH}"
ENV ML_PYTHON_BIN=/opt/venv/bin/python
ENV PORT=6060

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-pip python3-venv build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY ml/requirements.txt /app/ml/requirements.txt
RUN python3 -m venv /opt/venv \
    && /opt/venv/bin/python -m pip install --upgrade pip setuptools wheel \
    && /opt/venv/bin/python -m pip install -r /app/ml/requirements.txt

COPY web/package*.json /app/web/
WORKDIR /app/web
RUN npm ci

WORKDIR /app
COPY . /app

RUN sed -i 's/\r$//' /app/docker/entrypoint.sh \
    && chmod +x /app/docker/entrypoint.sh

EXPOSE 6060

WORKDIR /app/ml

ENTRYPOINT ["/app/docker/entrypoint.sh"]
