# Multi-stage Dockerfile for Mini Banking Transaction System
# Graphic Era Hill University - Team GHOST

FROM debian:bookworm-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    g++ \
    make \
    libpq-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

RUN make -j$(nproc)

# Runtime image
FROM debian:bookworm-slim AS runner

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/banking /app/banking
COPY sql/ /app/sql/

ENV PORT=8080
EXPOSE 8080

CMD ["./banking"]
