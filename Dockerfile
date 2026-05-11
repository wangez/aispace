FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# 1. 安装 MongoDB + Node.js + 进程管理
RUN apt-get update && apt-get install -y \
    gnupg curl wget \
    && curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg \
    && echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] http://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list \
    && curl -sL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get update && apt-get install -y \
    nodejs \
    mongodb-org \
    supervisor \
    && apt-get clean

WORKDIR /app

# 2. 复制源码
COPY ./aispace .

# 3. 分别安装 server 和 web 的依赖
RUN cd server && npm ci --registry=https://registry.npmmirror.com
RUN npm run init
RUN cd front && npm ci --registry=https://registry.npmmirror.com

# 6. 复制 supervisor 配置
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# 7. 暴露端口
EXPOSE 3000 8080 27017 8000

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf"]