FROM node:latest

RUN mkdir -p /workspace

WORKDIR /workspace

RUN npm config set registry https://registry.npmmirror.com

RUN cd /workspace

RUN git clone https://github.com/setube/idle-wild-my-survival-saga.git

RUN mv ./idle-wild-my-survival-saga/* . ; rm -rf ./idle-wild-my-survival-saga/

RUN npm install -g pnpm ; pnpm install ; npx vite build

CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "2543"]